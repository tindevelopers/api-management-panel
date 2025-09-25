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

    // Fetch all organizations with their stats
    const { data: organizations, error: orgsError } = await supabase
      .from('organizations')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (orgsError) {
      console.error('Error fetching organizations:', orgsError)
      return NextResponse.json(
        { error: 'Failed to fetch organizations' },
        { status: 500 }
      )
    }

    // For each organization, fetch their stats
    const organizationsWithStats = await Promise.all(
      organizations.map(async (org) => {
        // Get user count
        const { count: userCount } = await supabase
          .from('user_roles')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id)
          .eq('is_active', true)

        // Get API count (mock data for now)
        const activeApis = Math.floor(Math.random() * 20) + 1

        // Get storage used (mock data for now)
        const storageUsed = Math.floor(Math.random() * 1000000000) // Random bytes

        // Get last activity (mock data for now)
        const lastActivity = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()

        return {
          ...org,
          stats: {
            total_users: userCount || 0,
            active_apis: activeApis,
            storage_used: storageUsed,
            last_activity: lastActivity
          }
        }
      })
    )

    return NextResponse.json({
      organizations: organizationsWithStats,
      total: organizationsWithStats.length
    })

  } catch (error: any) {
    console.error('Error in admin organizations API:', error)
    
    if (error?.name === 'PermissionError') {
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

    const { name, slug, description, subscription_plan, max_users, max_apis } = await request.json()

    // Create organization
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name,
        slug,
        description,
        subscription_plan: subscription_plan || 'free',
        max_users: max_users || 5,
        max_apis: max_apis || 2,
        created_by: user.id
      })
      .select()
      .single()

    if (orgError) {
      console.error('Error creating organization:', orgError)
      return NextResponse.json(
        { error: 'Failed to create organization' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      organization,
      message: 'Organization created successfully'
    })

  } catch (error) {
    console.error('Error creating organization:', error)
    
    if (error.name === 'PermissionError') {
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
