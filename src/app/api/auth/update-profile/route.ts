import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update user metadata
    const { data, error } = await supabase.auth.updateUser({
      data: {
        first_name: body.first_name,
        last_name: body.last_name,
        organization_name: body.organization_name,
        organization_type: body.organization_type,
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      user_metadata: data.user?.user_metadata,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      email: user.email,
      user_metadata: user.user_metadata,
      app_metadata: user.app_metadata,
      created_at: user.created_at,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 })
  }
}
