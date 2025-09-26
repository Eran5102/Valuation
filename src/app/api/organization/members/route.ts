import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  PaginationSchema,
  validateRequest,
} from '@/lib/validation/api-schemas'

export async function GET(request: NextRequest) {
  try {
    // Validate query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = validateRequest(PaginationSchema, {
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      sort: searchParams.get('sort'),
      order: searchParams.get('order'),
    })

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

    // Get emails from auth.users (using RPC function or direct query)
    const { data: users } = await supabase
      .from('auth.users')
      .select('id, email, raw_user_meta_data')
      .in('id', userIds)

    // Combine the data
    const formattedMembers =
      members?.map((member: any) => {
        const profile = profiles?.find((p) => p.id === member.user_id)
        const authUser = users?.find((u) => u.id === member.user_id)

        return {
          id: member.id,
          user_id: member.user_id,
          role: member.role,
          joined_at: member.joined_at,
          is_active: member.is_active,
          email: authUser?.email || '',
          first_name: profile?.first_name || authUser?.raw_user_meta_data?.first_name || '',
          last_name: profile?.last_name || authUser?.raw_user_meta_data?.last_name || '',
          avatar_url: profile?.avatar_url || authUser?.raw_user_meta_data?.avatar_url || '',
        }
      }) || []

    return NextResponse.json(formattedMembers)
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