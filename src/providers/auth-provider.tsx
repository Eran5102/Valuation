'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { clientAuth, sessionManager } from '@/lib/auth/utils'
import type { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // Check active session
    const initAuth = async () => {
      try {
        const {
          data: { session: activeSession },
        } = await supabase.auth.getSession()

        if (activeSession) {
          setSession(activeSession)
          setUser(activeSession.user)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('Auth event:', event)

      if (currentSession) {
        setSession(currentSession)
        setUser(currentSession.user)
      } else {
        setSession(null)
        setUser(null)
      }

      // Handle specific events
      switch (event) {
        case 'SIGNED_IN':
          console.log('User signed in:', currentSession?.user.email)

          // Check for stored redirect URL
          const redirectUrl = sessionManager.getRedirectUrl()
          if (redirectUrl) {
            router.push(redirectUrl)
          }
          break

        case 'SIGNED_OUT':
          console.log('User signed out')
          setSession(null)
          setUser(null)
          router.push('/auth/login')
          break

        case 'TOKEN_REFRESHED':
          console.log('Token refreshed successfully')
          break

        case 'USER_UPDATED':
          console.log('User profile updated')
          if (currentSession) {
            setUser(currentSession.user)
          }
          break
      }

      setLoading(false)
    })

    // Setup session monitoring for auto-refresh
    const cleanupMonitoring = sessionManager.setupSessionMonitoring(() => {
      console.log('Session expired, refreshing...')
      refreshSession()
    })

    // Cleanup function
    return () => {
      subscription.unsubscribe()
      cleanupMonitoring()
    }
  }, [router])

  const signOut = async () => {
    setLoading(true)
    try {
      await clientAuth.signOut()
    } finally {
      setLoading(false)
    }
  }

  const refreshSession = async () => {
    const newSession = await clientAuth.refreshSession()
    if (newSession) {
      setSession(newSession)
      setUser(newSession.user)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Optional: Export a hook for checking authentication status
export function useRequireAuth(redirectTo: string = '/auth/login') {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      // Store the current URL for redirect after login
      sessionManager.storeRedirectUrl(window.location.pathname)
      router.push(redirectTo)
    }
  }, [user, loading, router, redirectTo])

  return { user, loading }
}
