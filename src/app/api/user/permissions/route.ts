import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Check if user is a super admin (from super_admins table)
    const { data: superAdmin, error: superAdminError } = await supabase
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .single()

    const isSuperAdmin = !!superAdmin && !superAdminError

    // Get user's role in current organization
    const { data: membership, error: memberError } = await supabase
      .from('organization_members')
      .select('role, organization_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (memberError && memberError.code !== 'PGRST116') {
      console.error('Error fetching organization membership:', memberError)
    }

    const permissions = {
      user_id: user.id,
      email: user.email,
      is_super_admin: isSuperAdmin,
      role: membership?.role || null,
      organization_id: membership?.organization_id || null,
    }

    return NextResponse.json(permissions)
  } catch (error) {
    console.error('Error in permissions API:', error)
    return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 })
  }
}
