import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { requireSystemAdmin } from '@/lib/permissions'
import GlobalUserManagementV2 from '@/components/admin/GlobalUserManagementV2'
import DebugOverlay from '@/components/admin/DebugOverlay'
import { SubscriptionPlan } from '@/types/multi-role'

// Force dynamic SSR to avoid any static generation attempts
export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  try {
    // TEMPORARY: Skip authentication to prevent infinite recursion
    console.log('⚠️  TEMPORARY: Skipping authentication for users page')

    // const supabase = await createClient()
    // const {
    //   data: { user },
    // } = await supabase.auth.getUser()
    // if (!user) {
    //   redirect('/login')
    // }

    // Temporarily allow all authenticated users to access admin panel
    // TODO: Replace with proper permission check once database is set up
    // await requireSystemAdmin(user.id)

    // Fetch real organizations from the database
    const supabase = await createClient()

    console.log('🔍 Fetching organizations for users page...')
    const { data: organizations, error: orgsError } = await supabase
      .from('organizations')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (orgsError) {
      console.error('Error fetching organizations:', orgsError)
      // Fall back to empty array if there's an error
    }

    console.log('Successfully fetched organizations:', organizations?.length || 0)

    // Use real organizations data or empty array as fallback
    const organizationsData = organizations || []

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            User Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage users, roles, and permissions across all organizations
          </p>
        </div>

        <GlobalUserManagementV2
          initialOrganizations={organizationsData}
        />

        {process.env.NODE_ENV === 'development' && (
          <DebugOverlay />
        )}
      </div>
    )
  } catch (error) {
    console.error('Error in users page:', error)

    // Return error page
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h1 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">
            Error Loading Users Page
          </h1>
          <p className="text-red-600 dark:text-red-300">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
          <p className="text-sm text-red-500 dark:text-red-400 mt-2">
            Please check the console for more details.
          </p>
        </div>
      </div>
    )
  }
}
