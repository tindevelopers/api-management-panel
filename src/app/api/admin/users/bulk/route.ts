import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePermission, Permission } from '@/lib/permissions'
import { RoleType } from '@/types/multi-role'

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user and verify permissions
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await requirePermission(user.id, Permission.MANAGE_SYSTEM_USERS)

    const { userIds, action, ...actionData } = await request.json()

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'User IDs are required' },
        { status: 400 }
      )
    }

    if (userIds.length > 100) {
      return NextResponse.json(
        { error: 'Cannot process more than 100 users at once' },
        { status: 400 }
      )
    }

    let result

    switch (action) {
      case 'activate':
        result = await bulkActivateUsers(supabase, userIds)
        break
      case 'deactivate':
        result = await bulkDeactivateUsers(supabase, userIds)
        break
      case 'assign_role':
        result = await bulkAssignRole(supabase, userIds, actionData, user.id)
        break
      case 'remove_roles':
        result = await bulkRemoveRoles(supabase, userIds, actionData)
        break
      case 'delete':
        result = await bulkDeleteUsers(supabase, userIds, user.id)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    // Log bulk action
    await supabase.rpc('log_audit_event', {
      p_user_id: user.id,
      p_organization_id: null,
      p_action: `bulk.${action}`,
      p_resource_type: 'users',
      p_resource_id: null,
      p_old_values: {},
      p_new_values: { 
        action,
        user_count: userIds.length,
        user_ids: userIds 
      },
      p_ip_address: request.ip || '127.0.0.1',
      p_user_agent: request.headers.get('user-agent') || ''
    })

    return NextResponse.json({
      message: `Bulk ${action} completed successfully`,
      processed: result.processed,
      failed: result.failed,
      details: result.details
    })

  } catch (error: unknown) {
    console.error('Error in bulk user operations:', error)
    
    if (error && typeof error === 'object' && 'name' in error && error.name === 'PermissionError') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper functions
async function bulkActivateUsers(supabase: any, userIds: string[]) {
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: true })
    .in('id', userIds)

  if (error) {
    return { error: 'Failed to activate users' }
  }

  return {
    processed: userIds.length,
    failed: 0,
    details: { activated: userIds.length }
  }
}

async function bulkDeactivateUsers(supabase: any, userIds: string[]) {
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: false })
    .in('id', userIds)

  if (error) {
    return { error: 'Failed to deactivate users' }
  }

  return {
    processed: userIds.length,
    failed: 0,
    details: { deactivated: userIds.length }
  }
}

async function bulkAssignRole(supabase: any, userIds: string[], data: any, assignedBy: string) {
  const { organization_id, role_type, permissions = [] } = data

  if (!organization_id || !role_type) {
    return { error: 'Organization ID and role type are required' }
  }

  // Check which users don't already have this role
  const { data: existingRoles } = await supabase
    .from('user_roles')
    .select('user_id')
    .in('user_id', userIds)
    .eq('organization_id', organization_id)
    .eq('role_type', role_type)
    .eq('is_active', true)

  const existingUserIds = existingRoles?.map(role => role.user_id) || []
  const newUserIds = userIds.filter(id => !existingUserIds.includes(id))

  if (newUserIds.length === 0) {
    return {
      processed: 0,
      failed: userIds.length,
      details: { 
        message: 'All users already have this role',
        already_had_role: userIds.length
      }
    }
  }

  // Insert new roles
  const rolesToInsert = newUserIds.map(user_id => ({
    user_id,
    organization_id,
    role_type,
    permissions,
    created_by: assignedBy
  }))

  const { error } = await supabase
    .from('user_roles')
    .insert(rolesToInsert)

  if (error) {
    return { error: 'Failed to assign roles' }
  }

  return {
    processed: newUserIds.length,
    failed: existingUserIds.length,
    details: { 
      assigned: newUserIds.length,
      already_had_role: existingUserIds.length
    }
  }
}

async function bulkRemoveRoles(supabase: any, userIds: string[], data: any) {
  const { organization_id, role_type } = data

  if (!organization_id) {
    return { error: 'Organization ID is required' }
  }

  let query = supabase
    .from('user_roles')
    .update({ is_active: false })
    .in('user_id', userIds)
    .eq('organization_id', organization_id)

  if (role_type) {
    query = query.eq('role_type', role_type)
  }

  const { error } = await query

  if (error) {
    return { error: 'Failed to remove roles' }
  }

  return {
    processed: userIds.length,
    failed: 0,
    details: { roles_removed: userIds.length }
  }
}

async function bulkDeleteUsers(supabase: any, userIds: string[], deletedBy: string) {
  // Check for system admins that cannot be deleted
  const { data: criticalRoles } = await supabase
    .from('user_roles')
    .select('user_id, role_type')
    .in('user_id', userIds)
    .eq('is_active', true)
    .in('role_type', [RoleType.SYSTEM_ADMIN])

  const criticalUserIds = criticalRoles?.map(role => role.user_id) || []
  const deletableUserIds = userIds.filter(id => !criticalUserIds.includes(id))

  if (deletableUserIds.length === 0) {
    return {
      processed: 0,
      failed: userIds.length,
      details: { 
        message: 'No users can be deleted (system admins protected)',
        protected_users: userIds.length
      }
    }
  }

  // Deactivate users
  const { error: deactivateError } = await supabase
    .from('profiles')
    .update({ is_active: false })
    .in('id', deletableUserIds)

  if (deactivateError) {
    return { error: 'Failed to deactivate users' }
  }

  // Remove all roles for deletable users
  const { error: rolesError } = await supabase
    .from('user_roles')
    .update({ is_active: false })
    .in('user_id', deletableUserIds)

  if (rolesError) {
    console.error('Error removing user roles:', rolesError)
  }

  return {
    processed: deletableUserIds.length,
    failed: criticalUserIds.length,
    details: { 
      deleted: deletableUserIds.length,
      protected: criticalUserIds.length
    }
  }
}
