import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of any organization' }, { status: 403 })
    }

    // Check if user has admin permissions
    if (!['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Prevent removing yourself
    if (params.id === user.id) {
      return NextResponse.json({ error: 'You cannot remove yourself' }, { status: 400 })
    }

    // Get the member to remove
    const { data: memberToRemove } = await supabase
      .from('organization_members')
      .select('id, user_id, role, organization_id')
      .eq('user_id', params.id)
      .eq('organization_id', membership.organization_id)
      .eq('is_active', true)
      .single()

    if (!memberToRemove) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Prevent removing owner
    if (memberToRemove.role === 'owner') {
      return NextResponse.json({ error: 'Cannot remove organization owner' }, { status: 400 })
    }

    // Remove the member by setting is_active to false
    const { error: removeError } = await supabase
      .from('organization_members')
      .update({ is_active: false })
      .eq('id', memberToRemove.id)

    if (removeError) {
      console.error('Error removing member:', removeError)
      return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Member removed successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/organization/members/[id]:', error)
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
  }
}
