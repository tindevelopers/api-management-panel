'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { authenticatedApiCall } from '@/lib/utils/api-client'
import { 
  Building2, 
  Users, 
  Globe, 
  Settings, 
  BarChart3,
  Shield,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'

interface SystemAdminDashboardProps {
  user: User
  initialStats?: SystemStats
}

interface SystemStats {
  total_organizations: number
  total_users: number
  active_apis: number
  system_load: number
  recent_activity: Array<{
    id: string
    action: string
    user_email: string
    timestamp: string
    organization_name?: string
  }>
}

export default function SystemAdminDashboard({ user, initialStats }: SystemAdminDashboardProps) {
  const [stats, setStats] = useState<SystemStats>(initialStats || {
    total_organizations: 0,
    total_users: 0,
    active_apis: 0,
    system_load: 0,
    recent_activity: []
  })
  const [loading, setLoading] = useState(!initialStats)
  const router = useRouter()

  const fetchSystemStats = useCallback(async () => {
    try {
      setLoading(true)
      const response = await authenticatedApiCall('/api/admin/stats')
      
      if (!response.ok) {
        throw new Error('Failed to fetch system stats')
      }

      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching system stats:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // If no initial stats provided, fetch from API
    if (!initialStats) {
      fetchSystemStats()
    }
  }, [initialStats]) // Removed fetchSystemStats from dependencies

  const getLoadColor = (load: number) => {
    if (load < 30) return 'text-green-600'
    if (load < 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getLoadIcon = (load: number) => {
    if (load < 30) return <CheckCircle className="h-5 w-5 text-green-600" />
    if (load < 70) return <AlertCircle className="h-5 w-5 text-yellow-600" />
    return <AlertCircle className="h-5 w-5 text-red-600" />
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                System Administration
              </h1>
              <p className="text-gray-600">Welcome back, {user.email}</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                <Shield className="h-4 w-4 mr-1" />
                System Admin
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <Link
              href="/admin"
              className="border-b-2 border-blue-500 text-blue-600 py-4 px-1 text-sm font-medium"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/organizations"
              className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-4 px-1 text-sm font-medium"
            >
              Organizations
            </Link>
            <Link
              href="/admin/users"
              className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-4 px-1 text-sm font-medium"
            >
              Users
            </Link>
            <Link
              href="/admin/analytics"
              className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-4 px-1 text-sm font-medium"
            >
              Analytics
            </Link>
            <Link
              href="/admin/settings"
              className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-4 px-1 text-sm font-medium"
            >
              Settings
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Building2 className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Organizations</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {loading ? '...' : stats.total_organizations}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link
                  href="/admin/organizations"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Manage organizations
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {loading ? '...' : stats.total_users}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link
                  href="/admin/users"
                  className="font-medium text-green-600 hover:text-green-500"
                >
                  View all users
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Globe className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active APIs</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {loading ? '...' : stats.active_apis}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link
                  href="/admin/apis"
                  className="font-medium text-purple-600 hover:text-purple-500"
                >
                  Manage APIs
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Activity className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">System Load</dt>
                    <dd className={`text-lg font-medium ${getLoadColor(stats.system_load)}`}>
                      {loading ? '...' : `${stats.system_load}%`}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="flex items-center text-sm">
                {getLoadIcon(stats.system_load)}
                <span className="ml-2 text-gray-500">
                  {stats.system_load < 30 ? 'Healthy' : stats.system_load < 70 ? 'Moderate' : 'High'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          <Link
            href="/admin/organizations"
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Building2 className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Organizations</h3>
                  <p className="text-sm text-gray-500">Manage organizations and their settings</p>
                </div>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/users"
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">User Management</h3>
                  <p className="text-sm text-gray-500">Manage users and their roles</p>
                </div>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/analytics"
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BarChart3 className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Analytics</h3>
                  <p className="text-sm text-gray-500">View system analytics and reports</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent System Activity
            </h3>
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading activity...</p>
              </div>
            ) : stats.recent_activity.length > 0 ? (
              <div className="flow-root">
                <ul className="-mb-8">
                  {stats.recent_activity.map((activity, activityIdx) => (
                    <li key={activity.id}>
                      <div className="relative pb-8">
                        {activityIdx !== stats.recent_activity.length - 1 ? (
                          <span
                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                            aria-hidden="true"
                          />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                              <Activity className="h-4 w-4 text-white" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-500">
                                <span className="font-medium text-gray-900">{activity.user_email}</span>{' '}
                                {activity.action}
                                {activity.organization_name && (
                                  <span className="text-gray-600">
                                    {' '}in <span className="font-medium">{activity.organization_name}</span>
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              <time dateTime={activity.timestamp}>
                                {formatDate(activity.timestamp)}
                              </time>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-center py-4">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No recent activity</h3>
                <p className="text-gray-600">System activity will appear here as users interact with the platform.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
