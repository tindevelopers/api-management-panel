import { NextResponse } from 'next/server'
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

    // Get total organizations
    const { count: totalOrganizations } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Get total users across all organizations
    const { count: totalUsers } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Get active APIs (mock data for now)
    const activeApis = Math.floor(Math.random() * 50) + 10

    // Get system load (mock data for now)
    const systemLoad = Math.floor(Math.random() * 100)

    // Get recent activity (mock data for now since audit_logs table might not exist)
    const formattedActivity = [
      {
        id: '1',
        action: 'Organization created',
        user_email: 'admin@example.com',
        timestamp: new Date().toISOString(),
        organization_name: 'Example Org'
      },
      {
        id: '2',
        action: 'User added',
        user_email: 'user@example.com',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        organization_name: 'Example Org'
      }
    ]

    return NextResponse.json({
      total_organizations: totalOrganizations || 0,
      total_users: totalUsers || 0,
      active_apis: activeApis,
      system_load: systemLoad,
      recent_activity: formattedActivity
    })

  } catch (error: unknown) {
    console.error('Error in admin stats API:', error)
    
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
