import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  Organization, 
  OrganizationInsert, 
  OrganizationUpdate,
  OrganizationWithMembers,
  OrganizationMember,
  OrganizationMemberInsert,
  OrganizationMemberUpdate,
  OrganizationMemberWithUser,
  CreateOrganizationForm,
  UpdateOrganizationForm,
  InviteMemberForm
} from '@/types/organization'
import { Database } from '@/types/database'

const supabase = createClientComponentClient<Database>()

// Organization CRUD hooks
export function useOrganizations() {
  const [organizations, setOrganizations] = useState<OrganizationWithMembers[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrganizations = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select(`
          *,
          organization_members!inner(
            id,
            user_id,
            role,
            status,
            users(id, email, role)
          )
        `)
        .eq('organization_members.status', 'active')

      if (orgsError) throw orgsError

      // Transform data to include member count
      const organizationsWithMembers: OrganizationWithMembers[] = orgsData?.map(org => ({
        ...org,
        members: org.organization_members?.map((member: any) => ({
          ...member,
          user: Array.isArray(member.users) ? member.users[0] : member.users
        })) || [],
        member_count: org.organization_members?.length || 0
      })) || []

      setOrganizations(organizationsWithMembers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrganizations()
  }, [])

  return { organizations, loading, error, refetch: fetchOrganizations }
}

export function useOrganization(id: string) {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrganization = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError
      setOrganization(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchOrganization()
    }
  }, [id])

  return { organization, loading, error, refetch: fetchOrganization }
}

// Organization mutations
export function useCreateOrganization() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createOrganization = async (formData: CreateOrganizationForm, userId: string) => {
    try {
      setLoading(true)
      setError(null)

      const organizationData: OrganizationInsert = {
        name: formData.name,
        description: formData.description || null,
        website: formData.website || null,
        owner_id: userId,
        status: 'active',
        settings: formData.settings ? {
          allow_member_invites: formData.settings.allow_member_invites,
          require_approval: formData.settings.require_approval,
          max_members: formData.settings.max_members || null
        } : {
          allow_member_invites: true,
          require_approval: false,
          max_members: null
        }
      }

      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert(organizationData)
        .select()
        .single()

      if (orgError) throw orgError

      // Add the creator as owner
      const memberData: OrganizationMemberInsert = {
        organization_id: orgData.id,
        user_id: userId,
        role: 'owner',
        status: 'active',
        joined_at: new Date().toISOString()
      }

      const { error: memberError } = await supabase
        .from('organization_members')
        .insert(memberData)

      if (memberError) throw memberError

      return orgData
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return { createOrganization, loading, error }
}

export function useUpdateOrganization() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateOrganization = async (id: string, formData: UpdateOrganizationForm) => {
    try {
      setLoading(true)
      setError(null)

      const updateData: OrganizationUpdate = {
        ...formData,
        settings: formData.settings ? {
          allow_member_invites: formData.settings.allow_member_invites ?? true,
          require_approval: formData.settings.require_approval ?? false,
          max_members: formData.settings.max_members ?? null
        } : undefined,
        updated_at: new Date().toISOString()
      }

      const { data, error: updateError } = await supabase
        .from('organizations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return { updateOrganization, loading, error }
}

export function useDeleteOrganization() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteOrganization = async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      // Delete organization members first
      const { error: membersError } = await supabase
        .from('organization_members')
        .delete()
        .eq('organization_id', id)

      if (membersError) throw membersError

      // Delete organization
      const { error: orgError } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id)

      if (orgError) throw orgError
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return { deleteOrganization, loading, error }
}

// Organization members hooks
export function useOrganizationMembers(organizationId: string) {
  const [members, setMembers] = useState<OrganizationMemberWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMembers = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('organization_members')
        .select(`
          *,
          users(id, email, role)
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      const membersWithUsers: OrganizationMemberWithUser[] = data?.map(member => ({
        ...member,
        user: Array.isArray(member.users) ? member.users[0] : member.users
      })) || []

      setMembers(membersWithUsers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (organizationId) {
      fetchMembers()
    }
  }, [organizationId])

  return { members, loading, error, refetch: fetchMembers }
}

export function useInviteMember() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inviteMember = async (
    organizationId: string, 
    inviteData: InviteMemberForm, 
    invitedBy: string
  ) => {
    try {
      setLoading(true)
      setError(null)

      // Check if user exists
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', inviteData.email)
        .single()

      if (userError && userError.code !== 'PGRST116') {
        throw userError
      }

      if (!userData) {
        throw new Error('User with this email does not exist')
      }

      // Check if user is already a member
      const { data: existingMember, error: memberCheckError } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('user_id', userData.id)
        .single()

      if (memberCheckError && memberCheckError.code !== 'PGRST116') {
        throw memberCheckError
      }

      if (existingMember) {
        throw new Error('User is already a member of this organization')
      }

      // Create member invitation
      const memberData: OrganizationMemberInsert = {
        organization_id: organizationId,
        user_id: userData.id,
        role: inviteData.role,
        status: 'pending',
        invited_by: invitedBy,
        invited_at: new Date().toISOString()
      }

      const { data, error: insertError } = await supabase
        .from('organization_members')
        .insert(memberData)
        .select()
        .single()

      if (insertError) throw insertError
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return { inviteMember, loading, error }
}

export function useUpdateMemberRole() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateMemberRole = async (memberId: string, role: string) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: updateError } = await supabase
        .from('organization_members')
        .update({ 
          role: role as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId)
        .select()
        .single()

      if (updateError) throw updateError
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return { updateMemberRole, loading, error }
}

export function useRemoveMember() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const removeMember = async (memberId: string) => {
    try {
      setLoading(true)
      setError(null)

      const { error: deleteError } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId)

      if (deleteError) throw deleteError
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return { removeMember, loading, error }
}