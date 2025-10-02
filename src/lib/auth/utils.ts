import { createClient } from '@/lib/supabase/client'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

/**
 * Client-side authentication utilities
 */
export const clientAuth = {
  /**
   * Get the current user on the client side
   */
  async getUser(): Promise<User | null> {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  },

  /**
   * Sign out the current user
   */
  async signOut(redirectTo: string = '/auth/login'): Promise<void> {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = redirectTo
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const user = await this.getUser()
    return !!user
  },

  /**
   * Refresh the current session
   */
  async refreshSession() {
    const supabase = createClient()
    const { data, error } = await supabase.auth.refreshSession()
    if (error) {
      console.error('Failed to refresh session:', error)
      return null
    }
    return data.session
  },

  /**
   * Set up automatic session refresh
   */
  setupAutoRefresh() {
    const supabase = createClient()

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully')
      }

      if (event === 'SIGNED_OUT') {
        // Clear any app state here
        window.location.href = '/auth/login'
      }

      if (event === 'SIGNED_IN' && session) {
        // User just signed in
        console.log('User signed in:', session.user.email)
      }

      if (event === 'USER_UPDATED') {
        // User profile updated
        console.log('User profile updated')
      }
    })

    // Return cleanup function
    return () => {
      subscription.unsubscribe()
    }
  },
}

/**
 * Server-side authentication utilities
 */
export const serverAuth = {
  /**
   * Get the current user on the server side
   */
  async getUser(): Promise<User | null> {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  },

  /**
   * Require authentication or redirect
   */
  async requireAuth(redirectTo?: string): Promise<User> {
    const user = await this.getUser()
    if (!user) {
      const loginUrl = redirectTo
        ? `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`
        : '/auth/login'
      redirect(loginUrl)
    }
    return user
  },

  /**
   * Get user's organization and role
   */
  async getUserOrganization(userId?: string) {
    const supabase = await createServerClient()
    const user = userId || (await this.getUser())?.id

    if (!user) return null

    const { data, error } = await supabase
      .from('organization_members')
      .select(
        `
        role,
        is_active,
        organization:organizations (
          id,
          name,
          subscription_status,
          subscription_tier
        )
      `
      )
      .eq('user_id', user)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('Failed to get user organization:', error)
      return null
    }

    return data
  },

  /**
   * Check if user has specific role
   */
  async hasRole(roles: string[]): Promise<boolean> {
    const org = await this.getUserOrganization()
    if (!org) return false
    return roles.includes(org.role)
  },

  /**
   * Get user's profile
   */
  async getUserProfile() {
    const supabase = await createServerClient()
    const user = await this.getUser()

    if (!user) return null

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Failed to get user profile:', error)
      return null
    }

    return data
  },
}

/**
 * Magic link configuration
 */
export const magicLinkConfig = {
  /**
   * Get the redirect URL for magic links
   */
  getRedirectUrl(redirectTo?: string): string {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (typeof window !== 'undefined' ? window.location.origin : '')

    const callbackUrl = new URL('/auth/callback', baseUrl)

    if (redirectTo) {
      callbackUrl.searchParams.set('next', redirectTo)
    }

    return callbackUrl.toString()
  },

  /**
   * Send a magic link to the user
   */
  async sendMagicLink(email: string, redirectTo?: string) {
    const supabase = createClient()

    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: this.getRedirectUrl(redirectTo),
        data: {
          redirect_to: redirectTo || '/dashboard',
        },
      },
    })

    if (error) {
      throw error
    }

    return data
  },
}

/**
 * Session management utilities
 */
export const sessionManager = {
  /**
   * Store intended destination before redirect
   */
  storeRedirectUrl(url: string) {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('auth_redirect', url)
    }
  },

  /**
   * Get and clear stored redirect URL
   */
  getRedirectUrl(): string | null {
    if (typeof window === 'undefined') return null

    const url = sessionStorage.getItem('auth_redirect')
    if (url) {
      sessionStorage.removeItem('auth_redirect')
    }
    return url
  },

  /**
   * Check if session is expired
   */
  async isSessionExpired(): Promise<boolean> {
    const supabase = createClient()
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error || !session) return true

    // Check if token is expired
    const expiresAt = session.expires_at
    if (!expiresAt) return false

    const now = Math.floor(Date.now() / 1000)
    return now >= expiresAt
  },

  /**
   * Setup session monitoring
   */
  setupSessionMonitoring(onExpired?: () => void) {
    let checkInterval: NodeJS.Timeout

    const checkSession = async () => {
      const expired = await this.isSessionExpired()
      if (expired && onExpired) {
        onExpired()
        clearInterval(checkInterval)
      }
    }

    // Check session every 5 minutes
    checkInterval = setInterval(checkSession, 5 * 60 * 1000)

    // Return cleanup function
    return () => {
      clearInterval(checkInterval)
    }
  },
}

/**
 * Authentication guards for API routes
 */
export const apiAuth = {
  /**
   * Verify API request authentication
   */
  async verifyRequest(request: Request): Promise<User | null> {
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const supabase = await createServerClient()

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token)

    if (error || !user) {
      return null
    }

    return user
  },

  /**
   * Create authenticated response
   */
  unauthorizedResponse(message: string = 'Unauthorized') {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
        message,
      }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  },
}
