// =====================================================
// Permission Checking Utilities
// =====================================================

import { createClient } from '@/lib/supabase/server'
import { 
  Permission, 
  RoleType, 
  ROLE_HIERARCHY, 
  PermissionError,
  UserRole,
  Organization 
} from '@/types/multi-role'

// =====================================================
// PERMISSION CHECKING FUNCTIONS
// =====================================================

/**
 * Check if a user has a specific permission
 */
export async function hasPermission(
  userId: string,
  permission: Permission,
  organizationId?: string
): Promise<boolean> {
  try {
    const supabase = await createClient()
    
    // Check if user is system admin (has all permissions)
    const { data: systemAdminRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .eq('role_type', RoleType.SYSTEM_ADMIN)
      .eq('is_active', true)
      .is('expires_at', null)
      .single()
    
    if (systemAdminRole) {
      return true
    }
    
    // Check specific permission in user roles
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select(`
        role_type,
        permissions,
        organization_id
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .or('expires_at.is.null,expires_at.gt.now()')
    
    if (!userRoles || userRoles.length === 0) {
      return false
    }
    
    for (const role of userRoles) {
      // Check if organization matches (if specified)
      if (organizationId && role.organization_id !== organizationId) {
        continue
      }
      
      // Check if role has the permission
      if (hasRolePermission(role.role_type as RoleType, permission)) {
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

/**
 * Check if a role type has a specific permission
 */
export function hasRolePermission(roleType: RoleType, permission: Permission): boolean {
  const rolePermissions = ROLE_HIERARCHY[roleType] || []
  return rolePermissions.includes(permission)
}

/**
 * Get all permissions for a user
 */
export async function getUserPermissions(
  userId: string,
  organizationId?: string
): Promise<Permission[]> {
  try {
    const supabase = await createClient()
    
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select(`
        role_type,
        permissions,
        organization_id
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .or('expires_at.is.null,expires_at.gt.now()')
    
    if (!userRoles || userRoles.length === 0) {
      return []
    }
    
    const permissions = new Set<Permission>()
    
    for (const role of userRoles) {
      // Check if organization matches (if specified)
      if (organizationId && role.organization_id !== organizationId) {
        continue
      }
      
      // Add role-based permissions
      const rolePermissions = ROLE_HIERARCHY[role.role_type as RoleType] || []
      rolePermissions.forEach(permission => permissions.add(permission))
      
      // Add explicit permissions
      if (role.permissions && Array.isArray(role.permissions)) {
        role.permissions.forEach(permission => permissions.add(permission as Permission))
      }
    }
    
    return Array.from(permissions)
  } catch (error) {
    console.error('Error getting user permissions:', error)
    return []
  }
}

/**
 * Get user roles for a specific organization
 */
export async function getUserRolesInOrganization(
  userId: string,
  organizationId: string
): Promise<UserRole[]> {
  try {
    const supabase = await createClient()
    
    const { data: roles, error } = await supabase
      .from('user_roles')
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .or('expires_at.is.null,expires_at.gt.now()')
    
    if (error) {
      console.error('Error getting user roles:', error)
      return []
    }
    
    return roles || []
  } catch (error) {
    console.error('Error getting user roles:', error)
    return []
  }
}

/**
 * Get all organizations where user has a role
 */
export async function getUserOrganizations(userId: string): Promise<Organization[]> {
  try {
    const supabase = await createClient()
    
    const { data: roles, error } = await supabase
      .from('user_roles')
      .select(`
        organization:organizations!inner(*)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .or('expires_at.is.null,expires_at.gt.now()')
    
    if (error) {
      console.error('Error getting user organizations:', error)
      return []
    }
    
    const organizations = new Map<string, Organization>()
    
    if (roles && Array.isArray(roles)) {
      roles.forEach((role: { organization: Organization[] }) => {
        if (role.organization && Array.isArray(role.organization) && role.organization.length > 0) {
          const org = role.organization[0]
          if (org && typeof org === 'object' && 'id' in org) {
            organizations.set(org.id, org as Organization)
          }
        }
      })
    }
    
    return Array.from(organizations.values())
  } catch (error) {
    console.error('Error getting user organizations:', error)
    return []
  }
}

/**
 * Check if user is system admin
 */
export async function isSystemAdmin(userId: string): Promise<boolean> {
  return hasPermission(userId, Permission.SYSTEM_ADMIN)
}

/**
 * Check if user is organization admin
 */
export async function isOrganizationAdmin(
  userId: string,
  organizationId: string
): Promise<boolean> {
  return hasPermission(userId, Permission.ORG_ADMIN, organizationId)
}

// =====================================================
// PERMISSION GUARDS
// =====================================================

/**
 * Require a specific permission or throw error
 */
export async function requirePermission(
  userId: string,
  permission: Permission,
  organizationId?: string
): Promise<void> {
  const hasAccess = await hasPermission(userId, permission, organizationId)
  
  if (!hasAccess) {
    throw new PermissionError(permission, organizationId)
  }
}

/**
 * Require system admin permission
 */
export async function requireSystemAdmin(userId: string): Promise<void> {
  await requirePermission(userId, Permission.SYSTEM_ADMIN)
}

/**
 * Require organization admin permission
 */
export async function requireOrganizationAdmin(
  userId: string,
  organizationId: string
): Promise<void> {
  await requirePermission(userId, Permission.ORG_ADMIN, organizationId)
}

// =====================================================
// MIDDLEWARE HELPERS
// =====================================================

/**
 * Get current user with roles and permissions
 */
export async function getCurrentUserWithRoles() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return null
    }
    
    // Get user roles
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .or('expires_at.is.null,expires_at.gt.now()')
    
    if (rolesError) {
      console.error('Error getting user roles:', rolesError)
      return { user, roles: [], permissions: [] }
    }
    
    // Get all permissions
    const permissions = await getUserPermissions(user.id)
    
    return {
      user,
      roles: roles || [],
      permissions
    }
  } catch (error) {
    console.error('Error getting current user with roles:', error)
    return null
  }
}

/**
 * Check if user can access organization
 */
export async function canAccessOrganization(
  userId: string,
  organizationId: string
): Promise<boolean> {
  try {
    const supabase = await createClient()
    
    // Check if user has any role in the organization
    const { data: role } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .or('expires_at.is.null,expires_at.gt.now()')
      .single()
    
    return !!role
  } catch (error) {
    console.error('Error checking organization access:', error)
    return false
  }
}

// =====================================================
// ORGANIZATION HELPERS
// =====================================================

/**
 * Get organization by slug
 */
export async function getOrganizationBySlug(slug: string): Promise<Organization | null> {
  try {
    const supabase = await createClient()
    
    const { data: organization, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()
    
    if (error) {
      console.error('Error getting organization by slug:', error)
      return null
    }
    
    return organization
  } catch (error) {
    console.error('Error getting organization by slug:', error)
    return null
  }
}

/**
 * Check if organization slug is available
 */
export async function isOrganizationSlugAvailable(slug: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    
    const { data: organization } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .single()
    
    return !organization
  } catch (error) {
    console.error('Error checking organization slug availability:', error)
    return true
  }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Generate a slug from a name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

/**
 * Validate organization slug format
 */
export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9-]+$/
  return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 50
}

/**
 * Get role display name
 */
export function getRoleDisplayName(roleType: RoleType): string {
  const displayNames = {
    [RoleType.SYSTEM_ADMIN]: 'System Administrator',
    [RoleType.ORG_ADMIN]: 'Organization Administrator',
    [RoleType.USER]: 'User'
  }
  
  return displayNames[roleType] || roleType
}

/**
 * Get permission display name
 */
export function getPermissionDisplayName(permission: Permission): string {
  const displayNames: Record<Permission, string> = {
    // System Admin Permissions
    [Permission.SYSTEM_ADMIN]: 'System Administration',
    [Permission.MANAGE_ORGANIZATIONS]: 'Manage Organizations',
    [Permission.MANAGE_SYSTEM_USERS]: 'Manage System Users',
    [Permission.MANAGE_SYSTEM_APIS]: 'Manage System APIs',
    [Permission.VIEW_SYSTEM_ANALYTICS]: 'View System Analytics',
    
    // Organization Admin Permissions
    [Permission.ORG_ADMIN]: 'Organization Administration',
    [Permission.MANAGE_ORG_USERS]: 'Manage Organization Users',
    [Permission.MANAGE_ORG_APIS]: 'Manage Organization APIs',
    [Permission.VIEW_ORG_ANALYTICS]: 'View Organization Analytics',
    [Permission.MANAGE_ORG_SETTINGS]: 'Manage Organization Settings',
    [Permission.MANAGE_ORG_INVITATIONS]: 'Manage User Invitations',
    
    // User Permissions
    [Permission.USER_BASIC]: 'Basic User Access',
    [Permission.ACCESS_APIS]: 'Access APIs',
    [Permission.VIEW_PERSONAL_DASHBOARD]: 'View Personal Dashboard'
  }
  
  return displayNames[permission] || permission
}

/**
 * Check if user can manage another user
 */
export async function canManageUser(
  managerId: string,
  targetUserId: string,
  organizationId?: string
): Promise<boolean> {
  try {
    // System admins can manage anyone
    if (await isSystemAdmin(managerId)) {
      return true
    }
    
    // Organization admins can manage users in their organization
    if (organizationId && await isOrganizationAdmin(managerId, organizationId)) {
      return hasPermission(managerId, Permission.MANAGE_ORG_USERS, organizationId)
    }
    
    return false
  } catch (error) {
    console.error('Error checking user management permission:', error)
    return false
  }
}
