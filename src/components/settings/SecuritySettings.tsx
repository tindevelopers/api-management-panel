'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

interface SecuritySettingsProps {
  user: User
}

interface PasswordData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

interface Session {
  id: string
  device: string
  location: string
  lastActive: string
  current: boolean
}

export default function SecuritySettings({ user: _user }: SecuritySettingsProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [showQRCode, setShowQRCode] = useState(false)
  
  const supabase = createClient()

  // Mock sessions data - in real implementation, fetch from Supabase
  const [sessions] = useState<Session[]>([
    {
      id: '1',
      device: 'Chrome on Windows',
      location: 'New York, US',
      lastActive: '2 minutes ago',
      current: true,
    },
    {
      id: '2',
      device: 'Safari on iPhone',
      location: 'New York, US',
      lastActive: '2 hours ago',
      current: false,
    },
  ])

  const handlePasswordChange = (field: keyof PasswordData, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }))
  }

  const handlePasswordUpdate = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }

    if (passwordData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters long' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (error) throw error

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setMessage({ type: 'success', text: 'Password updated successfully!' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update password' })
    } finally {
      setLoading(false)
    }
  }

  const handleToggle2FA = async () => {
    setLoading(true)
    try {
      if (!twoFactorEnabled) {
        // Enable 2FA - show QR code
        setShowQRCode(true)
        setTwoFactorEnabled(true)
        setMessage({ type: 'success', text: 'Two-factor authentication enabled!' })
      } else {
        // Disable 2FA
        setTwoFactorEnabled(false)
        setShowQRCode(false)
        setMessage({ type: 'success', text: 'Two-factor authentication disabled!' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update 2FA settings' })
    } finally {
      setLoading(false)
    }
  }

  const handleRevokeSession = async (_sessionId: string) => {
    // In real implementation, revoke the session
    setMessage({ type: 'success', text: 'Session revoked successfully!' })
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Security Settings</h2>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Manage your account security and authentication settings
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
        {/* Password Change Section */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-8">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Change Password
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Confirm new password"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="button"
                onClick={handlePasswordUpdate}
                disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>

        {/* Two-Factor Authentication Section */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-8">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Two-Factor Authentication
          </h3>
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                Authenticator App
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Use an authenticator app to generate verification codes
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggle2FA}
              disabled={loading}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                twoFactorEnabled
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {twoFactorEnabled ? 'Disable' : 'Enable'}
            </button>
          </div>

          {showQRCode && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                Setup Instructions
              </h4>
              <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                <li>1. Download an authenticator app (Google Authenticator, Authy, etc.)</li>
                <li>2. Scan the QR code below with your authenticator app</li>
                <li>3. Enter the 6-digit code from your app to verify setup</li>
              </ol>
              <div className="mt-4 flex justify-center">
                <div className="w-32 h-32 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500 text-xs text-center">QR Code<br/>Placeholder</span>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                  Verification Code
                </label>
                <div className="flex gap-2">
                  <input
                    id="twofa-code-input"
                    type="text"
                    placeholder="Enter 6-digit code"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (loading) return;
                      const input = (document.getElementById('twofa-code-input') as HTMLInputElement | null);
                      const code = input?.value?.trim() || '';
                      if (!/^\d{6}$/.test(code)) {
                        setMessage({ type: 'error', text: 'Please enter a valid 6-digit code.' });
                        return;
                      }
                      setLoading(true);
                      setMessage(null);
                      try {
                        // Simulate verification request
                        await new Promise((res) => setTimeout(res, 800));
                        setShowQRCode(false);
                        setTwoFactorEnabled(true);
                        setMessage({ type: 'success', text: 'Two-factor authentication set up successfully!' });
                        if (input) input.value = '';
                      } catch (err) {
                        setMessage({ type: 'error', text: 'Failed to verify code. Please try again.' });
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Verify
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Active Sessions Section */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Active Sessions
          </h3>
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400">🖥️</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {session.device}
                      {session.current && (
                        <span className="ml-2 px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                          Current
                        </span>
                      )}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {session.location} • Last active {session.lastActive}
                    </p>
                  </div>
                </div>
                {!session.current && (
                  <button
                    type="button"
                    onClick={() => handleRevokeSession(session.id)}
                    className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={async () => {
                if (loading) return;
                const confirmed = window.confirm('Sign out of all other sessions? This will revoke access from other devices.');
                if (!confirmed) return;
                setLoading(true);
                setMessage(null);
                try {
                  // Simulate API call
                  await new Promise((res) => setTimeout(res, 800));
                  setMessage({ type: 'success', text: 'Signed out of all other sessions.' });
                } catch (err) {
                  setMessage({ type: 'error', text: 'Failed to sign out of other sessions.' });
                } finally {
                  setLoading(false);
                }
              }}
              className="px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
            >
              Sign out of all other sessions
            </button>
          </div>
        </div>

        {/* Account Deletion Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
          <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-4">
            Danger Zone
          </h3>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <h4 className="font-medium text-red-900 dark:text-red-300 mb-2">
              Delete Account
            </h4>
            <p className="text-sm text-red-800 dark:text-red-300 mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button
              type="button"
              onClick={async () => {
                if (loading) return;
                const confirmed = window.confirm('Are you sure you want to delete your account? This action is irreversible.');
                if (!confirmed) return;
                // Optional: extra safeguard
                const confirmText = window.prompt('Type DELETE to confirm account deletion:');
                if (confirmText !== 'DELETE') {
                  setMessage({ type: 'error', text: 'Account deletion canceled.' });
                  return;
                }
                setLoading(true);
                setMessage(null);
                try {
                  // Simulate delete request
                  await new Promise((res) => setTimeout(res, 1000));
                  setMessage({ type: 'success', text: 'Account deleted. Redirecting...' });
                  // In real app, redirect to goodbye page or logout
                } catch (err) {
                  setMessage({ type: 'error', text: 'Failed to delete account. Please try again.' });
                } finally {
                  setLoading(false);
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}