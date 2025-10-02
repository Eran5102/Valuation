'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './AuthContext'

interface Organization {
  id: string
  name: string
  slug?: string
  plan?: string
  logo?: string
  created_at: string
  owner_id: string
  // Add member info
  user_role?: string
}

interface OrganizationMember {
  organization_id: string
  user_id: string
  role: string
  is_active: boolean
}

interface OrganizationContextType {
  currentOrganization: Organization | null
  organizations: Organization[]
  setCurrentOrganization: (org: Organization | null) => void
  loading: boolean
  createOrganization: (name: string, plan?: string) => Promise<Organization | null>
  switchOrganization: (orgId: string) => void
  ensureOrganizationMembership: () => Promise<void>
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadOrganizations()
    } else {
      setOrganizations([])
      setCurrentOrganization(null)
      setLoading(false)
    }
  }, [user])

  const ensureOrganizationMembership = async () => {
    // This function is kept for backward compatibility but no longer auto-creates organizations
    // Organizations should be created via the database migration or admin interface
    if (!user) return

    console.log('[OrganizationContext] Checking organization membership for:', user.email)
  }

  const loadOrganizations = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      console.log('[OrganizationContext] Loading organizations for user:', user?.email)

      // First ensure user has organization membership
      await ensureOrganizationMembership()

      // Fetch organizations where user is a member
      const { data: memberships, error: memberError } = await supabase
        .from('organization_members')
        .select(
          `
          role,
          is_active,
          organization:organizations (
            id,
            name,
            slug,
            owner_id,
            created_at,
            subscription_tier
          )
        `
        )
        .eq('user_id', user?.id)
        .eq('is_active', true)

      console.log('[OrganizationContext] Memberships:', memberships, 'Error:', memberError)

      let userOrganizations: Organization[] = []

      if (!memberError && memberships && memberships.length > 0) {
        // Map memberships to organizations with user's role
        userOrganizations = memberships
          .filter((m) => m.organization)
          .map((m) => ({
            ...m.organization,
            user_role: m.role,
            plan: m.organization.subscription_tier || 'free',
          }))
      } else {
        // Fallback: Check if user owns any organizations (backward compatibility)
        const { data: ownedOrgs, error: orgsError } = await supabase
          .from('organizations')
          .select('*')
          .eq('owner_id', user?.id)

        if (!orgsError && ownedOrgs && ownedOrgs.length > 0) {
          // Create membership entries for owned organizations
          for (const org of ownedOrgs) {
            // Check if membership already exists
            const { data: existingMembership } = await supabase
              .from('organization_members')
              .select('id')
              .eq('organization_id', org.id)
              .eq('user_id', user?.id)
              .single()

            if (!existingMembership) {
              // Create membership
              await supabase.from('organization_members').insert({
                organization_id: org.id,
                user_id: user?.id,
                role: 'owner',
                is_active: true,
              })
            }
          }

          userOrganizations = ownedOrgs.map((org) => ({
            ...org,
            user_role: 'owner',
            plan: org.subscription_tier || 'free',
          }))
        }
      }

      setOrganizations(userOrganizations)

      // Set the current organization
      const savedOrgId = localStorage.getItem('currentOrganizationId')
      const savedOrg = userOrganizations.find((org) => org.id === savedOrgId)
      setCurrentOrganization(savedOrg || userOrganizations[0])
    } catch (error) {
      console.error('Error loading organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  const createOrganization = async (name: string, plan = 'free'): Promise<Organization | null> => {
    try {
      const supabase = createClient()

      // Create organization in database
      const { data: newOrg, error: createError } = await supabase
        .from('organizations')
        .insert({
          name,
          slug: name.toLowerCase().replace(/\s+/g, '-'),
          owner_id: user?.id,
          subscription_status: 'active',
          subscription_tier: plan,
        })
        .select()
        .single()

      if (createError || !newOrg) {
        console.error('Error creating organization:', createError)
        return null
      }

      // Add user as member with owner role
      await supabase.from('organization_members').insert({
        organization_id: newOrg.id,
        user_id: user?.id,
        role: 'owner',
        is_active: true,
      })

      const orgWithRole = {
        ...newOrg,
        user_role: 'owner',
        plan,
      }

      setOrganizations([...organizations, orgWithRole])
      setCurrentOrganization(orgWithRole)
      localStorage.setItem('currentOrganizationId', newOrg.id)

      return orgWithRole
    } catch (error) {
      console.error('Error creating organization:', error)
      return null
    }
  }

  const switchOrganization = (orgId: string) => {
    const org = organizations.find((o) => o.id === orgId)
    if (org) {
      setCurrentOrganization(org)
      localStorage.setItem('currentOrganizationId', orgId)
    }
  }

  return (
    <OrganizationContext.Provider
      value={{
        currentOrganization,
        organizations,
        setCurrentOrganization,
        loading,
        createOrganization,
        switchOrganization,
        ensureOrganizationMembership,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider')
  }
  return context
}
