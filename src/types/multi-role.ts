// =====================================================
// Multi-Role Administration Panel Type Definitions
// =====================================================

import { User } from '@supabase/supabase-js'

// =====================================================
// ENUMS
// =====================================================

export enum RoleType {
  SYSTEM_ADMIN = 'system_admin',
  ORG_ADMIN = 'org_admin',
  USER = 'user'
}

export enum SubscriptionPlan {
  FREE = 'free',
  BASIC = 'basic',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise'
}

export enum Permission {
  // System Admin Permissions
  SYSTEM_ADMIN = 'system:admin',
  MANAGE_ORGANIZATIONS = 'system:organizations:manage',
  MANAGE_SYSTEM_USERS = 'system:users:manage',
  MANAGE_SYSTEM_APIS = 'system:apis:manage',
  VIEW_SYSTEM_ANALYTICS = 'system:analytics:view',
  
  // Organization Admin Permissions
  ORG_ADMIN = 'org:admin',
  MANAGE_ORG_USERS = 'org:users:manage',
  MANAGE_ORG_APIS = 'org:apis:manage',
  VIEW_ORG_ANALYTICS = 'org:analytics:view',
  MANAGE_ORG_SETTINGS = 'org:settings:manage',
  MANAGE_ORG_INVITATIONS = 'org:invitations:manage',
  
  // User Permissions
  USER_BASIC = 'user:basic',
  ACCESS_APIS = 'user:apis:access',
  VIEW_PERSONAL_DASHBOARD = 'user:dashboard:view'
}

export enum ApiMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH'
}

export enum RateLimitPeriod {
  MINUTE = 'minute',
  HOUR = 'hour',
  DAY = 'day'
}

// =====================================================
// INTERFACES
// =====================================================

export interface Organization {
  id: string
  name: string
  slug: string
  description?: string
  settings: Record<string, unknown>
  subscription_plan: SubscriptionPlan
  max_users: number
  max_apis: number
  created_at: string
  updated_at: string
  created_by?: string
  is_active: boolean
}

export interface UserRole {
  id: string
  user_id: string
  organization_id: string
  role_type: RoleType
  permissions: string[]
  assigned_by?: string
  assigned_at: string
  expires_at?: string
  is_active: boolean
  // Joined data
  organization?: Organization
  user?: User
  assigned_by_user?: User
}

export interface PermissionDefinition {
  id: string
  name: string
  description?: string
  category: string
  resource: string
  action: string
  created_at: string
}

export interface ApiAccessControl {
  id: string
  user_id: string
  organization_id: string
  api_name: string
  api_endpoint: string
  allowed_methods: ApiMethod[]
  rate_limit: number
  rate_limit_period: RateLimitPeriod
  expires_at?: string
  created_at: string
  updated_at: string
}

export interface UserInvitation {
  id: string
  email: string
  organization_id: string
  role_type: RoleType
  invited_by?: string
  invitation_token: string
  expires_at: string
  accepted_at?: string
  created_at: string
  // Joined data
  organization?: Organization
  invited_by_user?: User
}

export interface AuditLog {
  id: string
  user_id?: string
  organization_id?: string
  action: string
  resource_type: string
  resource_id?: string
  old_values?: Record<string, unknown>
  new_values?: Record<string, unknown>
  ip_address?: string
  user_agent?: string
  created_at: string
  // Joined data
  user?: User
  organization?: Organization
}

export interface OrganizationSettings {
  id: string
  organization_id: string
  setting_key: string
  setting_value: Record<string, unknown>
  created_at: string
  updated_at: string
}

// =====================================================
// EXTENDED USER INTERFACE
// =====================================================

export interface ExtendedUser extends User {
  roles: UserRole[]
  current_organization?: Organization
  permissions: string[]
}

// =====================================================
// REQUEST/RESPONSE TYPES
// =====================================================

export interface CreateOrganizationRequest {
  name: string
  slug: string
  description?: string
  subscription_plan?: SubscriptionPlan
  max_users?: number
  max_apis?: number
}

export interface UpdateOrganizationRequest {
  name?: string
  slug?: string
  description?: string
  subscription_plan?: SubscriptionPlan
  max_users?: number
  max_apis?: number
  settings?: Record<string, unknown>
}

export interface AssignRoleRequest {
  user_id: string
  organization_id: string
  role_type: RoleType
  permissions?: string[]
  expires_at?: string
}

export interface UpdateRoleRequest {
  role_type?: RoleType
  permissions?: string[]
  expires_at?: string
  is_active?: boolean
}

export interface CreateInvitationRequest {
  email: string
  organization_id: string
  role_type: RoleType
}

export interface ApiAccessRequest {
  user_id: string
  organization_id: string
  api_name: string
  api_endpoint: string
  allowed_methods: ApiMethod[]
  rate_limit?: number
  rate_limit_period?: RateLimitPeriod
  expires_at?: string
}

// =====================================================
// DASHBOARD DATA TYPES
// =====================================================

export interface SystemStats {
  total_organizations: number
  total_users: number
  active_apis: number
  system_load: number
  recent_activity: AuditLog[]
}

export interface OrganizationStats {
  total_users: number
  active_apis: number
  api_calls_today: number
  storage_used: number
  recent_activity: AuditLog[]
}

