import { Database } from './database'

export type Organization = Database['public']['Tables']['organizations']['Row']
export type OrganizationInsert = Database['public']['Tables']['organizations']['Insert']
export type OrganizationUpdate = Database['public']['Tables']['organizations']['Update']

export type OrganizationMember = Database['public']['Tables']['organization_members']['Row']
export type OrganizationMemberInsert = Database['public']['Tables']['organization_members']['Insert']
export type OrganizationMemberUpdate = Database['public']['Tables']['organization_members']['Update']

export type OrganizationRole = Database['public']['Enums']['organization_member_role']
export type OrganizationStatus = Database['public']['Enums']['organization_status']
export type OrganizationMemberStatus = Database['public']['Enums']['organization_member_status']

// Extended types with joined data
export interface OrganizationWithMembers extends Organization {
  members: OrganizationMemberWithUser[]
  member_count: number
}

export interface OrganizationMemberWithUser extends OrganizationMember {
  user: {
    id: string
    email: string
    role: string
  }
}

export interface OrganizationInvite {
  id: string
  organization_id: string
  email: string
  role: OrganizationRole
  invited_by: string
  expires_at: string
  created_at: string
}

// Form types
export interface CreateOrganizationForm {
  name: string
  description?: string
  website?: string
  settings?: {
    allow_member_invites: boolean
    require_approval: boolean
    max_members?: number
  }
}

export interface UpdateOrganizationForm {
  name?: string
  description?: string
  website?: string
  logo_url?: string
  settings?: {
    allow_member_invites?: boolean
    require_approval?: boolean
    max_members?: number
  }
}

export interface InviteMemberForm {
  email: string
  role: OrganizationRole
}

// API Response types
export interface OrganizationApiResponse {
  data: Organization | null
  error: string | null
}

export interface OrganizationsApiResponse {
  data: Organization[] | null
  error: string | null
}

export interface OrganizationMembersApiResponse {
  data: OrganizationMemberWithUser[] | null
  error: string | null
}