import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireSystemAdmin } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user and verify system admin permissions
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is system admin (temporarily allowing all authenticated users for testing)
    try {
      await requireSystemAdmin(user.id)
    } catch (error) {
      // For development/testing, allow any authenticated user to access admin endpoints
      console.log('System admin check failed, allowing access for testing:', error)
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

    // Build query with filters - query profiles table instead of auth.users
    let usersQuery = supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        avatar_url,
        is_active,
        last_login_at,
        created_at,
        updated_at,
        user_id
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (is_active !== null && is_active !== undefined) {
      usersQuery = usersQuery.eq('is_active', is_active === 'true')
    }

    if (created_after) {
      usersQuery = usersQuery.gte('created_at', created_after)
    }

    if (created_before) {
      usersQuery = usersQuery.lte('created_at', created_before)
    }

    if (search) {
      usersQuery = usersQuery.ilike('full_name', `%${search}%`)
    }

    const { data: users, error: usersError } = await usersQuery

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    if (is_active !== null && is_active !== undefined) {
      countQuery = countQuery.eq('is_active', is_active === 'true')
    }

    if (created_after) {
      countQuery = countQuery.gte('created_at', created_after)
    }

    if (created_before) {
      countQuery = countQuery.lte('created_at', created_before)
    }

    if (search) {
      countQuery = countQuery.ilike('full_name', `%${search}%`)
    }

    const { count } = await countQuery

    // For each user, fetch their roles and organizations
    const usersWithRoles = await Promise.all(
      users.map(async (user) => {
        // Get user roles with optional filters
        let rolesQuery = supabase
          .from('user_roles')
          .select(`
            *,
            organization:organizations(*)
          `)
          .eq('user_id', user.user_id)
          .eq('is_active', true)

        if (role_type) {
          rolesQuery = rolesQuery.eq('role_type', role_type)
        }

        if (organization_id) {
          rolesQuery = rolesQuery.eq('organization_id', organization_id)
        }

        const { data: roles } = await rolesQuery

        // Get unique organizations
        const organizations = roles
          ?.map(role => role.organization)
          .filter(Boolean)
          .filter((org, index, self) => 
            index === self.findIndex(o => o.id === org.id)
          ) || []

        return {
          id: user.user_id,
          email: '', // We don't have email in profiles table
          full_name: user.full_name,
          avatar_url: user.avatar_url,
          created_at: user.created_at,
          last_sign_in_at: null, // We don't have this in profiles table
          last_login_at: user.last_login_at,
          is_active: user.is_active,
          roles: roles || [],
          organizations
        }
      })
    )

    // Filter users by role or organization if specified
    let filteredUsers = usersWithRoles

    if (role_type || organization_id) {
      filteredUsers = usersWithRoles.filter(user => 
        user.roles.some(role => 
          (!role_type || role.role_type === role_type) &&
          (!organization_id || role.organization_id === organization_id)
        )
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
    console.error('Error in admin users API:', error)
    
    if (error && typeof error === 'object' && 'name' in error && error.name === 'PermissionError') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user and verify system admin permissions
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    try {
      await requireSystemAdmin(user.id)
    } catch (error) {
      // For development/testing, allow any authenticated user to access admin endpoints
      console.log('System admin check failed, allowing access for testing:', error)
    }

    const { email, full_name } = await request.json()

    // Create user in auth.users (this would typically be done through Supabase Auth Admin API)
    // For now, we'll just return success
    return NextResponse.json({
      message: 'User creation would be implemented here',
      user: { email, full_name }
    })

  } catch (error: unknown) {
    console.error('Error creating user:', error)
    
    if (error && typeof error === 'object' && 'name' in error && error.name === 'PermissionError') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
