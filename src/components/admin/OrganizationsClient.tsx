'use client'

import { useState } from 'react'
import CreateOrganizationModal from './CreateOrganizationModal'

interface Organization {
  id: string
  name: string
  slug: string
  description: string | null
  max_users: number
  max_apis: number
  created_at: string
  updated_at: string
  is_active: boolean
}

interface OrganizationsClientProps {
  initialOrganizations: Organization[]
}

export default function OrganizationsClient({ initialOrganizations }: OrganizationsClientProps) {
  const [organizations, setOrganizations] = useState<Organization[]>(initialOrganizations)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refreshOrganizations = async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch('/api/admin/organizations')
      if (response.ok) {
        const data = await response.json()
        setOrganizations(data.organizations || [])
      }
    } catch (error) {
      console.error('Failed to refresh organizations:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleCreateSuccess = () => {
    refreshOrganizations()
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
          <p className="text-gray-600 mt-1">Manage all organizations in the system</p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Organization
        </button>
      </div>

      {organizations.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-gray-400 text-4xl mb-4">🏢</div>
          <h3 className="text-gray-900 font-medium mb-2">No Organizations Found</h3>
          <p className="text-gray-600 text-sm mb-4">
            There are no organizations in the system yet.
          </p>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Create Your First Organization
          </button>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              Organizations ({organizations.length})
            </h3>
            <button
              type="button"
              onClick={refreshOrganizations}
              disabled={isRefreshing}
              className="text-indigo-600 hover:text-indigo-900 text-sm font-medium disabled:opacity-50"
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Limits
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {organizations.map((org: Organization) => (
                <tr key={org.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {org.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {org.slug}
                      </div>
                      {org.description && (
                        <div className="text-xs text-gray-400 mt-1">
                          {org.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>Users: {org.max_users}</div>
                    <div>APIs: {org.max_apis}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(org.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <a
                      href={`/admin/organizations/${org.id}`}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      View
                    </a>
                    <button 
                      type="button"
                      className="text-gray-400 hover:text-gray-600"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateOrganizationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  )
}