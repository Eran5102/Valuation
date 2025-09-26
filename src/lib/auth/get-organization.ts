import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function getOrganizationId(): Promise<string> {
  const supabase = await createClient()

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  // Get user's organization membership
  const { data: membership, error: membershipError } = await supabase
    .from('organization_memberships')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (membershipError || !membership) {
    // If no membership found, check for a default organization
    const { data: defaultOrg, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .limit(1)
      .single()

    if (orgError || !defaultOrg) {
      // Create a default organization for the user
      const { data: newOrg, error: createError } = await supabase
        .from('organizations')
        .insert({
          name: `${user.email?.split('@')[0] || 'User'}'s Organization`,
          created_by: user.id,
        })
        .select()
        .single()

      if (createError || !newOrg) {
        throw new Error('Failed to get or create organization')
      }

      // Create membership
      await supabase
        .from('organization_memberships')
        .insert({
          organization_id: newOrg.id,
          user_id: user.id,
          role: 'owner',
        })

      return newOrg.id
    }

    return defaultOrg.id
  }

  return membership.organization_id
}