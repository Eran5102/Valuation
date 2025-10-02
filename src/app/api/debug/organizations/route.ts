import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check organizations table
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('*')
      .eq('owner_id', user.id)

    // Check organization_members table
    const { data: members, error: membersError } = await supabase
      .from('organization_members')
      .select('*')
      .eq('user_id', user.id)

    // Check super_admins table
    const { data: superAdmin, error: superAdminError } = await supabase
      .from('super_admins')
      .select('*')
      .eq('user_id', user.id)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata,
      },
      organizations: {
        data: orgs,
        error: orgsError?.message,
      },
      memberships: {
        data: members,
        error: membersError?.message,
      },
      superAdmin: {
        data: superAdmin,
        error: superAdminError?.message,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
