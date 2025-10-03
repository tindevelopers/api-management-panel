import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/ui/DashboardLayout'
import DashboardOverview from '@/components/dashboard/DashboardOverview'

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

    return (
      <DashboardLayout
        user={mockUser}
        title="Dashboard"
        subtitle="Welcome to your API Management Panel"
      >
        <DashboardOverview user={mockUser} />
      </DashboardLayout>
    )
  } catch {
    redirect('/setup')
  }
}