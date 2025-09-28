'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

interface Organization {
  id: string
  name: string
  slug?: string
  role: string
  subscription_plan?: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  organization: Organization | null
  organizations: Organization[]
  loading: boolean
  signOut: () => Promise<void>
  switchOrganization: (orgId: string) => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    let mounted = true

    // Get initial session
    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (!mounted) return

        if (error) {
          console.error('Error getting session:', error)
        }
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchUserOrganizations(session.user.id).catch((err) => {
            console.error('Error fetching organizations:', err)
          })
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error in getSession:', err)
        if (mounted) {
          setLoading(false)
        }
      })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        try {
          await fetchUserOrganizations(session.user.id)
        } catch (err) {
          console.error('Error in auth state change:', err)
        }
      } else {
        setOrganization(null)
        setOrganizations([])
      }

      // Handle navigation based on auth state
      // Skip navigation on TOKEN_REFRESHED to prevent issues during hot reload
      if (_event === 'SIGNED_IN') {
        router.push('/dashboard')
      } else if (_event === 'SIGNED_OUT') {
        router.push('/auth/login')
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const fetchUserOrganizations = async (userId: string) => {
    try {
      // For now, create a mock organization based on user metadata
      // In production, this would fetch from the organizations table
      const userData = await supabase.auth.getUser()
      const userMetadata = userData.data.user?.user_metadata

      // Extract name parts from full_name if individual fields don't exist
      if (userMetadata && !userMetadata.first_name && userMetadata.full_name) {
        const nameParts = userMetadata.full_name.split(' ')
        userMetadata.first_name = nameParts[0]
        userMetadata.last_name = nameParts.slice(1).join(' ')
      }

      // Try to extract organization from email domain if not set
      let organizationName = userMetadata?.organization_name
      if (!organizationName && userMetadata?.email) {
        const domain = userMetadata.email.split('@')[1]
        if (
          domain &&
          domain !== 'gmail.com' &&
          domain !== 'outlook.com' &&
          domain !== 'yahoo.com'
        ) {
          // Use domain as org name (e.g., bridgeland-advisors.com -> Bridgeland Advisors)
          organizationName = domain
            .replace('.com', '')
            .replace('.org', '')
            .replace('.net', '')
            .split('-')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
        }
      }

      if (organizationName) {
        const mockOrg: Organization = {
          id: userId,
          name: organizationName,
          slug: organizationName.toLowerCase().replace(/\s+/g, '-'),
          role: 'owner',
          subscription_plan: 'starter',
        }
        setOrganization(mockOrg)
        setOrganizations([mockOrg])

        // Store current org in localStorage
        localStorage.setItem('currentOrganizationId', mockOrg.id)
      } else {
        // Default organization for existing users
        const defaultOrg: Organization = {
          id: userId,
          name: 'Default Organization',
          slug: 'default-org',
          role: 'owner',
          subscription_plan: 'starter',
        }
        setOrganization(defaultOrg)
        setOrganizations([defaultOrg])
      }
    } catch (error) {}
  }

  const signOut = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signOut()
    if (!error) {
      setUser(null)
      setSession(null)
      setOrganization(null)
      setOrganizations([])
      localStorage.removeItem('currentOrganizationId')
      router.push('/auth/login')
    }
    setLoading(false)
  }

  const switchOrganization = async (orgId: string) => {
    const newOrg = organizations.find((org) => org.id === orgId)
    if (newOrg) {
      setOrganization(newOrg)
      localStorage.setItem('currentOrganizationId', orgId)

      // Refresh the page to reload data for new organization
      router.refresh()
    }
  }

  const refreshSession = async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.refreshSession()
    if (!error && session) {
      setSession(session)
      setUser(session.user)
    }
  }

  const value = {
    user,
    session,
    organization,
    organizations,
    loading,
    signOut,
    switchOrganization,
    refreshSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Helper hook to require authentication
export function useRequireAuth() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  return { user, loading }
}
