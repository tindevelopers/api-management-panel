'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { RoleType, UserRole, Organization, Permission, ExtendedUser } from '@/types/multi-role'
import { authenticatedApiCall } from '@/lib/utils/api-client'
import { debugLogger } from '@/lib/utils/debug'
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Shield,
  Building2,
  UserPlus,
  CheckCircle,
  AlertCircle,
  Clock,
  MoreVertical
} from 'lucide-react'
import PermissionGuard from '@/components/auth/PermissionGuard'
import UserDetailModal from './UserDetailModal'
import UserInviteModal from './UserInviteModal'
import BulkActionModal from './BulkActionModal'
import AdvancedFilters from './AdvancedFilters'
import DebugPanel from './DebugPanel'
import EnhancedDataTable from './EnhancedDataTable'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
  last_sign_in_at?: string
  last_login_at?: string
  is_active: boolean
  roles: UserRole[]
  organizations: Organization[]
}

interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

interface Filters {
  search: string
  roleType: string
  organizationId: string
  isActive: string
  createdAfter: string
  createdBefore: string
}

interface GlobalUserManagementProps {
  initialUsers?: ExtendedUser[]
  initialOrganizations?: Organization[]
}

export default function GlobalUserManagement({ 
  initialUsers = [], 
  initialOrganizations = [] 
}: GlobalUserManagementProps) {
  const [users, setUsers] = useState<ExtendedUser[]>(initialUsers)
  const [organizations, setOrganizations] = useState<Organization[]>(initialOrganizations)
  const [loading, setLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<ExtendedUser | null>(null)
  const [showUserDetail, setShowUserDetail] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showBulkAction, setShowBulkAction] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState<'activate' | 'deactivate' | 'delete' | null>(null)
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  })
  const [filters, setFilters] = useState<Filters>({
    search: '',
    roleType: '',
    organizationId: '',
    isActive: '',
    createdAfter: '',
    createdBefore: ''
  })

  useEffect(() => {
    debugLogger.componentMount('GlobalUserManagementV2', {
      filters,
      pagination,
      initialUsers: initialUsers.length,
      initialOrganizations: initialOrganizations.length
    })
    
    if (initialUsers.length === 0) {
      fetchUsers()
    }
    if (initialOrganizations.length === 0) {
      fetchOrganizations()
    }
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      debugLogger.componentRender('GlobalUserManagementV2', 'Starting fetchUsers')

      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.roleType) params.append('role_type', filters.roleType)
      if (filters.organizationId) params.append('organization_id', filters.organizationId)
      if (filters.isActive) params.append('is_active', filters.isActive)
      if (filters.createdAfter) params.append('created_after', filters.createdAfter)
      if (filters.createdBefore) params.append('created_before', filters.createdBefore)
      params.append('limit', pagination.limit.toString())
      params.append('offset', ((pagination.page - 1) * pagination.limit).toString())

      const url = `/api/admin/users?${params}`
      debugLogger.apiRequest(url, 'GET', { action: 'fetching users' })

      const response = await authenticatedApiCall(url)
      
      debugLogger.apiResponse(url, 'GET', response.status, {
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      })

      if (!response.ok) {
        const errorText = await response.text()
        debugLogger.apiError(url, 'GET', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        })
        throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      debugLogger.componentRender('GlobalUserManagementV2', 'Users fetched successfully', {
        userCount: data.users?.length || 0,
        pagination: data.pagination
      })

      setUsers(data.users || [])
      setPagination(data.pagination || pagination)
    } catch (error) {
      debugLogger.error('Error in fetchUsers', {
        error,
        filters,
        pagination
      })
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchOrganizations = async () => {
    try {
      debugLogger.componentRender('GlobalUserManagementV2', 'Starting fetchOrganizations')
      
      const url = '/api/admin/organizations'
      debugLogger.apiRequest(url, 'GET', { action: 'fetching organizations' })

      const response = await authenticatedApiCall(url)
      
      debugLogger.apiResponse(url, 'GET', response.status, 'fetchOrganizations response', {
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      })

      if (response.ok) {
        const data = await response.json()
        debugLogger.componentRender('GlobalUserManagementV2', 'Organizations fetched successfully', {
          organizationCount: data.organizations?.length || 0
        })
        setOrganizations(data.organizations || [])
      } else {
        const errorText = await response.text()
        debugLogger.apiError(url, 'GET', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        })
      }
    } catch (error) {
      debugLogger.error('Error in fetchOrganizations', error)
      console.error('Error fetching organizations:', error)
    }
  }

  const handleUserClick = (user: ExtendedUser) => {
    setSelectedUser(user)
    setShowUserDetail(true)
  }

  const handleInviteUser = () => {
    setShowInviteModal(true)
  }

  const handleBulkAction = (action: 'activate' | 'deactivate' | 'delete') => {
    setBulkAction(action)
    setShowBulkAction(true)
  }

  const handleFilterChange = (newFilters: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  const handleItemsPerPageChange = (limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }))
  }

  // Define table columns
  const columns = [
    {
      key: 'user',
      label: 'User',
      sortable: true,
      render: (value: any, row: ExtendedUser) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 overflow-hidden rounded-full">
            <Image
              width={40}
              height={40}
              src={(row as any).avatar_url || '/placeholder.svg'}
              alt="user"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <span className="block font-medium text-gray-800 text-sm dark:text-white/90">
              {(row as any).full_name || 'N/A'}
            </span>
            <span className="block text-xs text-gray-500 dark:text-gray-400">
              {row.email}
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'roles',
      label: 'Roles',
      sortable: false,
      render: (value: any, row: ExtendedUser) => (
        <div className="flex flex-wrap gap-1">
          {row.roles?.slice(0, 2).map((role: any, index: number) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            >
              {role.role_type}
            </span>
          ))}
          {row.roles && row.roles.length > 2 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
              +{row.roles.length - 2}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'organizations',
      label: 'Organizations',
      sortable: false,
      render: (value: any, row: ExtendedUser) => (
        <div className="flex flex-wrap gap-1">
          {(row as any).organizations?.slice(0, 1).map((org: any, index: number) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            >
              {org.name}
            </span>
          ))}
          {(row as any).organizations && (row as any).organizations.length > 1 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
              +{(row as any).organizations.length - 1}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: any, row: ExtendedUser) => (
        <div className="flex items-center gap-2">
          {(row as any).is_active ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              <CheckCircle className="w-3 h-3 mr-1" />
              Active
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
              <AlertCircle className="w-3 h-3 mr-1" />
              Inactive
            </span>
          )}
        </div>
      )
    },
    {
      key: 'last_login',
      label: 'Last Login',
      sortable: true,
      render: (value: any, row: ExtendedUser) => (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Clock className="w-4 h-4" />
          {(row as any).last_login_at ? 
            new Date((row as any).last_login_at).toLocaleDateString() : 
            'Never'
          }
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (value: any, row: ExtendedUser) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleUserClick(row)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              // Handle delete
              console.log('Delete user:', row.id)
            }}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage system users and their permissions</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Building2 className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button
              variant="outline"
              onClick={() => handleBulkAction('activate')}
              disabled={selectedUsers.length === 0}
            >
              <Users className="h-4 w-4 mr-2" />
              Bulk Actions
            </Button>
            <Button
              onClick={handleInviteUser}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <Card>
            <CardHeader>
              <CardTitle>Advanced Filters</CardTitle>
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

        {/* Data Table */}
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
        {showUserDetail && selectedUser && (
          <UserDetailModal
            user={selectedUser}
            onClose={() => {
              setShowUserDetail(false)
              setSelectedUser(null)
            }}
            onUserUpdate={() => {
              setShowUserDetail(false)
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

        {showBulkAction && bulkAction && (
          <BulkActionModal
            action={bulkAction}
            selectedCount={selectedUsers.length}
            isOpen={showBulkAction}
            onClose={() => setShowBulkAction(false)}
            onConfirm={async (action) => {
              // Handle bulk action logic here
              console.log('Bulk action:', action, selectedUsers)
              setShowBulkAction(false)
              setSelectedUsers([])
              fetchUsers()
            }}
          />
        )}

        {/* Debug Panel */}
        <DebugPanel />
      </div>
    </PermissionGuard>
  )
}
