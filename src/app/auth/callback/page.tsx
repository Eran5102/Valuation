import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AuthCallback({
  searchParams,
}: {
  searchParams: Promise<{
    code?: string
    error?: string
    error_description?: string
    next?: string
    redirectTo?: string
  }>
}) {
  const params = await searchParams

  // Handle authentication errors
  if (params.error) {
    const errorMessage =
      params.error_description || params.error || 'An authentication error occurred'
    console.error('Auth callback error:', errorMessage)

    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="mx-auto max-w-md text-center">
          <div className="bg-destructive/10 mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full">
            <svg
              className="h-8 w-8 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-foreground">Authentication Failed</h1>
          <p className="mb-6 text-muted-foreground">{errorMessage}</p>
          <a
            href="/auth/login"
            className="hover:bg-primary/90 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors"
          >
            Return to Login
          </a>
        </div>
      </div>
    )
  }

  // Process the authentication code
  if (params.code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(params.code)

    if (error) {
      console.error('Session exchange error:', error)
      return (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="mx-auto max-w-md text-center">
            <h1 className="mb-2 text-2xl font-bold text-foreground">Session Error</h1>
            <p className="mb-6 text-muted-foreground">
              Failed to create session. Please try logging in again.
            </p>
            <a
              href="/auth/login"
              className="hover:bg-primary/90 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors"
            >
              Return to Login
            </a>
          </div>
        </div>
      )
    }

    // Successfully authenticated
    if (data.session) {
      // Check for redirect parameter
      const redirectTo = params.next || params.redirectTo || '/dashboard'

      // Validate redirect URL to prevent open redirects
      const isValidRedirect = redirectTo.startsWith('/') && !redirectTo.startsWith('//')
      const finalRedirect = isValidRedirect ? redirectTo : '/dashboard'

      // Redirect to the intended destination
      // Note: redirect() will throw a special NEXT_REDIRECT error which is expected
      return redirect(finalRedirect)
    }
  }

  // Show loading state while processing
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-foreground">Authenticating...</h1>
        <p className="text-muted-foreground">Please wait while we verify your credentials</p>
      </div>
    </div>
  )
}
