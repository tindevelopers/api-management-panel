import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service'

export async function GET() {
  try {
    // TEMPORARY: Complete authentication bypass for testing
    console.log('⚠️  TEMPORARY: Complete authentication bypass for organizations API testing')

    const supabase = createServiceRoleClient()

    // Skip all authentication checks for testing
    console.log('🔄 Bypassing all authentication checks for testing')

    // Fetch organizations using service role to bypass RLS
    const { data: organizations, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name, slug, description, max_users, max_apis, created_at, updated_at, is_active')
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
    // TEMPORARY: Complete authentication bypass for testing
    console.log('⚠️  TEMPORARY: Complete authentication bypass for organizations API testing')

    const supabase = createServiceRoleClient()

    // Skip all authentication checks for testing
    console.log('🔄 Bypassing all authentication checks for testing')

    // Parse request body
    const body = await request.json()
    const { name, slug, description, max_users, max_apis } = body

    console.log('📝 Creating organization with data:', { name, slug, description, max_users, max_apis })

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const { data: existingOrg, error: checkError } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error checking existing organization:', checkError)
      return NextResponse.json(
        { error: 'Failed to validate organization slug', details: checkError.message },
        { status: 500 }
      )
    }

    if (existingOrg) {
      return NextResponse.json(
        { error: 'An organization with this slug already exists' },
        { status: 409 }
      )
    }

    // Create organization
    const { data: organization, error: createError } = await supabase
      .from('organizations')
      .insert({
        name,
        slug,
        description,
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

    console.log('✅ Organization created successfully:', organization)
    return NextResponse.json(organization, { status: 201 })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}