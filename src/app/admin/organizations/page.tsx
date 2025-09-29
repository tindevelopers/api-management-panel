import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
        <p className="text-gray-600 mt-1">Manage all organizations in the system</p>
      </div>

      {!organizations || organizations.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-gray-400 text-4xl mb-4">🏢</div>
          <h3 className="text-gray-900 font-medium mb-2">No Organizations Found</h3>
          <p className="text-gray-600 text-sm">
            There are no organizations in the system yet.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Limits
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {organizations.map((org: Organization) => (
                <tr key={org.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {org.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {org.slug}
                      </div>
                      {org.description && (
                        <div className="text-xs text-gray-400 mt-1">
                          {org.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>Users: {org.max_users}</div>
                    <div>APIs: {org.max_apis}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(org.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <a
                      href={`/admin/organizations/${org.id}`}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      View
                    </a>
                    <button 
                      type="button"
                      className="text-gray-400 hover:text-gray-600"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
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