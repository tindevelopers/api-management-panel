import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireSystemAdmin } from '@/lib/permissions'

interface RouteParams {
  params: Promise<{
    id: string
    userId: string
  }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id, userId } = await params
  try {
    const supabase = await createClient()
    
    // Get current user and verify system admin permissions
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await requireSystemAdmin(user.id)

    const { role_type } = await request.json()

    // Update user role
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .update({
        role_type,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('organization_id', id)
      .select()
      .single()

    if (roleError) {
      console.error('Error updating user role:', roleError)
      return NextResponse.json(
        { error: 'Failed to update user role' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      userRole,
      message: 'User role updated successfully'
    })

  } catch (error: unknown) {
    console.error('Error updating user role:', error)
    
    if (error && typeof error === 'object' && 'name' in error && error.name === 'PermissionError') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
