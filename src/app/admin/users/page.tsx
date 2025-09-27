import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { requireSystemAdmin } from '@/lib/permissions'
import GlobalUserManagementV2 from '@/components/admin/GlobalUserManagementV2'

// Force dynamic SSR to avoid any static generation attempts
export const dynamic = 'force-dynamic'

export default async function UsersPage() {
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

    return <GlobalUserManagementV2 initialUsers={[]} initialOrganizations={[]} />
  } catch (error) {
    console.error('Error in users page:', error)
    // Temporarily allow access even on error (temporary admin permissions)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      return <GlobalUserManagementV2 initialUsers={[]} initialOrganizations={[]} />
    }
    redirect('/login')
  }
}
