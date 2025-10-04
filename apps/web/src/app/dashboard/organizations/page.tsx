'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { 
  BuildingOfficeIcon, 
  UsersIcon, 
  PlusIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { OrganizationWithMembers } from '@/types/organization'
import { useOrganizations } from '@/lib/hooks/useOrganizations'
import CreateOrganizationModal from '@/components/organizations/CreateOrganizationModal'
import OrganizationCard from '@/components/organizations/OrganizationCard'

export default function OrganizationsPage() {
  const { user } = useAuth()
  const { organizations, loading, error, refetch } = useOrganizations()
  const [showCreateModal, setShowCreateModal] = useState(false)

  const handleCreateSuccess = () => {
    refetch() // Refresh the organizations list
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">Error loading organizations: {error}</p>
          <button
            type="button"
            onClick={refetch}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Header with Create Button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Organizations Overview</h2>
          <p className="text-sm text-gray-600 mt-1">Manage your organizations and teams</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Create Organization
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <BuildingOfficeIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Organizations</p>
              <p className="text-2xl font-bold text-gray-900">{organizations.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <UsersIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Members</p>
              <p className="text-2xl font-bold text-gray-900">
                {organizations.reduce((sum, org) => sum + org.member_count, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Organizations</p>
              <p className="text-2xl font-bold text-gray-900">
                {organizations.filter(org => org.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Organizations Grid */}
      {organizations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org) => (
            <OrganizationCard
              key={org.id}
              organization={org}
              onEdit={(org) => {
                // TODO: Implement edit functionality
                console.log('Edit organization:', org)
              }}
              onDelete={(org) => {
                // TODO: Implement delete functionality
                if (confirm(`Are you sure you want to delete "${org.name}"?`)) {
                  console.log('Delete organization:', org)
                }
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No organizations</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating your first organization.</p>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              Create Organization
            </button>
          </div>
        </div>
      )}

      {/* Create Organization Modal */}
      <CreateOrganizationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </>
  )
}