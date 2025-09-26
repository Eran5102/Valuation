import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'
import {
  InviteMemberSchema,
  validateRequest,
} from '@/lib/validation/api-schemas'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization and check permissions
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!membership || !['org_owner', 'org_admin'].includes(membership.role)) {
      return NextResponse.json([], { status: 200 }) // Return empty array if no permission
    }

    // Fetch pending invitations
    const { data: invitations, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('organization_id', membership.organization_id)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(invitations || [])
  } catch (error) {
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const rawData = await request.json()
    const { email, role, message } = validateRequest(InviteMemberSchema, rawData)

    // Get user's organization and check permissions
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!membership || !['org_owner', 'org_admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if user is already a member
    const { data: existingUser } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      const { data: existingMember } = await supabase
        .from('organization_members')
        .select('id')
        .eq('user_id', existingUser.id)
        .eq('organization_id', membership.organization_id)
        .single()

      if (existingMember) {
        return NextResponse.json({ error: 'User is already a member' }, { status: 400 })
      }
    }

    // Check if invitation already exists
    const { data: existingInvitation } = await supabase
      .from('invitations')
      .select('id')
      .eq('email', email)
      .eq('organization_id', membership.organization_id)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (existingInvitation) {
      return NextResponse.json({ error: 'Invitation already sent' }, { status: 400 })
    }

    // Create invitation
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // Expires in 7 days

    const { data: invitation, error } = await supabase
      .from('invitations')
      .insert({
        organization_id: membership.organization_id,
        email,
        role,
        token,
        invited_by: user.id,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    // TODO: Send invitation email
    // For now, we'll just return the invitation with the token
    // In production, you'd send this via email

    return NextResponse.json({
      message: 'Invitation sent successfully',
      invitation: {
        ...invitation,
        invitation_link: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${token}`,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Validation failed:')) {
      return NextResponse.json(
        { error: 'Validation Error', message: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 })
  }
}
