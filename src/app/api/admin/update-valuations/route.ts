import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()

    // Check if user is authenticated and is super admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check super admin
    const { data: superAdmin } = await supabase
      .from('super_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .single()

    if (!superAdmin) {
      return NextResponse.json({ error: 'Forbidden - Super admin only' }, { status: 403 })
    }

    // Update valuations without assigned_to
    const { error: updateError } = await supabase.rpc('update_valuations_assigned_to')

    if (updateError) {
      console.error('Error updating valuations:', updateError)
      // Try direct update instead
      const { data: orgMembers } = await supabase
        .from('organization_members')
        .select('user_id, organization_id')
        .eq('role', 'owner')

      if (orgMembers && orgMembers.length > 0) {
        const firstOwner = orgMembers[0]

        const { error: directUpdateError } = await supabase
          .from('valuations')
          .update({ assigned_to: firstOwner.user_id })
          .is('assigned_to', null)

        if (directUpdateError) {
          throw directUpdateError
        }
      }
    }

    // Get updated count
    const { count } = await supabase
      .from('valuations')
      .select('*', { count: 'exact', head: true })
      .not('assigned_to', 'is', null)

    return NextResponse.json({
      success: true,
      message: `Updated valuations: ${count} now have assigned_to set`,
      count,
    })
  } catch (error) {
    console.error('Update valuations error:', error)
    return NextResponse.json(
      {
        error: 'Failed to update valuations',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
