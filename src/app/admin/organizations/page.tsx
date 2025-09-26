import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { requireSystemAdmin } from '@/lib/permissions'
import OrganizationManagement from '@/components/admin/OrganizationManagement'

export default async function OrganizationsPage() {
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

    return <OrganizationManagement />
  } catch (error) {
    console.error('Error in organizations page:', error)
    redirect('/dashboard')
  }
}
