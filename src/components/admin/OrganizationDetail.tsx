'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Organization, SubscriptionPlan, UserRole } from '@/types/multi-role'
import { 
  Building2, 
  Users, 
  Globe,
  Edit,
  Trash2,
  ArrowLeft,
  Crown,
  Star,
  Shield,
  Activity,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'
import OrganizationForm from './OrganizationForm'
import OrganizationUsers from './OrganizationUsers'
import OrganizationSettings from './OrganizationSettings'

interface OrganizationDetailProps {
  organizationId: string
}

interface OrganizationWithDetails extends Organization {
  stats: {
    total_users: number
    active_apis: number
    storage_used: number
    last_activity: string
  }
  users: Array<UserRole & {
    user: {
      id: string
      email: string
      created_at: string
    }
  }>
}

export default function OrganizationDetail({ organizationId }: OrganizationDetailProps) {
  const [organization, setOrganization] = useState<OrganizationWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'settings'>('overview')
  const [showEditForm, setShowEditForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const router = useRouter()

  const fetchOrganizationDetails = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/organizations/${organizationId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch organization details')
      }

      const data = await response.json()
      setOrganization(data.organization)
    } catch (error) {
      console.error('Error fetching organization details:', error)
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    fetchOrganizationDetails()
  }, [fetchOrganizationDetails])

  const handleUpdateOrganization = async (updatedOrg: Partial<Organization>) => {
    try {
      const response = await fetch(`/api/admin/organizations/${organizationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedOrg),
      })

      if (response.ok) {
        await fetchOrganizationDetails()
        setShowEditForm(false)
      }
    } catch (error) {
      console.error('Error updating organization:', error)
    }
  }

  const handleDeleteOrganization = async () => {
    try {
      const response = await fetch(`/api/admin/organizations/${organizationId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/admin/organizations')
      }
    } catch (error) {
      console.error('Error deleting organization:', error)
    }
  }

  const getPlanBadgeColor = (plan: SubscriptionPlan) => {
    switch (plan) {
      case SubscriptionPlan.FREE:
        return 'bg-gray-100 text-gray-800'
      case SubscriptionPlan.BASIC:
        return 'bg-blue-100 text-blue-800'
      case SubscriptionPlan.PREMIUM:
        return 'bg-purple-100 text-purple-800'
      case SubscriptionPlan.ENTERPRISE:
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPlanIcon = (plan: SubscriptionPlan) => {
    switch (plan) {
      case SubscriptionPlan.FREE:
        return <Star className="h-4 w-4" />
      case SubscriptionPlan.BASIC:
        return <Globe className="h-4 w-4" />
      case SubscriptionPlan.PREMIUM:
        return <Crown className="h-4 w-4" />
      case SubscriptionPlan.ENTERPRISE:
        return <Shield className="h-4 w-4" />
      default:
        return <Star className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatStorage = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading organization details...</p>
        </div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Organization not found</h3>
          <p className="text-gray-600 mb-4">The organization you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
          <Link
            href="/admin/organizations"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Organizations
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link
                href="/admin/organizations"
                className="mr-4 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
                <p className="text-gray-600">@{organization.slug}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowEditForm(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Users ({organization.stats.total_users})
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Settings
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Organization Info */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Organization Information</h2>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPlanBadgeColor(organization.subscription_plan)}`}>
                  {getPlanIcon(organization.subscription_plan)}
                  <span className="ml-1 capitalize">{organization.subscription_plan}</span>
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                  <p className="text-gray-900">
                    {organization.description || 'No description provided'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Created</h3>
                  <p className="text-gray-900">{formatDate(organization.created_at)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Max Users</h3>
                  <p className="text-gray-900">{organization.max_users === -1 ? 'Unlimited' : organization.max_users}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Max APIs</h3>
                  <p className="text-gray-900">{organization.max_apis === -1 ? 'Unlimited' : organization.max_apis}</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{organization.stats.total_users}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center">
                  <Globe className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active APIs</p>
                    <p className="text-2xl font-bold text-gray-900">{organization.stats.active_apis}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center">
                  <Activity className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Storage Used</p>
                    <p className="text-2xl font-bold text-gray-900">{formatStorage(organization.stats.storage_used)}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center">
                  <BarChart3 className="h-8 w-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Last Activity</p>
                    <p className="text-sm font-bold text-gray-900">{formatDate(organization.stats.last_activity)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Users */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Recent Users</h2>
                <button
                  onClick={() => setActiveTab('users')}
                  className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                >
                  View all users
                </button>
              </div>
              
              {organization.users.length > 0 ? (
                <div className="space-y-3">
                  {organization.users.slice(0, 5).map((userRole) => (
                    <div key={userRole.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <Users className="h-4 w-4 text-gray-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{userRole.user.email}</p>
                          <p className="text-xs text-gray-500 capitalize">{userRole.role_type.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(userRole.assigned_at)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No users in this organization yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <OrganizationUsers 
            organizationId={organizationId}
            organization={organization}
            onUpdate={fetchOrganizationDetails}
          />
        )}

        {activeTab === 'settings' && (
          <OrganizationSettings 
            organization={organization}
            onUpdate={handleUpdateOrganization}
          />
        )}
      </main>

      {/* Edit Form Modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <OrganizationForm
              organization={organization}
              onSubmit={handleUpdateOrganization}
              onCancel={() => setShowEditForm(false)}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Organization</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete &quot;{organization.name}&quot;? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteOrganization}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
