'use client'

import React, { useState, useEffect } from 'react'
import { Organization, UserRole, RoleType } from '@/types/multi-role'
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Shield,
  Crown,
  User,
  Mail,
  Calendar,
  MoreVertical
} from 'lucide-react'

interface OrganizationUsersProps {
  organizationId: string
  organization: Organization
  onUpdate: () => void
}

interface UserWithRole extends UserRole {
  user: {
    id: string
    email: string
    created_at: string
    last_sign_in_at?: string
  }
}

export default function OrganizationUsers({ organizationId, organization, onUpdate }: OrganizationUsersProps) {
  const [users, setUsers] = useState<UserWithRole[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<RoleType | 'all'>('all')
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  useEffect(() => {
    fetchUsers()
  }, [organizationId])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/organizations/${organizationId}/users`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: RoleType) => {
    try {
      const response = await fetch(`/api/admin/organizations/${organizationId}/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role_type: newRole }),
      })

      if (response.ok) {
        await fetchUsers()
        onUpdate()
      }
    } catch (error) {
      console.error('Error updating user role:', error)
    }
  }

  const handleRemoveUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/organizations/${organizationId}/users/${userId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchUsers()
        onUpdate()
      }
    } catch (error) {
      console.error('Error removing user:', error)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === 'all' || user.role_type === filterRole
    return matchesSearch && matchesRole
  })

  const getRoleIcon = (role: RoleType) => {
    switch (role) {
      case RoleType.SYSTEM_ADMIN:
        return <Shield className="h-4 w-4 text-red-600" />
      case RoleType.ORG_ADMIN:
        return <Crown className="h-4 w-4 text-purple-600" />
      case RoleType.USER:
        return <User className="h-4 w-4 text-blue-600" />
      default:
        return <User className="h-4 w-4 text-gray-600" />
    }
  }

  const getRoleBadgeColor = (role: RoleType) => {
    switch (role) {
      case RoleType.SYSTEM_ADMIN:
        return 'bg-red-100 text-red-800'
      case RoleType.ORG_ADMIN:
        return 'bg-purple-100 text-purple-800'
      case RoleType.USER:
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Organization Users</h2>
          <p className="text-gray-600">Manage users and their roles in {organization.name}</p>
        </div>
        <button
          onClick={() => setShowInviteForm(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Invite User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Crown className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Admins</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role_type === RoleType.ORG_ADMIN).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <User className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Regular Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role_type === RoleType.USER).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Recent Joins</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => {
                  const joinDate = new Date(u.assigned_at)
                  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                  return joinDate > weekAgo
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as RoleType | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Roles</option>
              <option value={RoleType.ORG_ADMIN}>Organization Admin</option>
              <option value={RoleType.USER}>User</option>
            </select>
          </div>
        </div>
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
                      checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(filteredUsers.map(user => user.id))
                        } else {
                          setSelectedUsers([])
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Active
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((userRole) => (
                  <tr key={userRole.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(userRole.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers([...selectedUsers, userRole.id])
                          } else {
                            setSelectedUsers(selectedUsers.filter(id => id !== userRole.id))
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {userRole.user.email}
                          </div>
                          <div className="text-sm text-gray-500">
                            {userRole.user.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <select
                          value={userRole.role_type}
                          onChange={(e) => handleRoleChange(userRole.user_id, e.target.value as RoleType)}
                          className="text-sm border-0 bg-transparent focus:ring-0"
                        >
                          <option value={RoleType.USER}>User</option>
                          <option value={RoleType.ORG_ADMIN}>Organization Admin</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatDate(userRole.assigned_at)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {userRole.user.last_sign_in_at 
                        ? formatDateTime(userRole.user.last_sign_in_at)
                        : 'Never'
                      }
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleRemoveUser(userRole.user_id)}
                          className="text-gray-400 hover:text-red-600"
                          title="Remove user"
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

        {filteredUsers.length === 0 && !loading && (
          <div className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600">
              {searchTerm || filterRole !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by inviting users to this organization.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800">
              {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex space-x-2">
              <button className="text-sm text-blue-600 hover:text-blue-800">
                Change Role
              </button>
              <button className="text-sm text-red-600 hover:text-red-800">
                Remove Users
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
