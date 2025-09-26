import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireSystemAdmin } from '@/lib/permissions'

interface RouteParams {
  params: Promise<{
    id: string
    userId: string
  }>
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Soft delete user role (remove from organization)
    const { error: roleError } = await supabase
      .from('user_roles')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('organization_id', id)

    if (roleError) {
      console.error('Error removing user from organization:', roleError)
      return NextResponse.json(
        { error: 'Failed to remove user from organization' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'User removed from organization successfully'
    })

  } catch (error: unknown) {
    console.error('Error removing user from organization:', error)
    
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
