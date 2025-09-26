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

    // Fetch organization details
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', params.id)
      .single()

    if (orgError || !organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Get organization stats
    const { count: userCount } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', params.id)
      .eq('is_active', true)

    // Get organization users with their details
    const { data: users } = await supabase
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

    // Mock data for now
    const activeApis = Math.floor(Math.random() * 20) + 1
    const storageUsed = Math.floor(Math.random() * 1000000000)
    const lastActivity = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()

    const organizationWithDetails = {
      ...organization,
      stats: {
        total_users: userCount || 0,
        active_apis: activeApis,
        storage_used: storageUsed,
        last_activity: lastActivity
      },
      users: users || []
    }

    return NextResponse.json({
      organization: organizationWithDetails
    })

  } catch (error: unknown) {
    console.error('Error in organization detail API:', error)
    
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

export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    const updateData = await request.json()

    // Update organization
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (orgError) {
      console.error('Error updating organization:', orgError)
      return NextResponse.json(
        { error: 'Failed to update organization' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      organization,
      message: 'Organization updated successfully'
    })

  } catch (error: unknown) {
    console.error('Error updating organization:', error)
    
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

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Soft delete organization
    const { error: orgError } = await supabase
      .from('organizations')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)

    if (orgError) {
      console.error('Error deleting organization:', orgError)
      return NextResponse.json(
        { error: 'Failed to delete organization' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Organization deleted successfully'
    })

  } catch (error: unknown) {
    console.error('Error deleting organization:', error)
    
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
