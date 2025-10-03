'use client'

import { useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { InviteMemberForm, OrganizationRole } from '@/types/organization'
import { useInviteMember } from '@/lib/hooks/useOrganizations'
import { useAuth } from '@/contexts/AuthContext'

interface InviteMemberModalProps {
  isOpen: boolean
  onClose: () => void
  organizationId: string
  onSuccess?: () => void
}

export default function InviteMemberModal({ 
  isOpen, 
  onClose, 
  organizationId,
  onSuccess 
}: InviteMemberModalProps) {
  const { user } = useAuth()
  const { inviteMember, loading, error } = useInviteMember()
  const [formData, setFormData] = useState<InviteMemberForm>({
    email: '',
    role: 'member'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      alert('You must be logged in to invite members')
      return
    }

    try {
      await inviteMember(organizationId, formData, user.id)
      onSuccess?.()
      onClose()
      // Reset form
      setFormData({
        email: '',
        role: 'member'
      })
    } catch (err) {
      // Error is handled by the hook
      console.error('Failed to invite member:', err)
    }
  }

  const handleClose = () => {
    onClose()
    // Reset form when closing
    setFormData({
      email: '',
      role: 'member'
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Invite Member</h2>
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
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="user@example.com"
            />
            <p className="text-xs text-gray-500 mt-1">
              The user must already have an account in the system
            </p>
          </div>

          {/* Role */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Role *
            </label>
            <select
              id="role"
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as OrganizationRole })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="viewer">Viewer - Can view organization data</option>
              <option value="member">Member - Can view and contribute</option>
              <option value="admin">Admin - Can manage members and settings</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              You can change the role later from the members page
            </p>
          </div>

          {/* Role Descriptions */}
          <div className="bg-gray-50 rounded-md p-3">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Role Permissions:</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li><strong>Viewer:</strong> Read-only access to organization data</li>
              <li><strong>Member:</strong> Can view and contribute to projects</li>
              <li><strong>Admin:</strong> Can manage members, settings, and organization data</li>
              <li><strong>Owner:</strong> Full control (cannot be assigned via invitation)</li>
            </ul>
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
              disabled={loading || !formData.email.trim()}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md transition-colors"
            >
              {loading ? 'Sending Invite...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}