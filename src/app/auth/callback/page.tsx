import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export default async function AuthCallback({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; error?: string }>
}) {
  const params = await searchParams
  if (params.error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Authentication Error</h1>
          <p className="mt-2 text-muted-foreground">{params.error}</p>
          <a href="/auth/login" className="mt-4 inline-block text-primary hover:underline">
            Return to login
          </a>
        </div>
      </div>
    )
  }

  if (params.code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(params.code)

    if (!error) {
      return NextResponse.redirect(
        new URL('/dashboard', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      )
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Processing authentication...</h1>
        <p className="mt-2 text-muted-foreground">Please wait while we log you in.</p>
      </div>
    </div>
  )
}
