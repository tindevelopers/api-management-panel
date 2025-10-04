'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

interface AppearanceSettingsProps {
  user: User
}

interface AppearanceData {
  theme: 'light' | 'dark' | 'system'
  language: string
  timezone: string
  dateFormat: string
  compactMode: boolean
  animations: boolean
}

export default function AppearanceSettings({ user }: AppearanceSettingsProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [appearanceData, setAppearanceData] = useState<AppearanceData>({
    theme: (user.user_metadata?.theme as 'light' | 'dark' | 'system') || 'system',
    language: user.user_metadata?.language || 'en',
    timezone: user.user_metadata?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    dateFormat: user.user_metadata?.date_format || 'MM/DD/YYYY',
    compactMode: user.user_metadata?.compact_mode || false,
    animations: user.user_metadata?.animations !== false,
  })

  const supabase = createClient()

  useEffect(() => {
    // Apply theme changes immediately
    const root = document.documentElement
    if (appearanceData.theme === 'dark') {
      root.classList.add('dark')
    } else if (appearanceData.theme === 'light') {
      root.classList.remove('dark')
    } else {
      // System theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
  }, [appearanceData.theme])

  const handleInputChange = (field: keyof AppearanceData, value: string | boolean) => {
    setAppearanceData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          theme: appearanceData.theme,
          language: appearanceData.language,
          timezone: appearanceData.timezone,
          date_format: appearanceData.dateFormat,
          compact_mode: appearanceData.compactMode,
          animations: appearanceData.animations,
        }
      })

      if (error) throw error

      setMessage({ type: 'success', text: 'Appearance settings updated successfully!' })
    } catch (error) {
      console.error('Error updating appearance settings:', error)
      setMessage({ type: 'error', text: 'Failed to update appearance settings. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Appearance Settings</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Customize the look and feel of your interface.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
            : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="space-y-6">
            {/* Theme Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Theme
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'light', label: 'Light', icon: '☀️' },
                  { value: 'dark', label: 'Dark', icon: '🌙' },
                  { value: 'system', label: 'System', icon: '💻' }
                ].map((theme) => (
                  <button
                    key={theme.value}
                    type="button"
                    onClick={() => handleInputChange('theme', theme.value)}
                    className={`relative flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      appearanceData.theme === theme.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <span className="text-2xl mb-2">{theme.icon}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{theme.label}</span>
                    {appearanceData.theme === theme.value && (
                      <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Language */}
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Language
              </label>
              <select
                id="language"
                value={appearanceData.language}
                onChange={(e) => handleInputChange('language', e.target.value)}
                className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="it">Italiano</option>
                <option value="pt">Português</option>
                <option value="ja">日本語</option>
                <option value="ko">한국어</option>
                <option value="zh">中文</option>
              </select>
            </div>

            {/* Timezone */}
            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Timezone
              </label>
              <select
                id="timezone"
                value={appearanceData.timezone}
                onChange={(e) => handleInputChange('timezone', e.target.value)}
                className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
              >
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Europe/Paris">Paris (CET)</option>
                <option value="Asia/Tokyo">Tokyo (JST)</option>
                <option value="Asia/Shanghai">Shanghai (CST)</option>
                <option value="Australia/Sydney">Sydney (AEDT)</option>
              </select>
            </div>

            {/* Date Format */}
            <div>
              <label htmlFor="date-format" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Date Format
              </label>
              <select
                id="date-format"
                value={appearanceData.dateFormat}
                onChange={(e) => handleInputChange('dateFormat', e.target.value)}
                className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                <option value="MMM DD, YYYY">MMM DD, YYYY</option>
              </select>
            </div>

            {/* Toggle Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="compact-mode" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Compact Mode
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Reduce spacing and padding for a denser layout</p>
                </div>
                <button
                  type="button"
                  id="compact-mode"
                  onClick={() => handleInputChange('compactMode', !appearanceData.compactMode)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    appearanceData.compactMode ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      appearanceData.compactMode ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="animations" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Animations
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Enable smooth transitions and animations</p>
                </div>
                <button
                  type="button"
                  id="animations"
                  onClick={() => handleInputChange('animations', !appearanceData.animations)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    appearanceData.animations ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      appearanceData.animations ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}