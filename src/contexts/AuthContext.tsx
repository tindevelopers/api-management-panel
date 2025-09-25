'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Permission, RoleType, Organization, ROLE_HIERARCHY } from '@/types/multi-role'

interface UserRole {
  id: string
  role_type: RoleType
  organization_id?: string
  permissions: Permission[]
  organization?: Organization
}

interface AuthState {
  user: User | null
  roles: UserRole[]
  permissions: Permission[]
  organizations: Organization[]
  isSystemAdmin: boolean
  loading: boolean
  currentOrganization: Organization | null
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  hasPermission: (permission: Permission, organizationId?: string) => boolean
  hasRole: (role: RoleType, organizationId?: string) => boolean
  hasAnyRole: (roles: RoleType[], organizationId?: string) => boolean
  hasAllPermissions: (permissions: Permission[], organizationId?: string) => boolean
  setCurrentOrganization: (organization: Organization | null) => void
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    roles: [],
    permissions: [],
    organizations: [],
    isSystemAdmin: false,
    loading: true,
    currentOrganization: null
  })

  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserData(session.user)
        } else if (event === 'SIGNED_OUT') {
          setAuthState({
            user: null,
            roles: [],
            permissions: [],
            organizations: [],
            isSystemAdmin: false,
            loading: false,
            currentOrganization: null
          })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [getSession, supabase.auth])

  const getSession = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await loadUserData(session.user)
      } else {
        setAuthState(prev => ({ ...prev, loading: false }))
      }
    } catch (error) {
      console.error('Error getting session:', error)
      setAuthState(prev => ({ ...prev, loading: false }))
    }
  }, [loadUserData, supabase.auth])

  const loadUserData = useCallback(async (user: User) => {
    try {
      // Fetch user permissions and roles
      const response = await fetch('/api/auth/permissions')
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data')
      }

      const data = await response.json()
      
      setAuthState({
        user,
        roles: data.roles || [],
        permissions: data.permissions || [],
        organizations: data.organizations || [],
        isSystemAdmin: data.isSystemAdmin || false,
        loading: false,
        currentOrganization: data.organizations?.[0] || null
      })
    } catch (error) {
      console.error('Error loading user data:', error)
      setAuthState({
        user,
        roles: [],
        permissions: [],
        organizations: [],
        isSystemAdmin: false,
        loading: false,
        currentOrganization: null
      })
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return { error: error.message }
      }

      return {}
    } catch {
      return { error: 'An unexpected error occurred' }
    }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      })

      if (error) {
        return { error: error.message }
      }

      return {}
    } catch {
      return { error: 'An unexpected error occurred' }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const hasPermission = (permission: Permission, organizationId?: string): boolean => {
    if (authState.isSystemAdmin) return true

    // Check if user has the permission in any role
    return authState.roles.some(role => {
      // Check organization context if specified
      if (organizationId && role.organization_id !== organizationId) {
        return false
      }

      // Check role-based permissions
      const rolePermissions = ROLE_HIERARCHY[role.role_type] || []
      if (rolePermissions.includes(permission)) {
        return true
      }

      // Check explicit permissions
      return role.permissions.includes(permission)
    })
  }

  const hasRole = (role: RoleType, organizationId?: string): boolean => {
    if (authState.isSystemAdmin) return true

    return authState.roles.some(userRole => {
      if (userRole.role_type !== role) return false
      if (organizationId && userRole.organization_id !== organizationId) return false
      return true
    })
  }

  const hasAnyRole = (roles: RoleType[], organizationId?: string): boolean => {
    if (authState.isSystemAdmin) return true

    return roles.some(role => hasRole(role, organizationId))
  }

  const hasAllPermissions = (permissions: Permission[], organizationId?: string): boolean => {
    if (authState.isSystemAdmin) return true

    return permissions.every(permission => hasPermission(permission, organizationId))
  }

  const setCurrentOrganization = (organization: Organization | null) => {
    setAuthState(prev => ({ ...prev, currentOrganization: organization }))
  }

  const refreshAuth = async () => {
    if (authState.user) {
      await loadUserData(authState.user)
    }
  }

  const contextValue: AuthContextType = {
    ...authState,
    signIn,
    signUp,
    signOut,
    hasPermission,
    hasRole,
    hasAnyRole,
    hasAllPermissions,
    setCurrentOrganization,
    refreshAuth
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

