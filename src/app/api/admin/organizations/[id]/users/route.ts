import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireSystemAdmin } from '@/lib/permissions'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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

    // Get organization users with their details
    const { data: users, error: usersError } = await supabase
      .from('user_roles')
      .select(`
        id,
        user_id,
        role_type,
        assigned_at,
        is_active,
        user:user_id (
          id,
          email,
          created_at,
          last_sign_in_at
        )
      `)
      .eq('organization_id', params.id)
      .eq('is_active', true)
      .order('assigned_at', { ascending: false })

    if (usersError) {
      console.error('Error fetching organization users:', usersError)
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      users: users || []
    })

  } catch (error: unknown) {
    console.error('Error in organization users API:', error)
    
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
