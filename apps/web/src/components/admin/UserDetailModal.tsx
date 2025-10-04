'use client'

import React, { useState } from 'react'
import { X, Edit, Save, User, Mail, Phone, Globe, Shield, Building2, Calendar, Activity } from 'lucide-react'
import { ExtendedUser as UserType, Organization, RoleType, Permission } from '@/types/multi-role'
import PermissionGuard from '@/components/auth/PermissionGuard'

interface UserDetailModalProps {
  user: UserType
  onClose: () => void
  onUserUpdate: () => void
}

export default function UserDetailModal({ user, onClose, onUserUpdate }: UserDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'roles' | 'activity'>('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    full_name: (user as any).full_name || '',
    phone: '',
    timezone: 'UTC'
  })

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_profile',
          ...formData
        }),
      })

      if (response.ok) {
        setIsEditing(false)
        onUserUpdate()
      }
    } catch (error) {
      console.error('Error updating user:', error)
    }
  }

  const handleAssignRole = async (organizationId: string, roleType: RoleType) => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'assign_role',
          organization_id: organizationId,
          role_type: roleType
        }),
      })

      if (response.ok) {
        onUserUpdate()
      }
    } catch (error) {
      console.error('Error assigning role:', error)
    }
  }

  const handleRemoveRole = async (roleId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'remove_role',
          role_id: roleId
        }),
      })

      if (response.ok) {
        onUserUpdate()
      }
    } catch (error) {
      console.error('Error removing role:', error)
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
              {(user as any).avatar_url ? (
                <img
                  src={(user as any).avatar_url}
                  alt={(user as any).full_name || user.email}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <User className="h-6 w-6 text-gray-400" />
              )}
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {(user as any).full_name || 'No name'}
              </h2>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'roles', label: 'Roles & Permissions', icon: Shield },
              { id: 'activity', label: 'Activity', icon: Activity }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      className="flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex items-center px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{(user as any).full_name || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                    <p className="text-gray-900">{user.email}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gray-400 mr-2" />
                      <p className="text-gray-900">{formData.phone || 'Not provided'}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  {isEditing ? (
                    <select
                      value={formData.timezone}
                      onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                      <option value="Europe/London">London</option>
                      <option value="Europe/Paris">Paris</option>
                      <option value="Asia/Tokyo">Tokyo</option>
                    </select>
                  ) : (
                    <div className="flex items-center">
                      <Globe className="h-4 w-4 text-gray-400 mr-2" />
                      <p className="text-gray-900">{formData.timezone}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Status
                  </label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    (user as any).is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {(user as any).is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Member Since
                  </label>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <p className="text-gray-900">{formatDate(user.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Roles & Permissions</h3>
                <PermissionGuard permission={Permission.MANAGE_SYSTEM_USERS}>
                  <button
                    onClick={() => {/* Open role assignment modal */}}
                    className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Assign Role
                  </button>
                </PermissionGuard>
              </div>

              <div className="space-y-4">
                {user.roles.map((role: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadgeColor(role.role_type)}`}>
                          {role.role_type.replace('_', ' ')}
                        </span>
                        {role.organization && (
                          <div className="ml-3 flex items-center">
                            <Building2 className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="text-sm text-gray-600">{role.organization.name}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          role.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {role.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <PermissionGuard permission={Permission.MANAGE_SYSTEM_USERS}>
                          <button
                            onClick={() => handleRemoveRole(role.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </PermissionGuard>
                      </div>
                    </div>
                    {role.permissions && role.permissions.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Custom Permissions:</p>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.map((permission: any, permIndex: number) => (
                            <span
                              key={permIndex}
                              className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-800"
                            >
                              {permission}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="mt-2 text-xs text-gray-500">
                      Assigned: {formatDate(role.assigned_at)}
                      {role.expires_at && ` • Expires: ${formatDate(role.expires_at)}`}
                    </div>
                  </div>
                ))}

                {user.roles.length === 0 && (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No roles assigned</h3>
                    <p className="text-gray-600">This user doesn&apos;t have any roles assigned yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
              
              <div className="space-y-4">
                {/* This would show recent audit logs for the user */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Profile updated</p>
                      <p className="text-xs text-gray-500">Updated personal information</p>
                    </div>
                    <span className="text-xs text-gray-500">{formatDate(user.created_at)}</span>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Account created</p>
                      <p className="text-xs text-gray-500">User account was created</p>
                    </div>
                    <span className="text-xs text-gray-500">{formatDate(user.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
