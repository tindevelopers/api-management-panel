'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Organization, Permission } from '@/types/multi-role'
import { Building2, ChevronDown, Plus, Users, Settings } from 'lucide-react'

interface OrganizationSelectorProps {
  className?: string
  showCreateButton?: boolean
  onOrganizationChange?: (organization: Organization | null) => void
}

export default function OrganizationSelector({ 
  className = '', 
  showCreateButton = false,
  onOrganizationChange 
}: OrganizationSelectorProps) {
  const { 
    organizations, 
    currentOrganization, 
    setCurrentOrganization,
    hasPermission
  } = useAuth()
  
  const [isOpen, setIsOpen] = useState(false)

  const handleOrganizationSelect = (organization: Organization) => {
    setCurrentOrganization(organization)
    onOrganizationChange?.(organization)
    setIsOpen(false)
  }

  const canCreateOrganization = hasPermission(Permission.MANAGE_ORGANIZATIONS)

  if (organizations.length === 0) {
    return (
      <div className={`p-4 border border-gray-200 rounded-lg bg-gray-50 ${className}`}>
        <div className="flex items-center justify-center text-center">
          <div>
            <Building2 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-2">No organizations found</p>
            {canCreateOrganization && (
              <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                Create your first organization
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* Current Organization Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <div className="flex items-center">
          <Building2 className="h-5 w-5 text-gray-500 mr-3" />
          <div className="text-left">
            <p className="text-sm font-medium text-gray-900">
              {currentOrganization?.name || 'Select Organization'}
            </p>
            {currentOrganization && (
              <p className="text-xs text-gray-500">
                {currentOrganization.slug}
              </p>
            )}
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
            {organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => handleOrganizationSelect(org)}
                className={`w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors ${
                  currentOrganization?.id === org.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                }`}
              >
                <div className="flex items-center">
                  <Building2 className="h-5 w-5 text-gray-500 mr-3" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {org.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {org.slug}
                    </p>
                  </div>
                </div>
                {currentOrganization?.id === org.id && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </button>
            ))}

            {/* Create Organization Button */}
            {showCreateButton && canCreateOrganization && (
              <>
                <div className="border-t border-gray-200 my-1" />
                <button
                  onClick={() => {
                    setIsOpen(false)
                    // Navigate to create organization page
                  }}
                  className="w-full flex items-center p-3 hover:bg-gray-50 transition-colors text-blue-600"
                >
                  <Plus className="h-5 w-5 mr-3" />
                  <span className="text-sm font-medium">Create Organization</span>
                </button>
              </>
            )}
          </div>
        </>
      )}

      {/* Organization Stats */}
      {currentOrganization && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-gray-600">
              <Users className="h-4 w-4 mr-1" />
              <span>Members</span>
            </div>
            <span className="font-medium">
              {/* You would fetch actual member count here */}
              5
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm mt-1">
            <div className="flex items-center text-gray-600">
              <Settings className="h-4 w-4 mr-1" />
              <span>Plan</span>
            </div>
            <span className="font-medium capitalize">
              {currentOrganization.subscription_plan || 'Free'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// Compact version for header/top bar
export function OrganizationSelectorCompact({ 
  className = '',
  onOrganizationChange 
}: Omit<OrganizationSelectorProps, 'showCreateButton'>) {
  const { 
    organizations, 
    currentOrganization, 
    setCurrentOrganization 
  } = useAuth()
  
  const [isOpen, setIsOpen] = useState(false)

  const handleOrganizationSelect = (organization: Organization) => {
    setCurrentOrganization(organization)
    onOrganizationChange?.(organization)
    setIsOpen(false)
  }

  if (organizations.length <= 1) {
    return (
      <div className={`flex items-center text-sm font-medium text-gray-700 ${className}`}>
        <Building2 className="h-4 w-4 mr-2" />
        {currentOrganization?.name || 'No Organization'}
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none"
      >
        <Building2 className="h-4 w-4 mr-2" />
        {currentOrganization?.name || 'Select Organization'}
        <ChevronDown className="h-3 w-3 ml-1" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 min-w-48">
            {organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => handleOrganizationSelect(org)}
                className={`w-full flex items-center justify-between p-2 text-sm hover:bg-gray-50 ${
                  currentOrganization?.id === org.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
              >
                <span>{org.name}</span>
                {currentOrganization?.id === org.id && (
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
