'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { 
  CogIcon,
  BuildingOfficeIcon,
  UsersIcon,
  ShieldCheckIcon,
  TrashIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'
import { Organization, UpdateOrganizationForm } from '@/types/organization'

export default function OrganizationSettingsPage() {
  const { user } = useAuth()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<UpdateOrganizationForm>({})

  useEffect(() => {
    if (user) {
      fetchOrganization()
    }
  }, [user])

  const fetchOrganization = async () => {
    try {
      setLoading(true)
      // TODO: Implement API call to fetch organization
      // For now, using mock data
      const mockOrganization: Organization = {
        id: '1',
        name: 'Acme Corporation',
        description: 'Leading technology solutions provider',
        logo_url: null,
        website: 'https://acme.com',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        owner_id: user?.id || '',
        status: 'active',
        settings: {
          allow_member_invites: true,
          require_approval: false,
          max_members: 50
        }
      }
      setOrganization(mockOrganization)
      setFormData({
        name: mockOrganization.name,
        description: mockOrganization.description ?? '',
        website: mockOrganization.website ?? '',
        settings: mockOrganization.settings ? {
          allow_member_invites: mockOrganization.settings.allow_member_invites,
          require_approval: mockOrganization.settings.require_approval,
          max_members: mockOrganization.settings.max_members ?? undefined
        } : {
          allow_member_invites: true,
          require_approval: false,
          max_members: undefined
        }
      })
    } catch (error) {
      console.error('Error fetching organization:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      // TODO: Implement API call to update organization
      console.log('Saving organization:', formData)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      alert('Organization settings saved successfully!')
    } catch (error) {
      console.error('Error saving organization:', error)
      alert('Error saving organization settings')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
      return
    }
    
    try {
      // TODO: Implement API call to delete organization
      console.log('Deleting organization:', organization?.id)
      alert('Organization deletion would be implemented here')
    } catch (error) {
      console.error('Error deleting organization:', error)
      alert('Error deleting organization')
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Organization not found</h3>
          <p className="mt-1 text-sm text-gray-500">The organization you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Organization Settings</h1>
        <p className="text-gray-600 mt-1">Manage your organization's information and preferences</p>
      </div>

      <div className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <BuildingOfficeIcon className="h-5 w-5 mr-2" />
              Basic Information
            </h2>
          </div>
          <div className="p-6 space-y-6">
            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization Logo
              </label>
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center">
                  {organization.logo_url ? (
                    <img 
                      src={organization.logo_url} 
                      alt="Organization logo" 
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                  ) : (
                    <PhotoIcon className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <div>
                  <button className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Upload Logo
                  </button>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 2MB</p>
                </div>
              </div>
            </div>

            {/* Organization Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Organization Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter organization name"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe your organization"
              />
            </div>

            {/* Website */}
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                Website
              </label>
              <input
                type="url"
                id="website"
                value={formData.website || ''}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com"
              />
            </div>
          </div>
        </div>

        {/* Member Settings */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <UsersIcon className="h-5 w-5 mr-2" />
              Member Settings
            </h2>
          </div>
          <div className="p-6 space-y-6">
            {/* Allow Member Invites */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Allow Member Invites</h3>
                <p className="text-sm text-gray-500">Let members invite other users to the organization</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="allow_member_invites"
                  checked={formData.settings?.allow_member_invites ?? true}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: {
                      ...formData.settings,
                      allow_member_invites: e.target.checked,
                      require_approval: formData.settings?.require_approval ?? false,
                      max_members: formData.settings?.max_members
                    }
                  })}
                  className="sr-only"
                  aria-label="Allow member invites"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Require Approval */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Require Approval</h3>
                <p className="text-sm text-gray-500">New members need approval before joining</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <span id="require_approval_label" className="sr-only">Require approval for new members</span>
                <input
                  type="checkbox"
                  id="require_approval"
                  aria-labelledby="require_approval_label"
                  checked={formData.settings?.require_approval ?? false}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: {
                      ...formData.settings,
                      allow_member_invites: formData.settings?.allow_member_invites ?? true,
                      require_approval: e.target.checked,
                      max_members: formData.settings?.max_members ?? 50
                    }
                  })}
                  className="sr-only"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Max Members */}
            <div>
              <label htmlFor="max_members" className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Members
              </label>
              <input
                type="number"
                id="max_members"
                value={formData.settings?.max_members || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  settings: {
                    ...formData.settings,
                    allow_member_invites: formData.settings?.allow_member_invites ?? true,
                    require_approval: formData.settings?.require_approval ?? false,
                    max_members: e.target.value ? parseInt(e.target.value) : undefined
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Leave empty for unlimited"
                min="1"
              />
              <p className="text-sm text-gray-500 mt-1">Leave empty for unlimited members</p>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-lg shadow border border-red-200">
          <div className="px-6 py-4 border-b border-red-200">
            <h2 className="text-lg font-medium text-red-900 flex items-center">
              <ShieldCheckIcon className="h-5 w-5 mr-2" />
              Danger Zone
            </h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Delete Organization</h3>
                <p className="text-sm text-gray-500">
                  Permanently delete this organization and all its data. This action cannot be undone.
                </p>
              </div>
              <button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <TrashIcon className="h-4 w-4" />
                Delete Organization
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}