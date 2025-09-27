import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { requireSystemAdmin } from '@/lib/permissions'
import SystemAdminDashboard from '@/components/admin/SystemAdminDashboard'

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

    return <SystemAdminDashboard user={user} />
  } catch (error) {
    console.error('Error in admin page:', error)
    // Temporarily allow access even on error (temporary admin permissions)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      return <SystemAdminDashboard user={user} />
    }
    redirect('/login')
  }
}
