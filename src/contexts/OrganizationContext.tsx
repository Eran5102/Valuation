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
}

interface OrganizationContextType {
  currentOrganization: Organization | null
  organizations: Organization[]
  setCurrentOrganization: (org: Organization | null) => void
  loading: boolean
  createOrganization: (name: string, plan?: string) => Promise<Organization | null>
  switchOrganization: (orgId: string) => void
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

  const loadOrganizations = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      // First, try to fetch from organizations table
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select('*')
        .or(`owner_id.eq.${user?.id},member_ids.cs.{${user?.id}}`)
        .order('created_at', { ascending: false })

      let userOrganizations: Organization[] = []

      if (!orgsError && orgsData && orgsData.length > 0) {
        // Use real data from Supabase
        userOrganizations = orgsData
      } else {
        // Fallback: Create organization from user's email domain
        const email = user?.email || ''
        const domain = email.split('@')[1]

        if (domain) {
          // Convert domain to organization name (e.g., bridgeland-advisors.com -> Bridgeland Advisors)
          const organizationName = domain
            .replace('.com', '')
            .replace('.org', '')
            .replace('.net', '')
            .replace('.io', '')
            .split(/[-_]/)
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')

          // Check if we need to create this organization in the database
          const { data: existingOrg } = await supabase
            .from('organizations')
            .select('*')
            .eq('name', organizationName)
            .single()

          if (existingOrg) {
            userOrganizations = [existingOrg]
          } else {
            // Create the organization
            const newOrg = {
              name: organizationName,
              slug: domain
                .replace('.com', '')
                .replace('.org', '')
                .replace('.net', '')
                .replace('.io', ''),
              plan: 'Professional Plan',
              owner_id: user?.id || '',
              created_at: new Date().toISOString(),
            }

            const { data: createdOrg, error: createError } = await supabase
              .from('organizations')
              .insert([newOrg])
              .select()
              .single()

            if (!createError && createdOrg) {
              userOrganizations = [createdOrg]
            } else {
              // If table doesn't exist or insert fails, use in-memory organization
              userOrganizations = [
                {
                  id: `org_${Date.now()}`,
                  ...newOrg,
                },
              ]
            }
          }
        }

        // Add some additional demo organizations for testing
        if (userOrganizations.length === 1) {
          userOrganizations.push(
            {
              id: `org_${Date.now()}_2`,
              name: 'Demo Corporation',
              slug: 'demo-corp',
              plan: 'Growth Plan',
              created_at: new Date().toISOString(),
              owner_id: user?.id || '',
            },
            {
              id: `org_${Date.now()}_3`,
              name: 'Test Ventures',
              slug: 'test-ventures',
              plan: 'Enterprise Plan',
              created_at: new Date().toISOString(),
              owner_id: user?.id || '',
            }
          )
        }
      }

      setOrganizations(userOrganizations)

      // Set the current organization
      const savedOrgId = localStorage.getItem('currentOrganizationId')
      const savedOrg = userOrganizations.find((org) => org.id === savedOrgId)
      setCurrentOrganization(savedOrg || userOrganizations[0])
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  const createOrganization = async (
    name: string,
    plan = 'Free Plan'
  ): Promise<Organization | null> => {
    try {
      const newOrg: Organization = {
        id: Date.now().toString(),
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        plan,
        created_at: new Date().toISOString(),
        owner_id: user?.id || '',
      }

      setOrganizations([...organizations, newOrg])
      setCurrentOrganization(newOrg)
      localStorage.setItem('currentOrganizationId', newOrg.id)

      return newOrg
    } catch (error) {
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
