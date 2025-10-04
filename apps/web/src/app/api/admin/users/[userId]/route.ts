import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireSystemAdmin, requirePermission } from '@/lib/permissions'
import { Permission } from '@/types/multi-role'
import { RoleType } from '@/types/multi-role'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
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

    // Check if user has permission to view user details
    await requirePermission(user.id, Permission.MANAGE_SYSTEM_USERS)

    const { userId } = await params

    // Fetch user details with profile, roles, and organizations
    const { data: userData, error: userDataError } = await supabase
      .from('auth.users')
      .select(`
        id,
        email,
        created_at,
        last_sign_in_at,
        raw_user_meta_data,
        profiles:profiles!inner(
          id,
          full_name,
          avatar_url,
          phone,
          timezone,
          preferences,
          last_login_at,
          is_active
        )
      `)
      .eq('id', userId)
      .single()

    if (userDataError) {
      console.error('Error fetching user data:', userDataError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get user roles with organizations
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError)
    }

    // Get user invitations
    const { data: invitations, error: invitationsError } = await supabase
      .from('user_invitations')
      .select(`
        *,
        organization:organizations(*),
        invited_by_user:profiles!user_invitations_invited_by_fkey(full_name, email)
      `)
      .eq('email', userData.email)

    if (invitationsError) {
      console.error('Error fetching user invitations:', invitationsError)
    }

    // Get audit logs for this user
    const { data: auditLogs, error: auditLogsError } = await supabase
      .from('audit_logs')
      .select(`
        *,
        organization:organizations(name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (auditLogsError) {
      console.error('Error fetching audit logs:', auditLogsError)
    }

    const userWithDetails = {
      ...userData,
      profile: userData.profiles?.[0],
      roles: roles || [],
      invitations: invitations || [],
      recent_activity: auditLogs || []
    }

    return NextResponse.json({
      user: userWithDetails
    })

  } catch (error: unknown) {
    console.error('Error in user details API:', error)
    
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
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

    const { userId } = await params
    const body = await request.json()
    const { action, ...updateData } = body

    let result

    switch (action) {
      case 'update_profile':
        result = await updateUserProfile(supabase, userId, updateData)
        break
      case 'assign_role':
        result = await assignUserRole(supabase, userId, updateData, user.id)
        break
      case 'remove_role':
        result = await removeUserRole(supabase, userId, updateData)
        break
      case 'activate':
        result = await activateUser(supabase, userId)
        break
      case 'deactivate':
        result = await deactivateUser(supabase, userId)
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

    return NextResponse.json({
      message: 'User updated successfully',
      data: result.data
    })

  } catch (error: unknown) {
    console.error('Error updating user:', error)
    
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
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

    const { userId } = await params

    // Prevent self-deletion
    if (userId === user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Check if user has any critical roles that would prevent deletion
    const { data: criticalRoles } = await supabase
      .from('user_roles')
      .select('role_type, organization_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .in('role_type', [RoleType.SYSTEM_ADMIN])

    if (criticalRoles && criticalRoles.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete user with system admin roles. Remove roles first.' },
        { status: 400 }
      )
    }

    // Soft delete: deactivate user and remove all roles
    const { error: deactivateError } = await supabase
      .from('profiles')
      .update({ is_active: false })
      .eq('id', userId)

    if (deactivateError) {
      console.error('Error deactivating user:', deactivateError)
      return NextResponse.json(
        { error: 'Failed to deactivate user' },
        { status: 500 }
      )
    }

    // Remove all user roles
    const { error: rolesError } = await supabase
      .from('user_roles')
      .update({ is_active: false })
      .eq('user_id', userId)

    if (rolesError) {
      console.error('Error removing user roles:', rolesError)
    }

    // Log the deletion
    await supabase.rpc('log_audit_event', {
      p_user_id: user.id,
      p_organization_id: null,
      p_action: 'user.delete',
      p_resource_type: 'user',
      p_resource_id: userId,
      p_old_values: {},
      p_new_values: { deleted: true },
      p_ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1',
      p_user_agent: request.headers.get('user-agent') || ''
    })

    return NextResponse.json({
      message: 'User deleted successfully'
    })

  } catch (error: unknown) {
    console.error('Error deleting user:', error)
    
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
async function updateUserProfile(supabase: any, userId: string, data: any) {
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: data.full_name,
      phone: data.phone,
      timezone: data.timezone,
      preferences: data.preferences
    })
    .eq('id', userId)

  if (error) {
    return { error: 'Failed to update user profile' }
  }

  return { data: { message: 'Profile updated successfully' } }
}

async function assignUserRole(supabase: any, userId: string, data: any, assignedBy: string) {
  const { organization_id, role_type, permissions = [] } = data

  // Check if role already exists
  const { data: existingRole } = await supabase
    .from('user_roles')
    .select('id')
    .eq('user_id', userId)
    .eq('organization_id', organization_id)
    .eq('role_type', role_type)
    .eq('is_active', true)
    .single()

  if (existingRole) {
    return { error: 'User already has this role in this organization' }
  }

  const { error } = await supabase
    .from('user_roles')
    .insert({
      user_id: userId,
      organization_id,
      role_type,
      permissions,
      created_by: assignedBy
    })

  if (error) {
    return { error: 'Failed to assign role' }
  }

  return { data: { message: 'Role assigned successfully' } }
}

async function removeUserRole(supabase: any, userId: string, data: any) {
  const { role_id } = data

  const { error } = await supabase
    .from('user_roles')
    .update({ is_active: false })
    .eq('id', role_id)
    .eq('user_id', userId)

  if (error) {
    return { error: 'Failed to remove role' }
  }

  return { data: { message: 'Role removed successfully' } }
}

async function activateUser(supabase: any, userId: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: true })
    .eq('id', userId)

  if (error) {
    return { error: 'Failed to activate user' }
  }

  return { data: { message: 'User activated successfully' } }
}

async function deactivateUser(supabase: any, userId: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: false })
    .eq('id', userId)

  if (error) {
    return { error: 'Failed to deactivate user' }
  }

  return { data: { message: 'User deactivated successfully' } }
}
