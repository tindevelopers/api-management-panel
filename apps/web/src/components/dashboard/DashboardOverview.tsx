'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import {
  ChartBarIcon,
  CloudIcon,
  CircleStackIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

interface DashboardOverviewProps {
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

interface StatsCard {
  title: string
  value: string
  change: string
  changeType: 'increase' | 'decrease' | 'neutral'
  icon: React.ComponentType<any>
}

export default function DashboardOverview({ user }: DashboardOverviewProps) {
  const [databases, setDatabases] = useState<DatabaseInfo[]>([])
  const [apiStatus, setApiStatus] = useState<APIStatus>({
    blogWriter: {
      status: 'disconnected',
      url: 'https://api-ai-blog-writer-613248238610.us-east1.run.app',
      lastCheck: new Date().toISOString()
    }
  })

  // Load data on component mount
  useEffect(() => {
    loadDatabases()
    checkAPIStatus()
  }, [])

  const loadDatabases = async () => {
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
        name: 'API Logs',
        description: 'API request and response logs',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Analytics Data',
        description: 'Usage analytics and metrics',
        status: 'maintenance',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ])
  }

  const checkAPIStatus = async () => {
    try {
      const response = await fetch('/api/health-check')
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

  const statsCards: StatsCard[] = [
    {
      title: 'Total APIs',
      value: '3',
      change: '+2 this month',
      changeType: 'increase',
      icon: CloudIcon
    },
    {
      title: 'Active Databases',
      value: databases.filter(db => db.status === 'active').length.toString(),
      change: 'All systems operational',
      changeType: 'neutral',
      icon: CircleStackIcon
    },
    {
      title: 'API Requests',
      value: '12.4K',
      change: '+18% from last month',
      changeType: 'increase',
      icon: ChartBarIcon
    },
    {
      title: 'Active Users',
      value: '1,234',
      change: '+5% from last week',
      changeType: 'increase',
      icon: UsersIcon
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'connected':
        return 'text-green-600 bg-green-100'
      case 'maintenance':
        return 'text-yellow-600 bg-yellow-100'
      case 'inactive':
      case 'error':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'connected':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />
      case 'maintenance':
        return <ClockIcon className="w-5 h-5 text-yellow-600" />
      case 'inactive':
      case 'error':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
      default:
        return <ClockIcon className="w-5 h-5 text-gray-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <card.icon className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{card.title}</p>
                <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
                <p className={`text-sm ${
                  card.changeType === 'increase' ? 'text-green-600' : 
                  card.changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {card.change}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/dashboard/apis"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              <CloudIcon className="w-8 h-8 text-indigo-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Manage APIs</p>
                <p className="text-sm text-gray-500">Configure and test your APIs</p>
              </div>
            </a>
            <a
              href="/dashboard/database"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              <CircleStackIcon className="w-8 h-8 text-indigo-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Database</p>
                <p className="text-sm text-gray-500">Manage your databases</p>
              </div>
            </a>
            <a
              href="/dashboard/analytics"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              <ChartBarIcon className="w-8 h-8 text-indigo-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Analytics</p>
                <p className="text-sm text-gray-500">View usage statistics</p>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API Status */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">API Status</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {getStatusIcon(apiStatus.blogWriter.status)}
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">Blog Writer API</p>
                    <p className="text-sm text-gray-500">
                      Last checked: {new Date(apiStatus.blogWriter.lastCheck).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(apiStatus.blogWriter.status)}`}>
                  {apiStatus.blogWriter.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Database Status */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Database Status</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {databases.map((db) => (
                <div key={db.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getStatusIcon(db.status)}
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">{db.name}</p>
                      <p className="text-sm text-gray-500">{db.description}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(db.status)}`}>
                    {db.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}