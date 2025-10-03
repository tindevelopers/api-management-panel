'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { useAuth } from '@/contexts/AuthContext'
import { RoleType } from '@/types/multi-role'
import ProfileSettings from '@/components/settings/ProfileSettings'
import SecuritySettings from '@/components/settings/SecuritySettings'
import NotificationSettings from '@/components/settings/NotificationSettings'
import ApiSettings from '@/components/settings/ApiSettings'
import OrganizationSettings from '@/components/settings/OrganizationSettings'
import AppearanceSettings from '@/components/settings/AppearanceSettings'

interface SettingsClientProps {
  user: User
}

type SettingsTab = 'profile' | 'security' | 'notifications' | 'api' | 'organization' | 'appearance'

export default function SettingsClient({ user }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const { hasRole, isSystemAdmin } = useAuth()

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: '👤' },
    { id: 'security' as const, label: 'Security', icon: '🔒' },
    { id: 'notifications' as const, label: 'Notifications', icon: '🔔' },
    { id: 'api' as const, label: 'API Settings', icon: '⚙️' },
    ...(hasRole(RoleType.ORG_ADMIN) || isSystemAdmin ? [{ id: 'organization' as const, label: 'Organization', icon: '🏢' }] : []),
    { id: 'appearance' as const, label: 'Appearance', icon: '🎨' },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSettings user={user} />
      case 'security':
        return <SecuritySettings user={user} />
      case 'notifications':
        return <NotificationSettings user={user} />
      case 'api':
        return <ApiSettings user={user} />
      case 'organization':
        return <OrganizationSettings user={user} />
      case 'appearance':
        return <AppearanceSettings user={user} />
      default:
        return <ProfileSettings user={user} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 flex-shrink-0">
            <nav className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-4">
                <h2 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                  Settings
                </h2>
                <ul className="space-y-1">
                  {tabs.map((tab) => (
                    <li key={tab.id}>
                      <button
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          activeTab === tab.id
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-r-2 border-blue-500'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <span className="mr-3 text-lg">{tab.icon}</span>
                        {tab.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}