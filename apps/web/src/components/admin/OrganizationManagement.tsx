'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Organization, SubscriptionPlan, Permission } from '@/types/multi-role'
import { authenticatedApiCall } from '@/lib/utils/api-client'
import { 
  Building2, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users,
  Globe,
  Settings,
  Crown,
  Star
} from 'lucide-react'
import PermissionGuard from '@/components/auth/PermissionGuard'
import OrganizationForm from './OrganizationForm'

interface OrganizationStats {
  total_users: number
  active_apis: number
  storage_used: number
  last_activity: string
}

interface OrganizationWithStats extends Organization {
  stats: OrganizationStats
}

interface OrganizationManagementProps {
  className?: string
  initialOrganizations?: Organization[]
}

export default function OrganizationManagement({ className = '', initialOrganizations = [] }: OrganizationManagementProps) {
  const [organizations, setOrganizations] = useState<OrganizationWithStats[]>(initialOrganizations.map(org => ({
    ...org,
    stats: {
      total_users: 0,
      active_apis: 0,
      storage_used: 0,
      last_activity: new Date().toISOString()
    }
  })))
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPlan, setFilterPlan] = useState<SubscriptionPlan | 'all'>('all')
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)

  const fetchOrganizations = useCallback(async () => {
    try {
      setLoading(true)
      
      const url = '/api/admin/organizations'
      const response = await authenticatedApiCall(url)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch organizations: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setOrganizations(data.organizations || [])
    } catch (error) {
      console.error('Error fetching organizations:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // If no initial data provided, fetch from API
    if (!initialOrganizations || initialOrganizations.length === 0) {
      fetchOrganizations().catch(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [initialOrganizations?.length])

  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesPlan = filterPlan === 'all' || org.subscription_plan === filterPlan

    return matchesSearch && matchesPlan
  })

  const handleOrgAction = async (orgId: string, action: string) => {
    try {
      const response = await fetch(`/api/admin/organizations/${orgId}`, {
        method: action === 'delete' ? 'DELETE' : 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: action !== 'delete' ? JSON.stringify({ action }) : undefined,
      })

      if (response.ok) {
        await fetchOrganizations()
      }
    } catch (error) {
      console.error(`Error ${action} organization:`, error)
    }
  }

  const handleCreateOrganization = async (data: Partial<Organization>) => {
    try {
      const response = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        await fetchOrganizations()
        setShowCreateForm(false)
      }
    } catch (error) {
      console.error('Error creating organization:', error)
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
        return <Star className="h-3 w-3" />
      case SubscriptionPlan.BASIC:
        return <Globe className="h-3 w-3" />
      case SubscriptionPlan.PREMIUM:
        return <Crown className="h-3 w-3" />
      case SubscriptionPlan.ENTERPRISE:
        return <Settings className="h-3 w-3" />
      default:
        return <Star className="h-3 w-3" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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

  return (
    <PermissionGuard 
      permission={Permission.MANAGE_ORGANIZATIONS}
      fallback={
        <div className="p-8 text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You don&apos;t have permission to manage organizations.</p>
        </div>
      }
    >
      <div className={`space-y-6 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Organization Management</h1>
            <p className="text-gray-600">Manage organizations and their subscriptions</p>
          </div>
          <button 
            onClick={() => setShowCreateForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Organization
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Organizations</p>
                <p className="text-2xl font-bold text-gray-900">{organizations.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {organizations.reduce((sum, org) => sum + org.stats.total_users, 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <Globe className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active APIs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {organizations.reduce((sum, org) => sum + org.stats.active_apis, 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Enterprise Plans</p>
                <p className="text-2xl font-bold text-gray-900">
                  {organizations.filter(org => org.subscription_plan === SubscriptionPlan.ENTERPRISE).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search organizations by name, slug, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value as SubscriptionPlan | 'all')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Plans</option>
                <option value={SubscriptionPlan.FREE}>Free</option>
                <option value={SubscriptionPlan.BASIC}>Basic</option>
                <option value={SubscriptionPlan.PREMIUM}>Premium</option>
                <option value={SubscriptionPlan.ENTERPRISE}>Enterprise</option>
              </select>
            </div>
          </div>
        </div>

        {/* Organizations Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading organizations...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedOrgs.length === filteredOrganizations.length && filteredOrganizations.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedOrgs(filteredOrganizations.map(org => org.id))
                          } else {
                            setSelectedOrgs([])
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Organization
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Users
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      APIs
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Storage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOrganizations.map((org) => (
                    <tr key={org.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedOrgs.includes(org.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedOrgs([...selectedOrgs, org.id])
                            } else {
                              setSelectedOrgs(selectedOrgs.filter(id => id !== org.id))
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {org.name}
                            </div>
                            <div className="text-sm text-gray-500">@{org.slug}</div>
                            {org.description && (
                              <div className="text-xs text-gray-400 mt-1">
                                {org.description.length > 50 
                                  ? `${org.description.substring(0, 50)}...` 
                                  : org.description
                                }
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPlanBadgeColor(org.subscription_plan)}`}>
                          {getPlanIcon(org.subscription_plan)}
                          <span className="ml-1 capitalize">{org.subscription_plan}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {org.stats.total_users}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {org.stats.active_apis}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatStorage(org.stats.storage_used)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(org.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOrgAction(org.id, 'edit')}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOrgAction(org.id, 'settings')}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <Settings className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOrgAction(org.id, 'delete')}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filteredOrganizations.length === 0 && !loading && (
            <div className="p-8 text-center">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No organizations found</h3>
              <p className="text-gray-600">
                {searchTerm || filterPlan !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by adding your first organization.'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Organization Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <OrganizationForm
              onSubmit={handleCreateOrganization}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        </div>
      )}

    </PermissionGuard>
  )
}
