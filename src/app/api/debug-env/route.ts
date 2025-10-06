import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    // Show only last 8 characters of keys for security
    anonKeyEnd: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(-8),
    serviceKeyEnd: process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(-8),
  })
}
