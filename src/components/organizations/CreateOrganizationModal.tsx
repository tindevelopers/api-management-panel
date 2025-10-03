'use client'

import { useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { CreateOrganizationForm } from '@/types/organization'
import { useCreateOrganization } from '@/lib/hooks/useOrganizations'
import { useAuth } from '@/contexts/AuthContext'

interface CreateOrganizationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function CreateOrganizationModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: CreateOrganizationModalProps) {
  const { user } = useAuth()
  const { createOrganization, loading, error } = useCreateOrganization()
  const [formData, setFormData] = useState<CreateOrganizationForm>({
    name: '',
    description: '',
    website: '',
    settings: {
      allow_member_invites: true,
      require_approval: false,
      max_members: 50
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      alert('You must be logged in to create an organization')
      return
    }

    try {
      await createOrganization(formData, user.id)
      onSuccess?.()
      onClose()
      // Reset form
      setFormData({
        name: '',
        description: '',
        website: '',
        settings: {
          allow_member_invites: true,
          require_approval: false,
          max_members: 50
        }
      })
    } catch (err) {
      // Error is handled by the hook
      console.error('Failed to create organization:', err)
    }
  }

  const handleClose = () => {
    onClose()
    // Reset form when closing
    setFormData({
      name: '',
      description: '',
      website: '',
      settings: {
        allow_member_invites: true,
        require_approval: false,
        max_members: 50
      }
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Create Organization</h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Organization Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Organization Name *
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter organization name"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe your organization"
            />
          </div>

          {/* Website */}
          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
              Website
            </label>
            <input
              type="url"
              id="website"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com"
            />
          </div>

          {/* Settings */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Member Settings</h3>
            
            <div className="space-y-3">
              {/* Allow Member Invites */}
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="allow_invites" className="text-sm font-medium text-gray-700">
                    Allow Member Invites
                  </label>
                  <p className="text-xs text-gray-500">Let members invite others</p>
                </div>
                <input
                  type="checkbox"
                  id="allow_invites"
                  checked={formData.settings?.allow_member_invites || false}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: {
                      ...formData.settings,
                      allow_member_invites: e.target.checked,
                      require_approval: formData.settings?.require_approval || false,
                      max_members: formData.settings?.max_members || 50
                    }
                  })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              {/* Require Approval */}
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="require_approval" className="text-sm font-medium text-gray-700">
                    Require Approval
                  </label>
                  <p className="text-xs text-gray-500">New members need approval</p>
                </div>
                <input
                  type="checkbox"
                  id="require_approval"
                  checked={formData.settings?.require_approval || false}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: {
                      ...formData.settings,
                      allow_member_invites: formData.settings?.allow_member_invites || true,
                      require_approval: e.target.checked,
                      max_members: formData.settings?.max_members || 50
                    }
                  })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              {/* Max Members */}
              <div>
                <label htmlFor="max_members" className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Members
                </label>
                <input
                  type="number"
                  id="max_members"
                  min="1"
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
                  placeholder="50"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited</p>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md transition-colors"
            >
              {loading ? 'Creating...' : 'Create Organization'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}