'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import ApiTester from '@/components/api/ApiTester'
import DatabaseConfig from '@/components/database/DatabaseConfig'

interface DashboardClientProps {
  user: User
}

interface DatabaseInfo {
  id: string
  name: string
  description: string
  status: 'active' | 'inactive' | 'maintenance'
  created_at: string
  updated_at: string
}

interface APIStatus {
  blogWriter: {
    status: 'connected' | 'disconnected' | 'error'
    url: string
    lastCheck: string
  }
}

export default function DashboardClient({ user }: DashboardClientProps) {
  const [loading, setLoading] = useState(false)
  const [databases, setDatabases] = useState<DatabaseInfo[]>([])
  const [apiStatus, setApiStatus] = useState<APIStatus>({
    blogWriter: {
      status: 'disconnected',
      url: 'https://api-ai-blog-writer-613248238610.us-east1.run.app',
      lastCheck: new Date().toISOString()
    }
  })
  const [activeTab, setActiveTab] = useState<'databases' | 'apis' | 'analytics'>('databases')
  const [configDatabase, setConfigDatabase] = useState<DatabaseInfo | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  // Check API status on component mount
  useEffect(() => {
    checkAPIStatus()
    loadDatabases()
  }, [])

  const checkAPIStatus = async () => {
    try {
      const response = await fetch('https://api-ai-blog-writer-613248238610.us-east1.run.app/health')
      if (response.ok) {
        setApiStatus(prev => ({
          ...prev,
          blogWriter: {
            ...prev.blogWriter,
            status: 'connected',
            lastCheck: new Date().toISOString()
          }
        }))
      } else {
        setApiStatus(prev => ({
          ...prev,
          blogWriter: {
            ...prev.blogWriter,
            status: 'error',
            lastCheck: new Date().toISOString()
          }
        }))
      }
    } catch {
      setApiStatus(prev => ({
        ...prev,
        blogWriter: {
          ...prev.blogWriter,
          status: 'error',
          lastCheck: new Date().toISOString()
        }
      }))
    }
  }

  const loadDatabases = async () => {
    try {
      // Load sample data for now - in real implementation, this would come from Supabase
      setDatabases([
        {
          id: '1',
          name: 'User Database',
          description: 'Main user and authentication data',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Content Database',
          description: 'Blog posts, articles, and content management',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Analytics Database',
          description: 'Performance metrics and usage statistics',
          status: 'maintenance',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
    } catch (error) {
      console.error('Error loading databases:', error)
    }
  }

  const handleLogout = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const handleDatabaseSave = (config: DatabaseInfo & { updated_at: string }) => {
    setDatabases(prev => 
      prev.map(db => 
        db.id === config.id 
          ? { ...db, ...config }
          : db
      )
    )
    setConfigDatabase(null)
  }

  const handleDatabaseConfig = (database: DatabaseInfo) => {
    setConfigDatabase(database)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800'
      case 'inactive':
        return 'bg-red-100 text-red-800'
      case 'connected':
        return 'bg-green-100 text-green-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'connected':
        return '🟢'
      case 'maintenance':
        return '🟡'
      case 'inactive':
      case 'error':
        return '🔴'
      default:
        return '⚪'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                API Management Panel
              </h1>
              <p className="text-gray-600">Welcome back, {user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              {loading ? 'Signing out...' : 'Sign out'}
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'databases', name: 'Databases', icon: '🗄️' },
              { id: 'apis', name: 'APIs', icon: '🔌' },
              { id: 'analytics', name: 'Analytics', icon: '📊' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'databases' | 'apis' | 'analytics')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Databases Tab */}
        {activeTab === 'databases' && (
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Database Management</h2>
              <p className="text-gray-600">Manage your three core databases</p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {databases.map((db) => (
                <div
                  key={db.id}
                  className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-indigo-500 rounded-md flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              DB{db.id}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-900">{db.name}</h3>
                          <p className="text-sm text-gray-500">{db.description}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(db.status)}`}>
                        {getStatusIcon(db.status)} {db.status}
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-5 py-3">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        Last updated: {new Date(db.updated_at).toLocaleDateString()}
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleDatabaseConfig(db)}
                          className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                        >
                          Configure
                        </button>
                        <button className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* APIs Tab */}
        {activeTab === 'apis' && (
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">API Management</h2>
              <p className="text-gray-600">Monitor and manage your connected APIs</p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {/* Blog Writer SDK API */}
              <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-500 rounded-md flex items-center justify-center">
                          <span className="text-white text-lg">✍️</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">Blog Writer SDK</h3>
                        <p className="text-sm text-gray-500">AI-powered content generation</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(apiStatus.blogWriter.status)}`}>
                      {getStatusIcon(apiStatus.blogWriter.status)} {apiStatus.blogWriter.status}
                    </span>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      Last check: {new Date(apiStatus.blogWriter.lastCheck).toLocaleTimeString()}
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={checkAPIStatus}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        Refresh
                      </button>
                      <button className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                        <a href="https://api-ai-blog-writer-613248238610.us-east1.run.app/docs" target="_blank" rel="noopener noreferrer">
                          View Docs
                        </a>
                      </button>
                      <ApiTester 
                        apiUrl={apiStatus.blogWriter.url}
                        apiName="Blog Writer SDK"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Placeholder for additional APIs */}
              <div className="bg-white overflow-hidden shadow rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
                <div className="p-5">
                  <div className="text-center">
                    <div className="w-10 h-10 bg-gray-300 rounded-md flex items-center justify-center mx-auto mb-3">
                      <span className="text-gray-600 text-lg">➕</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">Add New API</h3>
                    <p className="text-sm text-gray-500">Connect additional services</p>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <button className="w-full text-center text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                    Configure API
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics Dashboard</h2>
              <p className="text-gray-600">Monitor performance and usage statistics</p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              {/* Stats Cards */}
              {[
                { title: 'Total Requests', value: '1,247', change: '+12%', color: 'blue' },
                { title: 'Active Databases', value: '2', change: '0%', color: 'green' },
                { title: 'API Calls Today', value: '89', change: '+5%', color: 'purple' },
                { title: 'Error Rate', value: '0.2%', change: '-0.1%', color: 'red' }
              ].map((stat, index) => (
                <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 bg-${stat.color}-500 rounded-md flex items-center justify-center`}>
                          <span className="text-white text-sm">📊</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">{stat.title}</dt>
                          <dd className="text-lg font-medium text-gray-900">{stat.value}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-5 py-3">
                    <div className="text-sm">
                      <span className={`font-medium ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.change}
                      </span>
                      <span className="text-gray-500"> from last week</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Placeholder */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Usage Trends</h3>
              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">📈</div>
                  <p className="text-gray-500">Charts and analytics coming soon</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Database Configuration Modal */}
      {configDatabase && (
        <DatabaseConfig
          databaseId={configDatabase.id}
          databaseName={configDatabase.name}
          currentConfig={{
            name: configDatabase.name,
            description: configDatabase.description,
            status: configDatabase.status
          }}
          onSave={handleDatabaseSave}
          onClose={() => setConfigDatabase(null)}
        />
      )}
    </div>
  )
}
