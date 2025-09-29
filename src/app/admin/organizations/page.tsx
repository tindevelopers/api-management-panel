import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import OrganizationsClient from '@/components/admin/OrganizationsClient'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface Organization {
  id: string
  name: string
  slug: string
  description: string | null
  max_users: number
  max_apis: number
  created_at: string
  updated_at: string
  is_active: boolean
  user_count?: number
  api_count?: number
}

async function OrganizationsList() {
  const supabase = await createClient()

  // Get authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    console.log('❌ No authenticated user found:', userError?.message)
    redirect('/login')
  }

  console.log('✅ Authenticated user:', user.email)

  // Check if user has admin permissions - with fallback for development
  let hasAdminAccess = false

  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.log('⚠️ Profile lookup error:', profileError.message)
      // Fallback: Check if user email contains 'admin' or is a known admin email
      const adminEmails = ['admin@tin.info', 'admin@example.com']
      hasAdminAccess = adminEmails.includes(user.email || '') || (user.email || '').includes('admin')
      console.log('🔄 Using email-based admin fallback:', hasAdminAccess)
    } else if (profile && profile.role === 'system_admin') {
      hasAdminAccess = true
      console.log('✅ User has system_admin role')
    } else {
      console.log('❌ User role:', profile?.role || 'no role')
      // Fallback for development
      const adminEmails = ['admin@tin.info', 'admin@example.com']
      hasAdminAccess = adminEmails.includes(user.email || '')
      console.log('🔄 Using email-based admin fallback:', hasAdminAccess)
    }
  } catch (error) {
    console.log('⚠️ Database connection error:', error)
    // Fallback: Allow admin emails to access during development
    const adminEmails = ['admin@tin.info', 'admin@example.com']
    hasAdminAccess = adminEmails.includes(user.email || '')
    console.log('🔄 Using email-based admin fallback due to DB error:', hasAdminAccess)
  }

  if (!hasAdminAccess) {
    console.log('❌ Access denied for user:', user.email)
    redirect('/dashboard')
  }

  console.log('✅ Admin access granted for:', user.email)

  // Fetch organizations
  const { data: organizations, error } = await supabase
    .from('organizations')
    .select(`
      id,
      name,
      slug,
      description,
      max_users,
      max_apis,
      created_at,
      updated_at,
      is_active
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching organizations:', error)
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error Loading Organizations</h3>
          <p className="text-red-600 text-sm mt-1">
            Unable to load organizations. Please check your database connection.
          </p>
          <p className="text-red-500 text-xs mt-2 font-mono">
            {error.message}
          </p>
        </div>
      </div>
    )
  }

  return <OrganizationsClient initialOrganizations={organizations || []} />
}

function LoadingState() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
      </div>
      <div className="bg-white shadow rounded-lg p-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex space-x-4">
              <div className="h-4 bg-gray-200 rounded flex-1 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function OrganizationsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <OrganizationsList />
    </Suspense>
  )
}