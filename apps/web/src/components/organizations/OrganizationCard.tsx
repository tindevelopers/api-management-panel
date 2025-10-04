'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  BuildingOfficeIcon, 
  UsersIcon, 
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { OrganizationWithMembers } from '@/types/organization'

interface OrganizationCardProps {
  organization: OrganizationWithMembers
  onEdit?: (organization: OrganizationWithMembers) => void
  onDelete?: (organization: OrganizationWithMembers) => void
}

export default function OrganizationCard({ 
  organization, 
  onEdit, 
  onDelete 
}: OrganizationCardProps) {
  const [showMenu, setShowMenu] = useState(false)

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800'
    }
    return statusStyles[status as keyof typeof statusStyles] || statusStyles.inactive
  }

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              {organization.logo_url ? (
                <img 
                  src={organization.logo_url} 
                  alt={`${organization.name} logo`}
                  className="h-6 w-6 rounded object-cover"
                />
              ) : (
                <BuildingOfficeIcon className="h-6 w-6 text-gray-600" />
              )}
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-gray-900">{organization.name}</h3>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(organization.status)}`}>
                {organization.status}
              </span>
            </div>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              aria-label="Organization options"
            >
              <EllipsisVerticalIcon className="h-5 w-5 text-gray-400" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <div className="py-1">
                  <Link
                    href={`/dashboard/organizations/${organization.id}`}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowMenu(false)}
                  >
                    <EyeIcon className="h-4 w-4 mr-2" />
                    View Details
                  </Link>
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        onEdit(organization)
                        setShowMenu(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <PencilIcon className="h-4 w-4 mr-2" />
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => {
                        onDelete(organization)
                        setShowMenu(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {organization.description || 'No description provided'}
        </p>
        
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center">
            <UsersIcon className="h-4 w-4 mr-1" />
            {organization.member_count} members
          </div>
          <div>
            Created {new Date(organization.created_at).toLocaleDateString()}
          </div>
        </div>
        
        {organization.website && (
          <a 
            href={organization.website} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm block mb-4"
          >
            {organization.website}
          </a>
        )}
        
        <div className="pt-4 border-t border-gray-200">
          <div className="flex gap-2">
            <Link
              href={`/dashboard/organizations/${organization.id}`}
              className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded text-sm font-medium transition-colors text-center"
            >
              View Details
            </Link>
            <Link
              href={`/dashboard/organizations/${organization.id}/members`}
              className="px-3 py-2 text-gray-600 hover:text-gray-800 rounded text-sm font-medium transition-colors"
            >
              Members
            </Link>
            <Link
              href={`/dashboard/organizations/${organization.id}/settings`}
              className="px-3 py-2 text-gray-600 hover:text-gray-800 rounded text-sm font-medium transition-colors"
            >
              Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}