'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

interface NotificationSettingsProps {
  user: User
}

interface NotificationPreferences {
  email: {
    apiAlerts: boolean
    systemUpdates: boolean
    securityAlerts: boolean
    weeklyReports: boolean
    marketingEmails: boolean
  }
  push: {
    apiAlerts: boolean
    systemUpdates: boolean
    securityAlerts: boolean
  }
  inApp: {
    apiAlerts: boolean
    systemUpdates: boolean
    securityAlerts: boolean
    mentions: boolean
  }
  schedule: {
    quietHoursStart: string
    quietHoursEnd: string
  }
}

export default function NotificationSettings({ user: _user }: NotificationSettingsProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: {
      apiAlerts: true,
      systemUpdates: true,
      securityAlerts: true,
      weeklyReports: false,
      marketingEmails: false,
    },
    push: {
      apiAlerts: true,
      systemUpdates: false,
      securityAlerts: true,
    },
    inApp: {
      apiAlerts: true,
      systemUpdates: true,
      securityAlerts: true,
      mentions: true,
    },
    schedule: {
      quietHoursStart: "22:00",
      quietHoursEnd: "08:00",
    },
  })

  const supabase = createClient()

  const handleToggle = (category: keyof NotificationPreferences, setting: string, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value,
      },
    }))
  }

  const handleSave = async () => {
    setLoading(true)
    setMessage(null)

    try {
      // In real implementation, save to Supabase user metadata or separate table
      const { error } = await supabase.auth.updateUser({
        data: {
          notification_preferences: preferences,
        }
      })

      if (error) throw error

      setMessage({ type: 'success', text: 'Notification preferences updated successfully!' })
    } catch {
      setMessage({ type: 'error', text: 'Failed to update notification preferences' })
    } finally {
      setLoading(false)
    }
  }

  const NotificationToggle = ({ 
    label, 
    description, 
    checked, 
    onChange 
  }: { 
    label: string
    description: string
    checked: boolean
    onChange: (checked: boolean) => void 
  }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1">
        <h4 className="font-medium text-gray-900 dark:text-white">{label}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
          aria-label={label}
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
      </label>
    </div>
  )

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Notification Settings</h2>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Choose how you want to be notified about important events
        </p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-md ${
          message.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-8">
        {/* Email Notifications */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-8">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="mr-2">📧</span>
            Email Notifications
          </h3>
          <div className="space-y-1">
            <NotificationToggle
              label="API Alerts"
              description="Get notified when your APIs go down or experience issues"
              checked={preferences.email.apiAlerts}
              onChange={(checked) => handleToggle('email', 'apiAlerts', checked)}
            />
            <NotificationToggle
              label="System Updates"
              description="Receive notifications about platform updates and maintenance"
              checked={preferences.email.systemUpdates}
              onChange={(checked) => handleToggle('email', 'systemUpdates', checked)}
            />
            <NotificationToggle
              label="Security Alerts"
              description="Important security notifications and login alerts"
              checked={preferences.email.securityAlerts}
              onChange={(checked) => handleToggle('email', 'securityAlerts', checked)}
            />
            <NotificationToggle
              label="Weekly Reports"
              description="Weekly summary of your API usage and performance"
              checked={preferences.email.weeklyReports}
              onChange={(checked) => handleToggle('email', 'weeklyReports', checked)}
            />
            <NotificationToggle
              label="Marketing Emails"
              description="Product updates, tips, and promotional content"
              checked={preferences.email.marketingEmails}
              onChange={(checked) => handleToggle('email', 'marketingEmails', checked)}
            />
          </div>
        </div>

        {/* Push Notifications */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-8">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="mr-2">📱</span>
            Push Notifications
          </h3>
          <div className="space-y-1">
            <NotificationToggle
              label="API Alerts"
              description="Push notifications for critical API issues"
              checked={preferences.push.apiAlerts}
              onChange={(checked) => handleToggle('push', 'apiAlerts', checked)}
            />
            <NotificationToggle
              label="System Updates"
              description="Push notifications for important system updates"
              checked={preferences.push.systemUpdates}
              onChange={(checked) => handleToggle('push', 'systemUpdates', checked)}
            />
            <NotificationToggle
              label="Security Alerts"
              description="Push notifications for security-related events"
              checked={preferences.push.securityAlerts}
              onChange={(checked) => handleToggle('push', 'securityAlerts', checked)}
            />
          </div>
        </div>

        {/* In-App Notifications */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-8">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="mr-2">🔔</span>
            In-App Notifications
          </h3>
          <div className="space-y-1">
            <NotificationToggle
              label="API Alerts"
              description="Show in-app notifications for API status changes"
              checked={preferences.inApp.apiAlerts}
              onChange={(checked) => handleToggle('inApp', 'apiAlerts', checked)}
            />
            <NotificationToggle
              label="System Updates"
              description="Show in-app notifications for system updates"
              checked={preferences.inApp.systemUpdates}
              onChange={(checked) => handleToggle('inApp', 'systemUpdates', checked)}
            />
            <NotificationToggle
              label="Security Alerts"
              description="Show in-app notifications for security events"
              checked={preferences.inApp.securityAlerts}
              onChange={(checked) => handleToggle('inApp', 'securityAlerts', checked)}
            />
            <NotificationToggle
              label="Mentions"
              description="Get notified when someone mentions you"
              checked={preferences.inApp.mentions}
              onChange={(checked) => handleToggle('inApp', 'mentions', checked)}
            />
          </div>
        </div>

        {/* Notification Schedule */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="mr-2">⏰</span>
            Notification Schedule
          </h3>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="quiet-hours-start" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quiet Hours Start
                </label>
                <input
                  id="quiet-hours-start"
                  type="time"
                  defaultValue={preferences?.schedule?.quietHoursStart ?? "22:00"}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="quiet-hours-end" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quiet Hours End
                </label>
                <input
                  id="quiet-hours-end"
                  type="time"
                  defaultValue={preferences?.schedule?.quietHoursEnd ?? "08:00"}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              During quiet hours, you&apos;ll only receive critical security alerts
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {loading && (
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {loading ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  )
}