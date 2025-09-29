import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/permissions'
import { Permission } from '@/types/multi-role'
import { RoleType } from '@/types/multi-role'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user and verify permissions
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { email, organization_id, role_type, message } = await request.json()

    if (!email || !organization_id || !role_type) {
      return NextResponse.json(
        { error: 'Email, organization ID, and role type are required' },
        { status: 400 }
      )
    }

    // Validate role type
    if (!Object.values(RoleType).includes(role_type)) {
      return NextResponse.json(
        { error: 'Invalid role type' },
        { status: 400 }
      )
    }

    // Check if user has permission to invite users to this organization
    if (role_type === RoleType.SYSTEM_ADMIN) {
      await requirePermission(user.id, Permission.MANAGE_SYSTEM_USERS)
    } else {
      await requirePermission(user.id, Permission.MANAGE_ORG_USERS, organization_id)
    }

    // Check if organization exists and is active
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, status')
      .eq('id', organization_id)
      .single()

    if (orgError || !organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    if (organization.status !== 'active') {
      return NextResponse.json(
        { error: 'Organization is not active' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      // Check if user already has a role in this organization
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id, role_type, is_active')
        .eq('user_id', existingUser.id)
        .eq('organization_id', organization_id)
        .single()

      if (existingRole) {
        if (existingRole.is_active) {
          return NextResponse.json(
            { error: 'User already has a role in this organization' },
            { status: 400 }
          )
        } else {
          // Reactivate the role
          const { error: reactivateError } = await supabase
            .from('user_roles')
            .update({ 
              is_active: true,
              role_type: role_type,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingRole.id)

          if (reactivateError) {
            return NextResponse.json(
              { error: 'Failed to reactivate user role' },
              { status: 500 }
            )
          }

          return NextResponse.json({
            message: 'User role reactivated successfully',
            user_id: existingUser.id,
            existing_user: true
          })
        }
      }
    }

    // Check for existing pending invitation
    const { data: existingInvitation } = await supabase
      .from('user_invitations')
      .select('id, status, expires_at')
      .eq('email', email)
      .eq('organization_id', organization_id)
      .in('status', ['pending', 'expired'])
      .single()

    if (existingInvitation) {
      if (existingInvitation.status === 'pending' && new Date(existingInvitation.expires_at) > new Date()) {
        return NextResponse.json(
          { error: 'Invitation already exists and is still valid' },
          { status: 400 }
        )
      } else {
        // Update existing invitation
        const token = uuidv4()
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7) // 7 days from now

        const { error: updateError } = await supabase
          .from('user_invitations')
          .update({
            role_type,
            invited_by: user.id,
            token,
            expires_at: expiresAt.toISOString(),
            status: 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingInvitation.id)

        if (updateError) {
          return NextResponse.json(
            { error: 'Failed to update invitation' },
            { status: 500 }
          )
        }

        // Send invitation email (this would integrate with your email service)
        await sendInvitationEmail(email, organization.name, role_type, token, message)

        return NextResponse.json({
          message: 'Invitation updated and sent successfully',
          invitation_id: existingInvitation.id,
          token,
          expires_at: expiresAt.toISOString()
        })
      }
    }

    // Create new invitation
    const token = uuidv4()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days from now

    const { data: invitation, error: inviteError } = await supabase
      .from('user_invitations')
      .insert({
        email,
        organization_id,
        role_type,
        invited_by: user.id,
        token,
        expires_at: expiresAt.toISOString(),
        status: 'pending'
      })
      .select('id')
      .single()

    if (inviteError) {
      console.error('Error creating invitation:', inviteError)
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      )
    }

    // Send invitation email (this would integrate with your email service)
    await sendInvitationEmail(email, organization.name, role_type, token, message)

    // Log the invitation
    await supabase.rpc('log_audit_event', {
      p_user_id: user.id,
      p_organization_id: organization_id,
      p_action: 'user.invite',
      p_resource_type: 'user_invitation',
      p_resource_id: invitation.id,
      p_old_values: {},
      p_new_values: { 
        email,
        role_type,
        organization_name: organization.name
      },
      p_ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1',
      p_user_agent: request.headers.get('user-agent') || ''
    })

    return NextResponse.json({
      message: 'Invitation sent successfully',
      invitation_id: invitation.id,
      token,
      expires_at: expiresAt.toISOString()
    })

  } catch (error: unknown) {
    console.error('Error creating user invitation:', error)
    
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

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user and verify permissions
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await requirePermission(user.id, Permission.MANAGE_SYSTEM_USERS)

    const { searchParams } = new URL(request.url)
    const organization_id = searchParams.get('organization_id')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('user_invitations')
      .select(`
        *,
        organization:organizations(name, slug),
        invited_by_user:profiles!user_invitations_invited_by_fkey(full_name, email)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (organization_id) {
      query = query.eq('organization_id', organization_id)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: invitations, error: invitationsError } = await query

    if (invitationsError) {
      console.error('Error fetching invitations:', invitationsError)
      return NextResponse.json(
        { error: 'Failed to fetch invitations' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('user_invitations')
      .select('*', { count: 'exact', head: true })

    if (organization_id) {
      countQuery = countQuery.eq('organization_id', organization_id)
    }

    if (status) {
      countQuery = countQuery.eq('status', status)
    }

    const { count } = await countQuery

    return NextResponse.json({
      invitations,
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: (count || 0) > offset + limit
      }
    })

  } catch (error: unknown) {
    console.error('Error fetching invitations:', error)
    
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

// Helper function to send invitation email
async function sendInvitationEmail(
  email: string, 
  organizationName: string, 
  roleType: string, 
  token: string, 
  customMessage?: string
) {
  // This would integrate with your email service (SendGrid, AWS SES, etc.)
  // For now, we'll just log the invitation details
  console.log('Sending invitation email:', {
    to: email,
    organization: organizationName,
    role: roleType,
    token,
    customMessage,
    invitationUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/invite/${token}`
  })

  // In a real implementation, you would:
  // 1. Generate an HTML email template
  // 2. Send the email using your email service
  // 3. Handle delivery status and bounces
  
  return Promise.resolve()
}
