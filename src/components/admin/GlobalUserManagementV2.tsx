'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Organization, Permission, ExtendedUser, RoleType } from '@/types/multi-role'
import { authenticatedApiCall } from '@/lib/utils/api-client'
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
import EnhancedDataTable from './EnhancedDataTable'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'

interface Filters {
  search: string
  roleType: string
  organizationId: string
  isActive: string
  createdAfter: string
  createdBefore: string
}

interface Pagination {
  total: number
  limit: number
  offset: number
}

export default function GlobalUserManagementV2({
  initialUsers = [],
  initialOrganizations = [],
}: {
  initialUsers?: ExtendedUser[]
  initialOrganizations?: Organization[]
}) {
  const [users, setUsers] = useState<ExtendedUser[]>(initialUsers)
  const [organizations, setOrganizations] = useState<Organization[]>(initialOrganizations)
  const [loading, setLoading] = useState(false)
  const [showUserDetailModal, setShowUserDetailModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showBulkActionModal, setShowBulkActionModal] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [selectedUser, setSelectedUser] = useState<ExtendedUser | null>(null)
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState<'activate' | 'deactivate' | 'delete' | null>(null)
  const [filters, setFilters] = useState<Filters>({
    search: '',
    roleType: 'all',
    organizationId: 'all',
    isActive: 'all',
    createdAfter: '',
    createdBefore: '',
  })
  const [pagination, setPagination] = useState<Pagination>({
    total: initialUsers.length,
    limit: 10,
    offset: 0,
  })
  const [sortBy, setSortBy] = useState<string>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.roleType !== 'all') params.append('role_type', filters.roleType)
      if (filters.organizationId !== 'all') params.append('organization_id', filters.organizationId)
      if (filters.isActive !== 'all') params.append('is_active', filters.isActive)
      if (filters.createdAfter) params.append('created_after', filters.createdAfter)
      if (filters.createdBefore) params.append('created_before', filters.createdBefore)
      params.append('limit', pagination.limit.toString())
      params.append('offset', pagination.offset.toString())
      params.append('sort_by', sortBy)
      params.append('sort_order', sortOrder)

      const url = `/api/admin/users?${params.toString()}`
      const response = await authenticatedApiCall(url)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setUsers(data.users || [])
      setPagination(data.pagination || pagination)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }, [filters, pagination.limit, pagination.offset, sortBy, sortOrder])

  const fetchOrganizations = useCallback(async () => {
    try {
      const url = '/api/admin/organizations'
      const response = await authenticatedApiCall(url)

      if (response.ok) {
        const data = await response.json()
        setOrganizations(data.organizations || [])
      }
    } catch (error) {
      console.error('Error fetching organizations:', error)
    }
  }, [])

  useEffect(() => {
    if (initialUsers.length === 0) {
      fetchUsers()
    }
    if (initialOrganizations.length === 0) {
      fetchOrganizations()
    }
  }, [initialUsers.length, initialOrganizations.length]) // Removed fetch functions from dependencies

  const handleUserClick = (user: ExtendedUser) => {
    setSelectedUser(user)
    setShowUserDetailModal(true)
  }

  const handleSelectUser = (userId: string, isSelected: boolean) => {
    setSelectedUserIds(prev =>
      isSelected ? [...prev, userId] : prev.filter(id => id !== userId)
    )
  }

  const handleSelectAllUsers = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedUserIds(users.map(user => user.id))
    } else {
      setSelectedUserIds([])
    }
  }

  const handleInviteUser = () => {
    setShowInviteModal(true)
  }

  const handleBulkAction = (action: 'activate' | 'deactivate' | 'delete') => {
    setBulkAction(action)
    setShowBulkActionModal(true)
  }

  const handleFilterChange = (newFilters: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setPagination(prev => ({ ...prev, offset: 0 })) // Reset offset on filter change
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, offset: (newPage - 1) * prev.limit }))
  }

  const handleItemsPerPageChange = (newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit, offset: 0 }))
  }

  const columns = [
    {
      key: 'select',
      label: 'Select',
      sortable: false,
      render: (user: ExtendedUser) => (
        <input
          type="checkbox"
          className="form-checkbox h-4 w-4 text-brand-600"
          checked={selectedUserIds.includes(user.id)}
          onChange={(e) => handleSelectUser(user.id, e.target.checked)}
        />
      ),
    },
    {
      key: 'user',
      label: 'User',
      sortable: true,
      render: (user: ExtendedUser) => (
        <div className="flex items-center gap-3">
          <Image
            src={(user as any).avatar_url || '/images/default-avatar.png'}
            alt={(user as any).full_name || user.email}
            width={32}
            height={32}
            className="h-8 w-8 rounded-full object-cover"
          />
          <div>
            <p className="font-medium text-gray-800 dark:text-white">
              {(user as any).full_name || 'N/A'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {user.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'roles',
      label: 'Roles',
      sortable: false,
      render: (user: ExtendedUser) => (
        <div className="flex flex-wrap gap-1">
          {(user as any).roles?.map((role: any, index: number) => (
            <span
              key={index}
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                role.role_type === RoleType.SYSTEM_ADMIN
                  ? 'bg-purple-100 text-purple-800'
                  : role.role_type === RoleType.ORG_ADMIN
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              {role.role_type}
              {role.organizations && role.organizations.length > 0 && (
                <span className="ml-1">({role.organizations[0].name})</span>
              )}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (user: ExtendedUser) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            (user as any).is_active
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {(user as any).is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'last_login_at',
      label: 'Last Login',
      sortable: true,
      render: (user: ExtendedUser) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {(user as any).last_login_at ? new Date((user as any).last_login_at).toLocaleString() : 'Never'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Created At',
      sortable: true,
      render: (user: ExtendedUser) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(user.created_at).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (user: ExtendedUser) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleUserClick(user)
            }}
            className="text-gray-600 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400"
          >
            <Edit className="h-4 w-4" />
          </Button>
          {/* More actions can be added here */}
        </div>
      ),
    },
  ]

  return (
    <PermissionGuard
      permission={Permission.MANAGE_SYSTEM_USERS}
      fallback={
        <div className="p-8 text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You do not have permission to manage system users.</p>
        </div>
      }
    >
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <Users className="h-8 w-8 mr-3 text-brand-600" />
            Global User Management
          </h1>
          <div className="flex space-x-3">
            <Button
              onClick={handleInviteUser}
              className="bg-brand-600 hover:bg-brand-700 text-white flex items-center"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Invite User
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowAdvancedFilters(true)}
              className="flex items-center"
            >
              <Filter className="h-5 w-5 mr-2" />
              Advanced Filters
            </Button>
            {selectedUserIds.length > 0 && (
              <div className="relative">
                <Button
                  variant="outline"
                  className="flex items-center"
                  onClick={() => { /* Toggle dropdown for bulk actions */ }}
                >
                  Bulk Actions ({selectedUserIds.length}) <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
                {/* Dropdown content for bulk actions */}
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10">
                  <Button variant="ghost" className="w-full justify-start" onClick={() => handleBulkAction('activate')}>Activate</Button>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => handleBulkAction('deactivate')}>Deactivate</Button>
                  <Button variant="ghost" className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleBulkAction('delete')}>Delete</Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {showAdvancedFilters && (
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">Advanced Filters</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowAdvancedFilters(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <AdvancedFilters
                filters={filters}
                organizations={organizations}
                onFiltersChange={handleFilterChange}
                onClose={() => setShowAdvancedFilters(false)}
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-0">
            <EnhancedDataTable
              data={users}
              columns={columns}
              searchable={true}
              sortable={true}
              pagination={true}
              itemsPerPage={pagination.limit}
            />
          </CardContent>
        </Card>

        {/* Modals */}
        {showUserDetailModal && selectedUser && (
          <UserDetailModal
            user={selectedUser}
            onClose={() => {
              setShowUserDetailModal(false)
              setSelectedUser(null)
            }}
            onUserUpdate={() => {
              setShowUserDetailModal(false)
              setSelectedUser(null)
              fetchUsers()
            }}
          />
        )}

        {showInviteModal && (
          <UserInviteModal
            organizations={organizations}
            isOpen={showInviteModal}
            onClose={() => setShowInviteModal(false)}
            onInvite={async (email: string, roleType: RoleType, organizationId: string) => {
              // Handle invite logic here
              console.log('Inviting user:', { email, roleType, organizationId })
              setShowInviteModal(false)
              fetchUsers()
            }}
          />
        )}

        {showBulkActionModal && bulkAction && (
          <BulkActionModal
            action={bulkAction}
            selectedCount={selectedUserIds.length}
            isOpen={showBulkActionModal}
            onClose={() => setShowBulkActionModal(false)}
            onConfirm={async (action) => {
              // Handle bulk action logic here
              console.log('Bulk action:', action, selectedUserIds)
              setShowBulkActionModal(false)
              setSelectedUserIds([])
              fetchUsers()
            }}
          />
        )}
      </div>
    </PermissionGuard>
  )
}