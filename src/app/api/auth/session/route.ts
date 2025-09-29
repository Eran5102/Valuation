import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get session from server
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error('[Session API] Error getting session:', error)
      return NextResponse.json(
        {
          authenticated: false,
          error: error.message,
        },
        { status: 401 }
      )
    }

    if (!session) {
      console.log('[Session API] No session found')
      return NextResponse.json(
        {
          authenticated: false,
          message: 'No active session',
        },
        { status: 401 }
      )
    }

    // Get user details
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    console.log('[Session API] Session found:', {
      userId: session.user.id,
      email: session.user.email,
      metadata: session.user.user_metadata,
      expiresAt: session.expires_at,
    })

    return NextResponse.json({
      authenticated: true,
      session: {
        userId: session.user.id,
        email: session.user.email,
        metadata: session.user.user_metadata,
        expiresAt: session.expires_at,
        accessToken: session.access_token ? 'present' : 'missing',
      },
      user: user
        ? {
            id: user.id,
            email: user.email,
            metadata: user.user_metadata,
          }
        : null,
    })
  } catch (error) {
    console.error('[Session API] Unexpected error:', error)
    return NextResponse.json(
      {
        authenticated: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}
