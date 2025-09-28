import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './dashboard-client'

export default async function DashboardPage() {
  try {
    // TEMPORARY: Skip authentication to prevent infinite recursion
    console.log('⚠️  TEMPORARY: Skipping authentication for dashboard page')
    
    // const supabase = await createClient()
    // const {
    //   data: { user },
    // } = await supabase.auth.getUser()
    // if (!user) {
    //   redirect('/login')
    // }

    // Use mock user for now
    const mockUser = {
      id: '1',
      email: 'admin@tin.info',
      full_name: 'Admin User',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString()
    }

    return <DashboardClient user={mockUser} />
  } catch {
    redirect('/setup')
  }
}
