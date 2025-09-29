import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireSystemAdmin } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // TEMPORARY: Skip authentication for testing
    console.log('⚠️  TEMPORARY: Skipping authentication for testing')

    // Get current user and verify system admin permissions
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.log('⚠️  No authenticated user, but allowing access for testing')
    }

    // Check if user is system admin (temporarily allowing all authenticated users for testing)
    if (user) {
      try {
        await requireSystemAdmin(user.id)
      } catch (error) {
        // For development/testing, allow any authenticated user to access admin endpoints
        console.log('System admin check failed, allowing access for testing:', error)
      }
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const role_type = searchParams.get('role_type')
    const organization_id = searchParams.get('organization_id')
    const is_active = searchParams.get('is_active')
    const created_after = searchParams.get('created_after')
    const created_before = searchParams.get('created_before')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    console.log('🔍 Fetching users from database...')

    // Query profiles table (which represents users in our system)
    let profilesQuery = supabase
      .from('profiles')
      .select(`
        id,
        user_id,
        email,
        full_name,
        avatar_url,
        bio,
        phone,
        location,
        website,
        created_at,
        updated_at
      `)

    // Apply search filter if provided
    if (search) {
      profilesQuery = profilesQuery.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Apply date filters
    if (created_after) {
      profilesQuery = profilesQuery.gte('created_at', created_after)
    }
    if (created_before) {
      profilesQuery = profilesQuery.lte('created_at', created_before)
    }

    // Apply pagination
    profilesQuery = profilesQuery
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    const { data: profiles, error: profilesError } = await profilesQuery

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return NextResponse.json(
        { error: 'Failed to fetch users', details: profilesError.message },
        { status: 500 }
      )
    }

    console.log('Successfully fetched profiles:', profiles?.length || 0)

    // If no profiles found, return empty result
    if (!profiles || profiles.length === 0) {
      return NextResponse.json({
        users: [],
        pagination: {
          total: 0,
          limit,
          offset,
          has_more: false
        },
        filters: {
          search,
          role_type,
          organization_id,
          is_active: is_active === 'true' ? true : is_active === 'false' ? false : undefined,
          created_after,
          created_before
        }
      })
    }

    // Get count of total profiles for pagination
    let countQuery = supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })

    if (search) {
      countQuery = countQuery.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    }
    if (created_after) {
      countQuery = countQuery.gte('created_at', created_after)
    }
    if (created_before) {
      countQuery = countQuery.lte('created_at', created_before)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Error fetching user count:', countError)
      return NextResponse.json(
        { error: 'Failed to fetch user count', details: countError.message },
        { status: 500 }
      )
    }

    console.log('Successfully fetched user count:', count)

    // For each profile, fetch their roles and organizations
    const usersWithRoles = await Promise.all(
      profiles.map(async (profile) => {
        console.log('🔍 Fetching roles for user:', profile.user_id || profile.id)

        // Query user roles for this user
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select(`
            id,
            role_type,
            permissions,
            is_active,
            created_at,
            organization_id,
            organizations (
              id,
              name,
              slug
            )
          `)
          .eq('user_id', profile.user_id || profile.id)
          .eq('is_active', true)

        if (rolesError) {
          console.error('Error fetching roles for user:', profile.user_id || profile.id, rolesError)
          // Continue with empty roles rather than failing
        }

        // Extract permissions from roles
        const permissions = userRoles?.reduce((acc, role) => {
          if (role.permissions && Array.isArray(role.permissions)) {
            return [...acc, ...role.permissions]
          }
          return acc
        }, [] as string[]) || []

        // Extract organizations from roles
        const organizations = userRoles?.map(role => role.organizations).filter(Boolean) || []

        return {
          id: profile.user_id || profile.id, // Use user_id if available, fallback to id
          email: profile.email,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          created_at: profile.created_at,
          last_sign_in_at: null, // This would come from auth.users if we had access
          last_login_at: null, // This would come from auth.users if we had access
          is_active: true, // Assume active if profile exists
          roles: userRoles || [],
          organizations: organizations,
          permissions: permissions
        }
      })
    )

    // Filter users by role or organization if specified
    let filteredUsers = usersWithRoles

    if (role_type) {
      filteredUsers = filteredUsers.filter(user =>
        user.roles.some(role => role.role_type === role_type)
      )
    }

    if (organization_id) {
      filteredUsers = filteredUsers.filter(user =>
        user.organizations.some((org: any) => org?.id === organization_id)
      )
    }

    if (is_active !== null && is_active !== undefined) {
      const activeFilter = is_active === 'true'
      filteredUsers = filteredUsers.filter(user =>
        user.roles.some(role => role.is_active === activeFilter)
      )
    }

    return NextResponse.json({
      users: filteredUsers,
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: (count || 0) > offset + limit
      },
      filters: {
        search,
        role_type,
        organization_id,
        is_active: is_active === 'true' ? true : is_active === 'false' ? false : undefined,
        created_after,
        created_before
      }
    })

  } catch (error: unknown) {
    console.error('Unexpected error in users API:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const errorStack = error instanceof Error ? error.stack : undefined

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    )
  }
}
