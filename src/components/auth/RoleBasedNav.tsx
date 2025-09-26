'use client'

import React from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Permission, RoleType } from '@/types/multi-role'
import { 
  Users, 
  Building2, 
  Settings, 
  BarChart3, 
  Shield, 
  Key, 
  UserPlus,
  Activity,
  Database,
  Globe
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  permission?: Permission
  role?: RoleType
  organizationRequired?: boolean
  children?: NavItem[]
}

const navigationItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: Activity,
    permission: Permission.VIEW_PERSONAL_DASHBOARD
  },
  {
    label: 'System Administration',
    href: '/admin',
    icon: Shield,
    role: RoleType.SYSTEM_ADMIN,
    children: [
      {
        label: 'Organizations',
        href: '/admin/organizations',
        icon: Building2,
        permission: Permission.MANAGE_ORGANIZATIONS
      },
      {
        label: 'System Users',
        href: '/admin/users',
        icon: Users,
        permission: Permission.MANAGE_SYSTEM_USERS
      },
      {
        label: 'System APIs',
        href: '/admin/apis',
        icon: Globe,
        permission: Permission.MANAGE_SYSTEM_APIS
      },
      {
        label: 'System Analytics',
        href: '/admin/analytics',
        icon: BarChart3,
        permission: Permission.VIEW_SYSTEM_ANALYTICS
      }
    ]
  },
  {
    label: 'Organization',
    href: '/org',
    icon: Building2,
    organizationRequired: true,
    children: [
      {
        label: 'Overview',
        href: '/org/overview',
        icon: Activity,
        permission: Permission.ORG_ADMIN
      },
      {
        label: 'Users',
        href: '/org/users',
        icon: Users,
        permission: Permission.MANAGE_ORG_USERS,
        organizationRequired: true
      },
      {
        label: 'APIs',
        href: '/org/apis',
        icon: Database,
        permission: Permission.MANAGE_ORG_APIS,
        organizationRequired: true
      },
      {
        label: 'Invitations',
        href: '/org/invitations',
        icon: UserPlus,
        permission: Permission.MANAGE_ORG_INVITATIONS,
        organizationRequired: true
      },
      {
        label: 'Analytics',
        href: '/org/analytics',
        icon: BarChart3,
        permission: Permission.VIEW_ORG_ANALYTICS,
        organizationRequired: true
      },
      {
        label: 'Settings',
        href: '/org/settings',
        icon: Settings,
        permission: Permission.MANAGE_ORG_SETTINGS,
        organizationRequired: true
      }
    ]
  },
  {
    label: 'API Keys',
    href: '/api-keys',
    icon: Key,
    permission: Permission.ACCESS_APIS
  }
]

interface RoleBasedNavProps {
  className?: string
  onItemClick?: () => void
}

export default function RoleBasedNav({ className = '', onItemClick }: RoleBasedNavProps) {
  const { 
    hasPermission, 
    hasRole, 
    organizations, 
    currentOrganization,
    isSystemAdmin 
  } = useAuth()

  const canAccessItem = (item: NavItem): boolean => {
    // Check permission
    if (item.permission && !hasPermission(item.permission, currentOrganization?.id)) {
      return false
    }

    // Check role
    if (item.role && !hasRole(item.role, currentOrganization?.id)) {
      return false
    }

    // Check organization requirement
    if (item.organizationRequired && !currentOrganization) {
      return false
    }

    return true
  }

  const renderNavItem = (item: NavItem, level: number = 0): React.ReactNode => {
    if (!canAccessItem(item)) {
      return null
    }

    const hasChildren = item.children && item.children.length > 0
    const accessibleChildren = hasChildren 
      ? item.children!.filter(child => canAccessItem(child))
      : []

    const isActive = false // You can implement active state logic here

    return (
      <div key={item.href} className={level > 0 ? 'ml-4' : ''}>
        <Link
          href={item.href}
          onClick={onItemClick}
          className={`
            flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
            ${isActive 
              ? 'bg-blue-100 text-blue-700' 
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }
            ${level > 0 ? 'text-sm' : ''}
          `}
        >
          <item.icon className={`mr-3 ${level > 0 ? 'h-4 w-4' : 'h-5 w-5'}`} />
          {item.label}
        </Link>
        
        {accessibleChildren.length > 0 && (
          <div className="mt-1 space-y-1">
            {accessibleChildren.map(child => renderNavItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  const renderOrganizationSelector = () => {
    if (organizations.length <= 1) {
      return null
    }

    return (
      <div className="mb-6 p-3 bg-gray-50 rounded-lg">
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Current Organization
        </label>
        <select
          value={currentOrganization?.id || ''}
          onChange={() => {
            // You would implement setCurrentOrganization here
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {organizations.map(org => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
      </div>
    )
  }

  const renderSystemAdminNotice = () => {
    if (!isSystemAdmin) {
      return null
    }

    return (
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center">
          <Shield className="h-5 w-5 text-yellow-600 mr-2" />
          <span className="text-sm font-medium text-yellow-800">
            System Administrator
          </span>
        </div>
        <p className="text-xs text-yellow-700 mt-1">
          You have full system access
        </p>
      </div>
    )
  }

  return (
    <nav className={className}>
      {renderSystemAdminNotice()}
      {renderOrganizationSelector()}
      
      <div className="space-y-1">
        {navigationItems.map(item => renderNavItem(item))}
      </div>

      {/* Organization Status */}
      {currentOrganization && (
        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <Building2 className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-blue-800">
                {currentOrganization.name}
              </p>
              <p className="text-xs text-blue-600">
                {currentOrganization.slug}
              </p>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

// Hook for getting navigation items based on user permissions
export function useNavigationItems() {
  const { hasPermission, hasRole, currentOrganization } = useAuth()

  const canAccessItem = (item: NavItem): boolean => {
    if (item.permission && !hasPermission(item.permission, currentOrganization?.id)) {
      return false
    }
    if (item.role && !hasRole(item.role, currentOrganization?.id)) {
      return false
    }
    if (item.organizationRequired && !currentOrganization) {
      return false
    }
    return true
  }

  const getAccessibleItems = (items: NavItem[]): NavItem[] => {
    return items.filter(item => {
      if (!canAccessItem(item)) return false
      
      if (item.children) {
        const accessibleChildren = item.children.filter(child => canAccessItem(child))
        return accessibleChildren.length > 0
      }
      
      return true
    })
  }

  return {
    allItems: navigationItems,
    accessibleItems: getAccessibleItems(navigationItems),
    canAccessItem
  }
}
