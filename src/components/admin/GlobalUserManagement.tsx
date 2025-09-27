'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { RoleType, UserRole, Organization, Permission, ExtendedUser } from '@/types/multi-role'
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Shield,
  Building2,
  Filter,
  Download,
  Upload,
  UserPlus,
  Mail,
  Calendar,
  MoreVertical,
  ChevronDown,
  X,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react'
import PermissionGuard from '@/components/auth/PermissionGuard'
import UserDetailModal from './UserDetailModal'
import UserInviteModal from './UserInviteModal'
import BulkActionModal from './BulkActionModal'
import AdvancedFilters from './AdvancedFilters'

interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
  last_sign_in_at?: string
  last_login_at?: string
  is_active: boolean
  roles: UserRole[]
  organizations: Organization[]
}

interface Pagination {
  total: number
  limit: number
  offset: number
  has_more: boolean
}

interface Filters {
  search: string
  roleType: string
  organizationId: string
  isActive: string
  createdAfter: string
  createdBefore: string
}

interface GlobalUserManagementProps {
  className?: string
}

export default function GlobalUserManagement({ className = '' }: GlobalUserManagementProps) {
  const [users, setUsers] = useState<ExtendedUser[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    limit: 50,
    offset: 0,
    has_more: false
  })
  const [filters, setFilters] = useState<Filters>({
    search: '',
    roleType: '',
    organizationId: '',
    isActive: '',
    createdAfter: '',
    createdBefore: ''
  })
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedUser, setSelectedUser] = useState<ExtendedUser | null>(null)
  const [showUserDetail, setShowUserDetail] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<'created_at' | 'email' | 'last_sign_in_at'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [bulkAction, setBulkAction] = useState<'activate' | 'deactivate' | 'delete'>('activate')

  useEffect(() => {
    fetchUsers()
    fetchOrganizations()
  }, [filters, pagination.offset, sortBy, sortOrder])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString())
        }
      })
      
      // Add pagination
      params.append('limit', pagination.limit.toString())
      params.append('offset', pagination.offset.toString())
      
      // Add sorting
      params.append('sort_by', sortBy)
      params.append('sort_order', sortOrder)

      const response = await fetch(`/api/admin/users?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const data = await response.json()
      setUsers(data.users || [])
      setPagination(data.pagination || pagination)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/admin/organizations')
      if (response.ok) {
        const data = await response.json()
        setOrganizations(data.organizations || [])
      }
    } catch (error) {
      console.error('Error fetching organizations:', error)
    }
  }

  const handleUserAction = async (userId: string, action: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        await fetchUsers()
      }
    } catch (error) {
      console.error(`Error ${action} user:`, error)
    }
  }


  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters)
    setPagination(prev => ({ ...prev, offset: 0 }))
  }

  const handleSortChange = (field: 'created_at' | 'email' | 'last_sign_in_at') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const handlePageChange = (newOffset: number) => {
    setPagination(prev => ({ ...prev, offset: newOffset }))
  }

  const getRoleBadgeColor = (roleType: RoleType) => {
    switch (roleType) {
      case RoleType.SYSTEM_ADMIN:
        return 'bg-red-100 text-red-800 border-red-200'
      case RoleType.ORG_ADMIN:
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case RoleType.USER:
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusBadge = (user: ExtendedUser) => {
    if (!(user as any).is_active) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><X className="h-3 w-3 mr-1" />Inactive</span>
    }
    
    if ((user as any).last_login_at) {
      const lastLogin = new Date((user as any).last_login_at)
      const daysSinceLogin = Math.floor((Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysSinceLogin < 7) {
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Active</span>
      } else if (daysSinceLogin < 30) {
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Idle</span>
      } else {
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"><AlertCircle className="h-3 w-3 mr-1" />Inactive</span>
      }
    }
    
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"><Clock className="h-3 w-3 mr-1" />Never</span>
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

  const exportUsers = async () => {
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString())
        }
      })
      params.append('limit', '1000') // Export more users
      
      const response = await fetch(`/api/admin/users?${params}`)
      const data = await response.json()
      
      // Convert to CSV
      const csvContent = [
        ['Email', 'Name', 'Status', 'Roles', 'Organizations', 'Created', 'Last Login'].join(','),
        ...data.users.map((user: ExtendedUser) => [
          user.email,
          (user as any).full_name || '',
          (user as any).is_active ? 'Active' : 'Inactive',
          user.roles.map(r => r.role_type).join(';'),
          (user as any).organizations?.map((o: any) => o.name).join(';') || '',
          formatDate(user.created_at),
          (user as any).last_login_at ? formatDate((user as any).last_login_at) : 'Never'
        ].map(field => `"${field}"`).join(','))
      ].join('\n')
      
      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting users:', error)
    }
  }

  const handleInviteUser = async (email: string, roleType: RoleType, organizationId: string) => {
    try {
      const response = await fetch('/api/admin/users/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          role_type: roleType,
          organization_id: organizationId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to invite user')
      }

      // Refresh users list
      await fetchUsers()
    } catch (error) {
      console.error('Error inviting user:', error)
      throw error
    }
  }

  const handleBulkAction = async (action: string) => {
    try {
      const response = await fetch('/api/admin/users/bulk', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_ids: selectedUsers,
          action
        })
      })

      if (!response.ok) {
        throw new Error('Failed to perform bulk action')
      }

      // Refresh users list and clear selection
      await fetchUsers()
      setSelectedUsers([])
    } catch (error) {
      console.error('Error performing bulk action:', error)
      throw error
    }
  }

  return (
    <PermissionGuard 
      permission={Permission.MANAGE_SYSTEM_USERS}
      fallback={
        <div className="p-8 text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You don&apos;t have permission to manage system users.</p>
        </div>
      }
    >
      <div className={`space-y-6 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Global User Management</h1>
            <p className="text-gray-600">Manage all users across the system</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportUsers}
              className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invite User
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => (u as any).is_active).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">System Admins</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.roles.some(r => r.role_type === RoleType.SYSTEM_ADMIN)).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Organizations</p>
                <p className="text-2xl font-bold text-gray-900">{organizations.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by email or name..."
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange({ ...filters, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filters.roleType || 'all'}
                onChange={(e) => handleFilterChange({ 
                  ...filters, 
                  roleType: e.target.value === 'all' ? '' : e.target.value 
                })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Roles</option>
                <option value={RoleType.SYSTEM_ADMIN}>System Admin</option>
                <option value={RoleType.ORG_ADMIN}>Organization Admin</option>
                <option value={RoleType.USER}>User</option>
              </select>
              <select
                value={filters.organizationId || 'all'}
                onChange={(e) => handleFilterChange({ 
                  ...filters, 
                  organizationId: e.target.value === 'all' ? '' : e.target.value 
                })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Organizations</option>
                {organizations.map(org => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 ${
                  showFilters ? 'bg-blue-50 border-blue-300' : ''
                }`}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <AdvancedFilters
              filters={filters}
              onFiltersChange={handleFilterChange}
              organizations={organizations}
              onClose={() => setShowFilters(false)}
            />
          )}

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {selectedUsers.length} user(s) selected
              </span>
              <button
                onClick={() => setShowBulkModal(true)}
                className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                Bulk Actions
              </button>
              <button
                onClick={() => setSelectedUsers([])}
                className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Clear Selection
              </button>
            </div>
          )}
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading users...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === users.length && users.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(users.map(user => user.id))
                          } else {
                            setSelectedUsers([])
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSortChange('email')}
                        className="flex items-center hover:text-gray-700"
                      >
                        User
                        <ChevronDown className={`h-4 w-4 ml-1 ${sortBy === 'email' ? 'text-blue-600' : 'text-gray-400'}`} />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Roles
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Organizations
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSortChange('last_sign_in_at')}
                        className="flex items-center hover:text-gray-700"
                      >
                        Last Login
                        <ChevronDown className={`h-4 w-4 ml-1 ${sortBy === 'last_sign_in_at' ? 'text-blue-600' : 'text-gray-400'}`} />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSortChange('created_at')}
                        className="flex items-center hover:text-gray-700"
                      >
                        Created
                        <ChevronDown className={`h-4 w-4 ml-1 ${sortBy === 'created_at' ? 'text-blue-600' : 'text-gray-400'}`} />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers([...selectedUsers, user.id])
                            } else {
                              setSelectedUsers(selectedUsers.filter(id => id !== user.id))
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            {(user as any).avatar_url ? (
                              <Image
                                src={(user as any).avatar_url}
                                alt={(user as any).full_name || user.email}
                                width={40}
                                height={40}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <Users className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {(user as any).full_name || 'No name'}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(user)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((role, index) => (
                            <span
                              key={index}
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(role.role_type)}`}
                            >
                              {role.role_type.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(user as any).organizations?.slice(0, 2).map((org: any) => (
                            <span
                              key={org.id}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                            >
                              <Building2 className="h-3 w-3 mr-1" />
                              {org.name}
                            </span>
                          ))}
                          {(user as any).organizations?.length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{(user as any).organizations?.length - 2} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {(user as any).last_login_at ? formatDate((user as any).last_login_at) : 'Never'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user)
                              setShowUserDetail(true)
                            }}
                            className="text-gray-400 hover:text-gray-600"
                            title="View Details"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleUserAction(user.id, 'delete')}
                            className="text-gray-400 hover:text-red-600"
                            title="Delete User"
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

          {users.length === 0 && !loading && (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600">
                {Object.keys(filters).length > 0 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by inviting your first user.'
                }
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.total > pagination.limit && (
          <div className="flex items-center justify-between bg-white px-4 py-3 border border-gray-200 rounded-lg">
            <div className="flex items-center text-sm text-gray-700">
              Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} results
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(Math.max(0, pagination.offset - pagination.limit))}
                disabled={pagination.offset === 0}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.offset + pagination.limit)}
                disabled={!pagination.has_more}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showUserDetail && selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => {
            setShowUserDetail(false)
            setSelectedUser(null)
          }}
          onUserUpdate={fetchUsers}
        />
      )}

      {showInviteModal && (
        <UserInviteModal
          isOpen={showInviteModal}
          organizations={organizations}
          onClose={() => setShowInviteModal(false)}
          onInvite={handleInviteUser}
        />
      )}

      {showBulkModal && (
        <BulkActionModal
          isOpen={showBulkModal}
          selectedCount={selectedUsers.length}
          onClose={() => setShowBulkModal(false)}
          onConfirm={handleBulkAction}
          action={bulkAction}
        />
      )}
    </PermissionGuard>
  )
}
