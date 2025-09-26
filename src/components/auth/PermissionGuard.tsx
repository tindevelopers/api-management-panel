'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Permission, RoleType } from '@/types/multi-role'

interface PermissionGuardProps {
  children: React.ReactNode
  permission?: Permission
  role?: RoleType
  organizationId?: string
  fallback?: React.ReactNode
  redirectTo?: string
  requireAll?: boolean
  permissions?: Permission[]
  roles?: RoleType[]
}

interface UserPermissions {
  permissions: Permission[]
  roles: Array<{
    role_type: RoleType
    organization_id?: string
  }>
  isSystemAdmin: boolean
}

export default function PermissionGuard({
  children,
  permission,
  role,
  organizationId,
  fallback = null,
  redirectTo = '/dashboard',
  requireAll = false,
  permissions = [],
  roles = []
}: PermissionGuardProps) {
  const [, setUserPermissions] = useState<UserPermissions | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const router = useRouter()

  const checkAccess = useCallback((userPerms: UserPermissions): boolean => {
    // System admins have access to everything
    if (userPerms.isSystemAdmin) {
      return true
    }

    // Check single permission
    if (permission) {
      return userPerms.permissions.includes(permission)
    }

    // Check single role
    if (role) {
      return userPerms.roles.some(userRole => 
        userRole.role_type === role && 
        (!organizationId || userRole.organization_id === organizationId)
      )
    }

    // Check multiple permissions
    if (permissions.length > 0) {
      if (requireAll) {
        return permissions.every(perm => userPerms.permissions.includes(perm))
      } else {
        return permissions.some(perm => userPerms.permissions.includes(perm))
      }
    }

    // Check multiple roles
    if (roles.length > 0) {
      if (requireAll) {
        return roles.every(requiredRole => 
          userPerms.roles.some(userRole => 
            userRole.role_type === requiredRole &&
            (!organizationId || userRole.organization_id === organizationId)
          )
        )
      } else {
        return roles.some(requiredRole => 
          userPerms.roles.some(userRole => 
            userRole.role_type === requiredRole &&
            (!organizationId || userRole.organization_id === organizationId)
          )
        )
      }
    }

    // If no specific requirements, allow access
    return true
  }, [permission, role, organizationId, permissions, roles, requireAll])

  const checkPermissions = useCallback(async () => {
    try {
      setLoading(true)
      
      // Fetch user permissions from API
      const response = await fetch('/api/auth/permissions')
      
      if (!response.ok) {
        throw new Error('Failed to fetch permissions')
      }
      
      const data = await response.json()
      setUserPermissions(data)
      
      // Check access
      const access = checkAccess(data)
      setHasAccess(access)
      
      // Redirect if no access and redirectTo is specified
      if (!access && redirectTo) {
        router.push(redirectTo)
      }
      
    } catch (error) {
      console.error('Error checking permissions:', error)
      setHasAccess(false)
      if (redirectTo) {
        router.push(redirectTo)
      }
    } finally {
      setLoading(false)
    }
  }, [redirectTo, router, checkAccess])

  useEffect(() => {
    checkPermissions()
  }, [permission, role, organizationId, permissions, roles, checkPermissions])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!hasAccess) {
    return fallback ? <>{fallback}</> : null
  }

  return <>{children}</>
}

// Higher-order component for protecting pages
export function withPermissionGuard<P extends object>(
  Component: React.ComponentType<P>,
  guardProps: Omit<PermissionGuardProps, 'children'>
) {
  return function ProtectedComponent(props: P) {
    return (
      <PermissionGuard {...guardProps}>
        <Component {...props} />
      </PermissionGuard>
    )
  }
}

// Hook for checking permissions in components
export function usePermissions() {
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPermissions()
  }, [])

  const fetchPermissions = async () => {
    try {
      const response = await fetch('/api/auth/permissions')
      if (response.ok) {
        const data = await response.json()
        setPermissions(data)
      }
    } catch (error) {
      console.error('Error fetching permissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const hasPermission = (permission: Permission): boolean => {
    if (!permissions) return false
    if (permissions.isSystemAdmin) return true
    return permissions.permissions.includes(permission)
  }

  const hasRole = (role: RoleType, organizationId?: string): boolean => {
    if (!permissions) return false
    if (permissions.isSystemAdmin) return true
    return permissions.roles.some(userRole => 
      userRole.role_type === role &&
      (!organizationId || userRole.organization_id === organizationId)
    )
  }

  const hasAnyRole = (roles: RoleType[], organizationId?: string): boolean => {
    if (!permissions) return false
    if (permissions.isSystemAdmin) return true
    return roles.some(role => hasRole(role, organizationId))
  }

  const hasAllPermissions = (requiredPermissions: Permission[]): boolean => {
    if (!permissions) return false
    if (permissions.isSystemAdmin) return true
    return requiredPermissions.every(perm => permissions.permissions.includes(perm))
  }

  return {
    permissions,
    loading,
    hasPermission,
    hasRole,
    hasAnyRole,
    hasAllPermissions,
    isSystemAdmin: permissions?.isSystemAdmin || false,
    refetch: fetchPermissions
  }
}
