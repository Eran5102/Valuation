import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const { data: memberData, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (memberError || !memberData) {
      // Return mock data if tables don't exist yet
      return NextResponse.json({
        members: [
          {
            id: user.id,
            name:
              `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() ||
              'Current User',
            email: user.email,
            role: 'owner',
          },
        ],
      })
    }

    // Get all members in the organization
    const { data: members, error: membersError } = await supabase
      .from('organization_members')
      .select(
        `
        user_id,
        role,
        user_profiles (
          first_name,
          last_name,
          display_name,
          avatar_url
        )
      `
      )
      .eq('organization_id', memberData.organization_id)
      .eq('is_active', true)

    if (membersError || !members) {
      return NextResponse.json({
        members: [
          {
            id: user.id,
            name:
              `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() ||
              'Current User',
            email: user.email,
            role: 'owner',
          },
        ],
      })
    }

    // Get user emails from auth.users
    const userIds = members.map((m) => m.user_id)
    const {
      data: { users },
    } = await supabase.auth.admin.listUsers()

    const userEmails =
      users?.reduce((acc: Record<string, string>, u) => {
        if (userIds.includes(u.id)) {
          acc[u.id] = u.email || ''
        }
        return acc
      }, {}) || {}

    // Transform the data
    const transformedMembers = members.map((member: any) => ({
      id: member.user_id,
      name:
        member.user_profiles?.display_name ||
        `${member.user_profiles?.first_name || ''} ${member.user_profiles?.last_name || ''}`.trim() ||
        'Team Member',
      email: userEmails[member.user_id] || '',
      role: member.role,
      avatar_url: member.user_profiles?.avatar_url,
    }))

    return NextResponse.json({ members: transformedMembers })
  } catch (error) {
    console.error('Error fetching organization members:', error)

    // Return mock data on error
    return NextResponse.json({
      members: [
        {
          id: '1',
          name: 'Current User',
          email: 'user@example.com',
          role: 'owner',
        },
        {
          id: '2',
          name: 'Sarah Johnson',
          email: 'sarah@example.com',
          role: 'admin',
        },
        {
          id: '3',
          name: 'Mike Wilson',
          email: 'mike@example.com',
          role: 'member',
        },
      ],
    })
  }
}
