'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import Sidebar from '@/components/ui/Sidebar'
import { BellIcon, UserCircleIcon } from '@heroicons/react/24/outline'

interface DashboardLayoutProps {
  children: React.ReactNode
  user?: User
  title?: string
  subtitle?: string
}

export default function DashboardLayout({ 
  children, 
  user, 
  title = "Dashboard",
  subtitle 
}: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  const handleLogout = async () => {
    // Implement logout logic here
    window.location.href = '/login'
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
              {subtitle && (
                <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
              )}
            </div>
            
            {/* Header Actions */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200">
                <BellIcon className="w-6 h-6" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
              </button>
              
              {/* User Menu */}
              <div className="relative">
                <button className="flex items-center space-x-3 text-sm text-gray-700 hover:text-gray-900 transition-colors duration-200">
                  <div className="text-right">
                    <p className="font-medium">{user?.email || 'User'}</p>
                    <p className="text-xs text-gray-500">Administrator</p>
                  </div>
                  <UserCircleIcon className="w-8 h-8 text-gray-400" />
                </button>
              </div>
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}