import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { requireSystemAdmin } from '@/lib/permissions'
import OrganizationDetail from '@/components/admin/OrganizationDetail'

interface OrganizationDetailPageProps {
  params: {
    id: string
  }
}

export default async function OrganizationDetailPage({ params }: OrganizationDetailPageProps) {
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

    return <OrganizationDetail organizationId={params.id} />
  } catch (error) {
    console.error('Error in organization detail page:', error)
    redirect('/admin/organizations')
  }
}
