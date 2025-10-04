'use client'

import { usePathname } from 'next/navigation'
import DashboardLayout from '@/components/ui/DashboardLayout'

interface DashboardClientWrapperProps {
  children: React.ReactNode
  user: any
}

export default function DashboardClientWrapper({ children, user }: DashboardClientWrapperProps) {
  const pathname = usePathname()
  
  // Determine title and subtitle based on current route
  let title = 'Dashboard'
  let subtitle = 'Welcome to your API Management Panel'
  
  if (pathname.startsWith('/dashboard/organizations')) {
    title = 'Organizations'
    subtitle = 'Manage your organizations and teams'
  } else if (pathname.startsWith('/dashboard/analytics')) {
    title = 'Analytics'
    subtitle = 'View your API usage and performance metrics'
  } else if (pathname.startsWith('/dashboard/apis')) {
    title = 'API Management'
    subtitle = 'Manage your APIs and endpoints'
  } else if (pathname.startsWith('/dashboard/database')) {
    title = 'Database'
    subtitle = 'Manage your database tables and queries'
  } else if (pathname.startsWith('/dashboard/users')) {
    title = 'Users & Roles'
    subtitle = 'Manage users, roles, and permissions'
  } else if (pathname.startsWith('/dashboard/notifications')) {
    title = 'Notifications'
    subtitle = 'View and manage your notifications'
  } else if (pathname.startsWith('/dashboard/billing')) {
    title = 'Billing'
    subtitle = 'Manage your billing and subscription'
  } else if (pathname.startsWith('/dashboard/settings')) {
    title = 'Settings'
    subtitle = 'Configure your account and preferences'
  }
  
  return (
    <DashboardLayout user={user} title={title} subtitle={subtitle}>
      {children}
    </DashboardLayout>
  )
}
