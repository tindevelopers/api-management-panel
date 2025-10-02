'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HomeIcon,
  ChartBarIcon,
  CloudIcon,
  CircleStackIcon,
  UsersIcon,
  BuildingOfficeIcon,
  BellIcon,
  CreditCardIcon,
  CogIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface MenuItem {
  title: string
  href?: string
  icon: React.ComponentType<any>
  children?: MenuItem[]
  badge?: string
}

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon
  },
  {
    title: 'Analytics',
    icon: ChartBarIcon,
    children: [
      { title: 'Overview', href: '/dashboard/analytics', icon: ChartBarIcon },
      { title: 'API Usage', href: '/dashboard/analytics/api-usage', icon: CloudIcon },
      { title: 'Performance', href: '/dashboard/analytics/performance', icon: ChartBarIcon },
      { title: 'Reports', href: '/dashboard/analytics/reports', icon: DocumentTextIcon }
    ]
  },
  {
    title: 'API Management',
    icon: CloudIcon,
    children: [
      { title: 'APIs', href: '/dashboard/apis', icon: CloudIcon },
      { title: 'Endpoints', href: '/dashboard/apis/endpoints', icon: KeyIcon },
      { title: 'Testing', href: '/dashboard/apis/testing', icon: ShieldCheckIcon },
      { title: 'Documentation', href: '/dashboard/apis/docs', icon: DocumentTextIcon }
    ]
  },
  {
    title: 'Database',
    icon: CircleStackIcon,
    children: [
      { title: 'Overview', href: '/dashboard/database', icon: CircleStackIcon },
      { title: 'Tables', href: '/dashboard/database/tables', icon: CircleStackIcon },
      { title: 'Queries', href: '/dashboard/database/queries', icon: DocumentTextIcon },
      { title: 'Backups', href: '/dashboard/database/backups', icon: ShieldCheckIcon }
    ]
  },
  {
    title: 'Users & Roles',
    icon: UsersIcon,
    children: [
      { title: 'Users', href: '/dashboard/users', icon: UsersIcon },
      { title: 'Roles', href: '/dashboard/users/roles', icon: ShieldCheckIcon },
      { title: 'Permissions', href: '/dashboard/users/permissions', icon: KeyIcon },
      { title: 'Activity Log', href: '/dashboard/users/activity', icon: DocumentTextIcon }
    ]
  },
  {
    title: 'Organizations',
    icon: BuildingOfficeIcon,
    children: [
      { title: 'Overview', href: '/dashboard/organizations', icon: BuildingOfficeIcon },
      { title: 'Members', href: '/dashboard/organizations/members', icon: UsersIcon },
      { title: 'Settings', href: '/dashboard/organizations/settings', icon: CogIcon }
    ]
  },
  {
    title: 'Notifications',
    href: '/dashboard/notifications',
    icon: BellIcon,
    badge: '3'
  },
  {
    title: 'Billing',
    icon: CreditCardIcon,
    children: [
      { title: 'Overview', href: '/dashboard/billing', icon: CreditCardIcon },
      { title: 'Invoices', href: '/dashboard/billing/invoices', icon: DocumentTextIcon },
      { title: 'Usage', href: '/dashboard/billing/usage', icon: ChartBarIcon },
      { title: 'Plans', href: '/dashboard/billing/plans', icon: CreditCardIcon }
    ]
  },
  {
    title: 'Settings',
    icon: CogIcon,
    children: [
      { title: 'General', href: '/dashboard/settings', icon: CogIcon },
      { title: 'Security', href: '/dashboard/settings/security', icon: ShieldCheckIcon },
      { title: 'API Keys', href: '/dashboard/settings/api-keys', icon: KeyIcon },
      { title: 'Integrations', href: '/dashboard/settings/integrations', icon: CloudIcon }
    ]
  }
]

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>(['Dashboard'])
  const pathname = usePathname()

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    )
  }

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  const isParentActive = (children: MenuItem[]) => {
    return children.some(child => child.href && isActive(child.href))
  }

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.title)
    const itemIsActive = item.href ? isActive(item.href) : hasChildren && isParentActive(item.children!)

    if (hasChildren) {
      return (
        <div key={item.title} className="mb-1">
          <button
            onClick={() => toggleExpanded(item.title)}
            className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
              itemIsActive
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            } ${level > 0 ? 'ml-4' : ''}`}
          >
            <div className="flex items-center">
              <item.icon className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} mr-3 flex-shrink-0`} />
              {!isCollapsed && (
                <>
                  <span>{item.title}</span>
                  {item.badge && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </div>
            {!isCollapsed && (
              isExpanded ? (
                <ChevronDownIcon className="w-4 h-4" />
              ) : (
                <ChevronRightIcon className="w-4 h-4" />
              )
            )}
          </button>
          {!isCollapsed && isExpanded && (
            <div className="mt-1 space-y-1">
              {item.children!.map(child => renderMenuItem(child, level + 1))}
            </div>
          )}
        </div>
      )
    }

    return (
      <Link
        key={item.title}
        href={item.href!}
        className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 mb-1 ${
          itemIsActive
            ? 'bg-indigo-100 text-indigo-700'
            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
        } ${level > 0 ? 'ml-4' : ''}`}
      >
        <item.icon className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} mr-3 flex-shrink-0`} />
        {!isCollapsed && (
          <>
            <span>{item.title}</span>
            {item.badge && (
              <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    )
  }

  return (
    <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Logo/Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">API</span>
            </div>
            <span className="ml-2 text-lg font-semibold text-gray-900">Management</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors duration-200"
        >
          <svg
            className="w-5 h-5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={isCollapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"}
            />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1 overflow-y-auto h-full">
        {menuItems.map(item => renderMenuItem(item))}
      </nav>
    </div>
  )
}