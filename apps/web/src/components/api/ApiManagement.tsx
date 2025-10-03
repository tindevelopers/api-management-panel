'use client'

import { useState } from 'react'
import { 
  CloudIcon, 
  PlayIcon, 
  PauseIcon,
  CogIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlusIcon
} from '@heroicons/react/24/outline'

interface API {
  id: string
  name: string
  description: string
  endpoint: string
  status: 'active' | 'inactive' | 'maintenance'
  version: string
  lastDeployed: string
  requestCount: number
  successRate: number
}

export default function ApiManagement() {
  const [apis, setApis] = useState<API[]>([
    {
      id: '1',
      name: 'Blog Writer API',
      description: 'AI-powered blog content generation service',
      endpoint: 'https://api-ai-blog-writer-613248238610.us-east1.run.app',
      status: 'active',
      version: 'v1.2.0',
      lastDeployed: '2024-01-15T10:30:00Z',
      requestCount: 15420,
      successRate: 99.2
    },
    {
      id: '2',
      name: 'User Authentication API',
      description: 'Secure user authentication and authorization',
      endpoint: '/api/auth',
      status: 'active',
      version: 'v2.1.0',
      lastDeployed: '2024-01-10T14:20:00Z',
      requestCount: 8934,
      successRate: 98.5
    },
    {
      id: '3',
      name: 'Data Processing API',
      description: 'Real-time data processing and analytics',
      endpoint: '/api/data',
      status: 'maintenance',
      version: 'v1.0.5',
      lastDeployed: '2024-01-08T09:15:00Z',
      requestCount: 5632,
      successRate: 97.8
    }
  ])

  const [selectedApi, setSelectedApi] = useState<API | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800'
      case 'inactive':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />
      case 'maintenance':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
      case 'inactive':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
      default:
        return <ExclamationTriangleIcon className="w-5 h-5 text-gray-600" />
    }
  }

  const toggleApiStatus = (apiId: string) => {
    setApis(prev => prev.map(api => 
      api.id === apiId 
        ? { ...api, status: api.status === 'active' ? 'inactive' : 'active' }
        : api
    ))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">API Management</h2>
          <p className="text-gray-600">Manage and monitor your API endpoints</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Add New API
        </button>
      </div>

      {/* API Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CloudIcon className="w-8 h-8 text-indigo-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total APIs</p>
              <p className="text-2xl font-semibold text-gray-900">{apis.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CheckCircleIcon className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active APIs</p>
              <p className="text-2xl font-semibold text-gray-900">
                {apis.filter(api => api.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-8 h-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Maintenance</p>
              <p className="text-2xl font-semibold text-gray-900">
                {apis.filter(api => api.status === 'maintenance').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <DocumentTextIcon className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Requests</p>
              <p className="text-2xl font-semibold text-gray-900">
                {apis.reduce((sum, api) => sum + api.requestCount, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* APIs List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Your APIs</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  API
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Version
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requests
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Success Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Deployed
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {apis.map((api) => (
                <tr key={api.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <CloudIcon className="w-8 h-8 text-indigo-600 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{api.name}</div>
                        <div className="text-sm text-gray-500">{api.description}</div>
                        <div className="text-xs text-gray-400 mt-1">{api.endpoint}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(api.status)}
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(api.status)}`}>
                        {api.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {api.version}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {api.requestCount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-green-600">
                      {api.successRate}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(api.lastDeployed)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => toggleApiStatus(api.id)}
                        className={`p-2 rounded-md transition-colors duration-200 ${
                          api.status === 'active'
                            ? 'text-red-600 hover:bg-red-100'
                            : 'text-green-600 hover:bg-green-100'
                        }`}
                        title={api.status === 'active' ? 'Pause API' : 'Start API'}
                      >
                        {api.status === 'active' ? (
                          <PauseIcon className="w-4 h-4" />
                        ) : (
                          <PlayIcon className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => setSelectedApi(api)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors duration-200"
                        title="Configure API"
                      >
                        <CogIcon className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-md transition-colors duration-200"
                        title="View Documentation"
                      >
                        <DocumentTextIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create API Modal Placeholder */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New API</h3>
              <p className="text-sm text-gray-500 mb-4">
                API creation form would go here
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors duration-200"
                >
                  Create API
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}