'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

interface ApiSettingsProps {
  user: User
}

interface ApiKey {
  id: string
  name: string
  key: string
  permissions: string[]
  lastUsed: string
  created: string
  status: 'active' | 'inactive'
}

interface ApiEndpoint {
  id: string
  name: string
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  status: 'active' | 'inactive' | 'maintenance'
  rateLimit: number
  lastCheck: string
}

export default function ApiSettings({ user }: ApiSettingsProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showNewKeyForm, setShowNewKeyForm] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    {
      id: '1',
      name: 'Production API Key',
      key: 'sk_live_...',
      permissions: ['read', 'write'],
      lastUsed: '2 hours ago',
      created: '2024-01-15',
      status: 'active',
    },
    {
      id: '2',
      name: 'Development API Key',
      key: 'sk_test_...',
      permissions: ['read'],
      lastUsed: '1 day ago',
      created: '2024-01-10',
      status: 'active',
    },
  ])

  const [apiEndpoints, setApiEndpoints] = useState<ApiEndpoint[]>([
    {
      id: '1',
      name: 'Blog Writer API',
      url: 'https://api-ai-blog-writer-613248238610.us-east1.run.app',
      method: 'POST',
      status: 'active',
      rateLimit: 100,
      lastCheck: '5 minutes ago',
    },
    {
      id: '2',
      name: 'Content API',
      url: 'https://api.example.com/content',
      method: 'GET',
      status: 'maintenance',
      rateLimit: 1000,
      lastCheck: '1 hour ago',
    },
  ])

  const supabase = createClient()

  const availablePermissions = [
    { id: 'read', label: 'Read Access', description: 'View data and configurations' },
    { id: 'write', label: 'Write Access', description: 'Create and update data' },
    { id: 'delete', label: 'Delete Access', description: 'Delete data and configurations' },
    { id: 'admin', label: 'Admin Access', description: 'Full administrative access' },
  ]

  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) {
      setMessage({ type: 'error', text: 'Please enter a name for the API key' })
      return
    }

    setLoading(true)
    try {
      // Generate a new API key (in real implementation, this would be done server-side)
      const newKey: ApiKey = {
        id: Date.now().toString(),
        name: newKeyName,
        key: `sk_${Math.random().toString(36).substring(2, 15)}`,
        permissions: selectedPermissions,
        lastUsed: 'Never',
        created: new Date().toISOString().split('T')[0],
        status: 'active',
      }

      setApiKeys(prev => [...prev, newKey])
      setNewKeyName('')
      setSelectedPermissions([])
      setShowNewKeyForm(false)
      setMessage({ type: 'success', text: 'API key created successfully!' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create API key' })
    } finally {
      setLoading(false)
    }
  }

  const handleRevokeApiKey = async (keyId: string) => {
    setLoading(true)
    try {
      setApiKeys(prev => prev.filter(key => key.id !== keyId))
      setMessage({ type: 'success', text: 'API key revoked successfully!' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to revoke API key' })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleEndpoint = async (endpointId: string) => {
    setLoading(true)
    try {
      setApiEndpoints(prev => prev.map(endpoint =>
        endpoint.id === endpointId
          ? { ...endpoint, status: endpoint.status === 'active' ? 'inactive' : 'active', lastCheck: new Date().toISOString() }
          : endpoint
      ))
      setMessage({ type: 'success', text: 'Endpoint status updated successfully!' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update endpoint status' })
    } finally {
      setLoading(false)
    }
  }

  // Update a single endpoint's rate limit
  const handleUpdateEndpointRateLimit = (endpointId: string, rateLimit: number) => {
    setApiEndpoints(prev => prev.map(ep => ep.id === endpointId ? { ...ep, rateLimit } : ep))
    setMessage({ type: 'success', text: 'Endpoint rate limit updated.' })
  }

  // Rate limits for global configuration (local temporary state)
  const [rateLimits, setRateLimits] = useState({
    perMinute: 60,
    perHour: 1000,
    perDay: 10000,
  })

  const handleRateLimitChange = (field: keyof typeof rateLimits, value: number) => {
    setRateLimits(prev => ({ ...prev, [field]: value }))
  }

  const handleUpdateRateLimits = () => {
    // In a real app, you'd persist these to the server.
    setMessage({ type: 'success', text: 'Rate limits updated.' })
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setMessage({ type: 'success', text: 'Copied to clipboard!' })
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to copy to clipboard' })
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">API Settings</h2>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Manage your API keys and endpoint configurations
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
        {/* API Keys Section */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              API Keys
            </h3>
            <button
              type="button"
              onClick={() => setShowNewKeyForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create New Key
            </button>
          </div>

          {showNewKeyForm && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-white mb-4">Create New API Key</h4>
              <div className="space-y-4">
                <div>
                  <label htmlFor="key-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Key Name
                  </label>
                  <input
                    id="key-name"
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter a descriptive name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Permissions
                  </label>
                  <div className="space-y-2">
                    {availablePermissions.map((permission) => (
                      <label key={permission.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(permission.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPermissions(prev => [...prev, permission.id])
                            } else {
                              setSelectedPermissions(prev => prev.filter(p => p !== permission.id))
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <div className="ml-3">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {permission.label}
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {permission.description}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCreateApiKey}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Creating...' : 'Create Key'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewKeyForm(false)}
                    className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Existing API Keys */}
          <div className="space-y-4">
            {apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{apiKey.name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Created: {apiKey.created} • Last used: {apiKey.lastUsed}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        apiKey.status === 'active' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {apiKey.status}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Permissions: {apiKey.permissions.join(', ')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(apiKey.key)}
                      className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Copy Key
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRevokeApiKey(apiKey.id)}
                      className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* API Endpoints Section */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-8">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            API Endpoints
          </h3>
          <div className="space-y-4">
            {apiEndpoints.map((endpoint) => (
              <div key={endpoint.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{endpoint.name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{endpoint.url}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Method: {endpoint.method}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Rate Limit: {endpoint.rateLimit}/min
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Last Check: {endpoint.lastCheck}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      endpoint.status === 'active' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : endpoint.status === 'maintenance'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {endpoint.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleEndpoint(endpoint.id)}
                      className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
                    >
                      Toggle Status
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rate Limiting Section */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Global Rate Limits
          </h3>
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="rate-per-minute" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Per Minute
                </label>
                <input
                  type="number"
                  id="rate-per-minute"
                  value={rateLimits.perMinute}
                  onChange={(e) => handleRateLimitChange('perMinute', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="rate-per-hour" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Per Hour
                </label>
                <input
                  type="number"
                  id="rate-per-hour"
                  value={rateLimits.perHour}
                  onChange={(e) => handleRateLimitChange('perHour', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="rate-per-day" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Per Day
                </label>
                <input
                  type="number"
                  id="rate-per-day"
                  value={rateLimits.perDay}
                  onChange={(e) => handleRateLimitChange('perDay', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={handleUpdateRateLimits}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Update Rate Limits
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}