export interface UserStats {
  total_roles: number
  active_organizations: number
  api_access_count: number
  last_login: string
}

// =====================================================
// FILTER AND SEARCH TYPES
// =====================================================

export interface OrganizationFilters {
  search?: string
  subscription_plan?: SubscriptionPlan
  is_active?: boolean
  created_after?: string
  created_before?: string
}

export interface UserFilters {
  search?: string
  role_type?: RoleType
  organization_id?: string
  is_active?: boolean
  created_after?: string
  created_before?: string
}

export interface AuditLogFilters {
  user_id?: string
  organization_id?: string
  action?: string
  resource_type?: string
  created_after?: string
  created_before?: string
}

// =====================================================
// FORM TYPES
// =====================================================

export interface OrganizationFormData {
  name: string
  slug: string
  description: string
  subscription_plan: SubscriptionPlan
  max_users: number
  max_apis: number
}

export interface UserRoleFormData {
  user_id: string
  organization_id: string
  role_type: RoleType
  permissions: string[]
  expires_at?: string
}

export interface InvitationFormData {
  email: string
  organization_id: string
  role_type: RoleType
}

// =====================================================
// PERMISSION CHECKING TYPES
// =====================================================

export interface PermissionCheck {
  permission: Permission
  organization_id?: string
  resource_id?: string
}

export interface RoleHierarchy {
  [RoleType.SYSTEM_ADMIN]: Permission[]
  [RoleType.ORG_ADMIN]: Permission[]
  [RoleType.USER]: Permission[]
}

// =====================================================
// API RESPONSE TYPES
// =====================================================

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// =====================================================
// CONSTANTS
// =====================================================

export const ROLE_HIERARCHY: RoleHierarchy = {
  [RoleType.SYSTEM_ADMIN]: [
    Permission.SYSTEM_ADMIN,
    Permission.MANAGE_ORGANIZATIONS,
    Permission.MANAGE_SYSTEM_USERS,
    Permission.MANAGE_SYSTEM_APIS,
    Permission.VIEW_SYSTEM_ANALYTICS,
    Permission.ORG_ADMIN,
    Permission.MANAGE_ORG_USERS,
    Permission.MANAGE_ORG_APIS,
    Permission.VIEW_ORG_ANALYTICS,
    Permission.MANAGE_ORG_SETTINGS,
    Permission.MANAGE_ORG_INVITATIONS,
    Permission.USER_BASIC,
    Permission.ACCESS_APIS,
    Permission.VIEW_PERSONAL_DASHBOARD
  ],
  [RoleType.ORG_ADMIN]: [
    Permission.ORG_ADMIN,
    Permission.MANAGE_ORG_USERS,
    Permission.MANAGE_ORG_APIS,
    Permission.VIEW_ORG_ANALYTICS,
    Permission.MANAGE_ORG_SETTINGS,
    Permission.MANAGE_ORG_INVITATIONS,
    Permission.USER_BASIC,
    Permission.ACCESS_APIS,
    Permission.VIEW_PERSONAL_DASHBOARD
  ],
  [RoleType.USER]: [
    Permission.USER_BASIC,
    Permission.ACCESS_APIS,
    Permission.VIEW_PERSONAL_DASHBOARD
  ]
}

export const SUBSCRIPTION_LIMITS = {
  [SubscriptionPlan.FREE]: {
    max_users: 5,
    max_apis: 2,
    max_storage: '100MB',
    features: ['basic_analytics', 'email_support']
  },
  [SubscriptionPlan.BASIC]: {
    max_users: 25,
    max_apis: 10,
    max_storage: '1GB',
    features: ['advanced_analytics', 'priority_support', 'custom_apis']
  },
  [SubscriptionPlan.PREMIUM]: {
    max_users: 100,
    max_apis: 50,
    max_storage: '10GB',
    features: ['advanced_analytics', 'priority_support', 'custom_apis', 'audit_logs', 'api_versioning']
  },
  [SubscriptionPlan.ENTERPRISE]: {
    max_users: -1, // unlimited
    max_apis: -1, // unlimited
    max_storage: 'unlimited',
    features: ['all_features', 'dedicated_support', 'custom_integrations', 'sso', 'advanced_security']
  }
}

export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

// =====================================================
// UTILITY TYPES
// =====================================================

export type OrganizationId = string
export type UserId = string
export type RoleId = string
export type PermissionId = string

export type CreateOrganizationInput = Omit<Organization, 'id' | 'created_at' | 'updated_at'>
export type UpdateOrganizationInput = Partial<CreateOrganizationInput>

export type CreateUserRoleInput = Omit<UserRole, 'id' | 'assigned_at'>
export type UpdateUserRoleInput = Partial<CreateUserRoleInput>

export type CreateInvitationInput = Omit<UserInvitation, 'id' | 'invitation_token' | 'created_at' | 'accepted_at'>
export type CreateApiAccessInput = Omit<ApiAccessControl, 'id' | 'created_at' | 'updated_at'>

// =====================================================
// ERROR TYPES
// =====================================================

export class PermissionError extends Error {
  constructor(permission: Permission, organizationId?: string) {
    super(`Insufficient permissions: ${permission}${organizationId ? ` for organization ${organizationId}` : ''}`)
    this.name = 'PermissionError'
  }
}

export class RoleError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RoleError'
  }
}

export class OrganizationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OrganizationError'
  }
}
