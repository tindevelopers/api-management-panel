import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireSystemAdmin } from '@/lib/permissions'

export async function GET() {
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

    // Check if user is system admin
    await requireSystemAdmin(user.id)

    // Fetch all users with their roles and organizations
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select(`
        id,
        email,
        created_at,
        last_sign_in_at,
        raw_user_meta_data,
        profiles:profiles!inner(
          id,
          full_name,
          avatar_url
        )
      `)

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    // For each user, fetch their roles and organizations
    const usersWithRoles = await Promise.all(
      users.map(async (user) => {
        // Get user roles
        const { data: roles } = await supabase
          .from('user_roles')
          .select(`
            *,
            organization:organizations(*)
          `)
          .eq('user_id', user.id)
          .eq('is_active', true)

        // Get unique organizations
        const organizations = roles
          ?.map(role => role.organization)
          .filter(Boolean)
          .filter((org, index, self) => 
            index === self.findIndex(o => o.id === org.id)
          ) || []

        return {
          id: user.id,
          email: user.email,
          full_name: user.profiles?.[0]?.full_name,
          avatar_url: user.profiles?.[0]?.avatar_url,
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
          roles: roles || [],
          organizations
        }
      })
    )

    return NextResponse.json({
      users: usersWithRoles,
      total: usersWithRoles.length
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

    await requireSystemAdmin(user.id)

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
