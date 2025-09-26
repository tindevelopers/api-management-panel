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

    // Check if user is system admin
    await requireSystemAdmin(user.id)

    return <SystemAdminDashboard user={user} />
  } catch (error) {
    console.error('Error in admin page:', error)
    redirect('/dashboard')
  }
}
