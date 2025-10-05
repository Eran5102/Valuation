import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PaginationSchema, validateRequest } from '@/lib/validation/api-schemas'

export async function GET(request: NextRequest) {
  console.log('[Organization Members API] GET request started')
  try {
    // Optional pagination parameters
    const { searchParams } = new URL(request.url)

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!membership) {
      return NextResponse.json([], { status: 200 }) // Return empty array instead of error
    }

    // Check if user can view team (all members can view team)
    // Fetch all organization members with user profiles
    const { data: members, error } = await supabase
      .from('organization_members')
      .select(
        `
        id,
        user_id,
        role,
        joined_at,
        is_active
      `
      )
      .eq('organization_id', membership.organization_id)
      .eq('is_active', true)
      .order('joined_at', { ascending: true })

    if (error) throw error

    // Get user profiles for all members
    const userIds = members?.map((m) => m.user_id) || []

    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name, avatar_url')
      .in('id', userIds)

    // Note: We cannot directly query auth.users table in Supabase
    // Email should come from user_profiles or be fetched separately

    // Combine the data
    const formattedMembers =
      members?.map((member: any) => {
        const profile = profiles?.find((p) => p.id === member.user_id)

        return {
          id: member.user_id, // Use user_id as the main id for assignment
          user_id: member.user_id,
          name:
            profile?.first_name && profile?.last_name
              ? `${profile.first_name} ${profile.last_name}`
              : 'Team Member',
          email: '', // Email not available from this endpoint
          role: member.role,
          joined_at: member.joined_at,
          is_active: member.is_active,
          avatar_url: profile?.avatar_url || '',
        }
      }) || []

    console.log('[Organization Members API] Returning', formattedMembers.length, 'members')
    return NextResponse.json({ members: formattedMembers })
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Validation failed:')) {
      return NextResponse.json(
        { error: 'Invalid query parameters', message: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json([], { status: 200 }) // Return empty array on error
  }
}
