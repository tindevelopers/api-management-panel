import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  Permission, 
  RoleType, 
  ROLE_HIERARCHY,
  getUserPermissions,
  getUserRolesInOrganization,
  isSystemAdmin 
} from '@/lib/permissions'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user roles
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select(`
        role_type,
        organization_id,
        permissions,
        organization:organizations(id, name, slug)
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .or('expires_at.is.null,expires_at.gt.now()')

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError)
      return NextResponse.json(
        { error: 'Failed to fetch user roles' },
        { status: 500 }
      )
    }

    // Get all permissions for the user
    const permissions = await getUserPermissions(user.id)
    
    // Check if user is system admin
    const systemAdmin = await isSystemAdmin(user.id)

    // Get user organizations
    const organizations = roles
      ?.filter(role => role.organization_id)
      .map(role => role.organization)
      .filter(Boolean) || []

    // Remove duplicates
    const uniqueOrganizations = organizations.filter((org, index, self) => 
      index === self.findIndex(o => o.id === org.id)
    )

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      permissions: permissions || [],
      roles: roles || [],
      organizations: uniqueOrganizations,
      isSystemAdmin: systemAdmin
    })

  } catch (error) {
    console.error('Error in permissions API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { permission, organizationId, resourceId } = await request.json()
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check specific permission
    const hasAccess = await checkPermission(user.id, permission, organizationId, resourceId)

    return NextResponse.json({
      hasAccess,
      permission,
      organizationId,
      resourceId
    })

  } catch (error) {
    console.error('Error checking permission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function checkPermission(
  userId: string,
  permission: Permission,
  organizationId?: string,
  resourceId?: string
): Promise<boolean> {
  try {
    const supabase = await createClient()
    
    // Check if user is system admin (has all permissions)
    const isAdmin = await isSystemAdmin(userId)
    if (isAdmin) {
      return true
    }

    // Check user roles and permissions
    const { data: roles, error } = await supabase
      .from('user_roles')
      .select(`
        role_type,
        permissions,
        organization_id
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .or('expires_at.is.null,expires_at.gt.now()')

    if (error || !roles) {
      return false
    }

    for (const role of roles) {
      // Check if organization matches (if specified)
      if (organizationId && role.organization_id !== organizationId) {
        continue
      }

      // Check role-based permissions
      const rolePermissions = ROLE_HIERARCHY[role.role_type as RoleType] || []
      if (rolePermissions.includes(permission)) {
        return true
      }

      // Check explicit permissions
      if (role.permissions && Array.isArray(role.permissions) && role.permissions.includes(permission)) {
        return true
      }
    }

    return false
  } catch (error) {
    console.error('Error checking permission:', error)
    return false
  }
}
