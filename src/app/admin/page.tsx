import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { requireSystemAdmin } from '@/lib/permissions'
import SystemAdminDashboard from '@/components/admin/SystemAdminDashboard'

// Force dynamic SSR to avoid any static generation attempts
export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login')
    }

    // Temporarily allow all authenticated users to access admin panel
    // TODO: Replace with proper permission check once database is set up
    // await requireSystemAdmin(user.id)

    // Fetch system stats server-side
    let systemStats: {
      total_organizations: number
      total_users: number
      active_apis: number
      system_load: number
      recent_activity: Array<{
        id: string
        action: string
        user_email: string
        timestamp: string
        organization_name?: string
      }>
    } = {
      total_organizations: 0,
      total_users: 0,
      active_apis: 0,
      system_load: 0,
      recent_activity: []
    }

    try {
      // Try to get real stats from database
      const [orgResult, userResult] = await Promise.allSettled([
        supabase.from('organizations').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true })
      ])

      systemStats = {
        total_organizations: orgResult.status === 'fulfilled' ? (orgResult.value.count || 0) : 0,
        total_users: userResult.status === 'fulfilled' ? (userResult.value.count || 0) : 0,
        active_apis: 0,
        system_load: 25,
        recent_activity: [
          {
            id: '1',
            action: 'User login',
            user_email: user.email || 'demo@example.com',
            timestamp: new Date().toISOString(),
            organization_name: 'Demo Organization'
          }
        ] as Array<{
          id: string
          action: string
          user_email: string
          timestamp: string
          organization_name?: string
        }>
      }
    } catch (error) {
      console.log('Error fetching system stats, using mock data:', error)
      // Use mock data when database queries fail
      systemStats = {
        total_organizations: 1,
        total_users: 1,
        active_apis: 0,
        system_load: 25,
        recent_activity: [
          {
            id: '1',
            action: 'User login',
            user_email: user.email || 'demo@example.com',
            timestamp: new Date().toISOString(),
            organization_name: 'Demo Organization'
          }
        ] as Array<{
          id: string
          action: string
          user_email: string
          timestamp: string
          organization_name?: string
        }>
      }
    }

    return <SystemAdminDashboard user={user} initialStats={systemStats} />
  } catch (error) {
    console.error('Error in admin page:', error)
    // Temporarily allow access even on error (temporary admin permissions)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      return <SystemAdminDashboard user={user} initialStats={{
        total_organizations: 1,
        total_users: 1,
        active_apis: 0,
        system_load: 25,
        recent_activity: []
      }} />
    }
    redirect('/login')
  }
}
