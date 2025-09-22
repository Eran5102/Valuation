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
    // Get user profile to check if super admin
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single()

    // Get user's role in current organization
    const { data: membership, error: memberError } = await supabase
      .from('organization_members')
      .select('role, organization_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (memberError && memberError.code !== 'PGRST116') {
      console.error('Error fetching membership:', memberError)
    }

    const permissions = {
      user_id: user.id,
      email: user.email,
      is_super_admin: profile?.is_super_admin || false,
      role: membership?.role || null,
      organization_id: membership?.organization_id || null,
    }

    return NextResponse.json(permissions)
  } catch (error) {
    console.error('Error fetching permissions:', error)
    return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 })
  }
}
