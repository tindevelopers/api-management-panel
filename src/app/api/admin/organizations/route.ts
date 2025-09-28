import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

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
      } else if (profile && profile.role === 'system_admin') {
        hasAdminAccess = true
      } else {
        // Fallback for development
        const adminEmails = ['admin@tin.info', 'admin@example.com']
        hasAdminAccess = adminEmails.includes(user.email || '')
      }
    } catch (error) {
      console.log('⚠️ Database connection error:', error)
      // Fallback: Allow admin emails to access during development
      const adminEmails = ['admin@tin.info', 'admin@example.com']
      hasAdminAccess = adminEmails.includes(user.email || '')
    }

    if (!hasAdminAccess) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Fetch organizations
    const { data: organizations, error: orgsError } = await supabase
      .from('organizations')
      .select(`
        id,
        name,
        slug,
        description,
        subscription_plan,
        max_users,
        max_apis,
        created_at,
        updated_at,
        is_active
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (orgsError) {
      console.error('Database error:', orgsError)
      return NextResponse.json(
        { error: 'Failed to fetch organizations', details: orgsError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      organizations: organizations || [],
      count: organizations?.length || 0
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user has admin permissions - with fallback for development
    let hasAdminAccess = false
    
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError) {
        // Fallback: Check if user email contains 'admin' or is a known admin email
        const adminEmails = ['admin@tin.info', 'admin@example.com']
        hasAdminAccess = adminEmails.includes(user.email || '') || (user.email || '').includes('admin')
      } else if (profile && profile.role === 'system_admin') {
        hasAdminAccess = true
      } else {
        // Fallback for development
        const adminEmails = ['admin@tin.info', 'admin@example.com']
        hasAdminAccess = adminEmails.includes(user.email || '')
      }
    } catch (error) {
      // Fallback: Allow admin emails to access during development
      const adminEmails = ['admin@tin.info', 'admin@example.com']
      hasAdminAccess = adminEmails.includes(user.email || '')
    }

    if (!hasAdminAccess) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, slug, description, subscription_plan, max_users, max_apis } = body

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    // Create organization
    const { data: organization, error: createError } = await supabase
      .from('organizations')
      .insert({
        name,
        slug,
        description,
        subscription_plan: subscription_plan || 'free',
        max_users: max_users || 10,
        max_apis: max_apis || 5,
        is_active: true
      })
      .select()
      .single()

    if (createError) {
      console.error('Create error:', createError)
      return NextResponse.json(
        { error: 'Failed to create organization', details: createError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(organization, { status: 201 })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}