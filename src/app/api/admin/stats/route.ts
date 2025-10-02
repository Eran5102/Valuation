import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is super admin
  const { data: superAdmin, error: superAdminError } = await supabase
    .from('super_admins')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!superAdmin || superAdminError) {
    return NextResponse.json({ error: 'Forbidden - Super Admin access required' }, { status: 403 })
  }

  try {
    // Fetch all organizations
    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false })

    if (orgError) throw orgError

    // Fetch organization member counts
    const { data: memberCounts } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('is_active', true)

    // Count members per organization
    const memberCountMap: Record<string, number> = {}
    memberCounts?.forEach((member) => {
      memberCountMap[member.organization_id] = (memberCountMap[member.organization_id] || 0) + 1
    })

    // Fetch valuation counts per organization
    const { data: valuations } = await supabase.from('valuations').select('organization_id')

    const valuationCountMap: Record<string, number> = {}
    valuations?.forEach((val) => {
      if (val.organization_id) {
        valuationCountMap[val.organization_id] = (valuationCountMap[val.organization_id] || 0) + 1
      }
    })

    // Calculate stats
    const totalOrganizations = organizations?.length || 0
    const activeOrganizations =
      organizations?.filter((o) => o.subscription_status === 'active').length || 0
    const totalUsers = memberCounts?.length || 0
    const totalValuations = valuations?.length || 0

    // Calculate monthly revenue (mock calculation based on subscription plans)
    const planPrices: Record<string, number> = {
      starter: 99,
      professional: 299,
      enterprise: 999,
    }

    const totalRevenue =
      organizations?.reduce((sum, org) => {
        if (org.subscription_status === 'active') {
          return sum + (planPrices[org.subscription_plan] || 0)
        }
        return sum
      }, 0) || 0

    // Create recent activity (mock data for now)
    const recentActivity = [
      {
        id: '1',
        type: 'signup' as const,
        description: 'New organization registered',
        organization: organizations?.[0]?.name || 'Unknown',
        timestamp: '2 hours ago',
        status: 'success' as const,
      },
      {
        id: '2',
        type: 'valuation' as const,
        description: 'Valuation completed',
        organization: organizations?.[1]?.name || 'Unknown',
        timestamp: '5 hours ago',
        status: 'info' as const,
      },
      {
        id: '3',
        type: 'subscription' as const,
        description: 'Plan upgraded to Professional',
        organization: organizations?.[2]?.name || 'Unknown',
        timestamp: '1 day ago',
        status: 'success' as const,
      },
    ]

    // Format organizations list with counts
    const organizationsList =
      organizations?.map((org) => ({
        id: org.id,
        name: org.name,
        subscription_plan: org.subscription_plan,
        subscription_status: org.subscription_status,
        user_count: memberCountMap[org.id] || 0,
        valuation_count: valuationCountMap[org.id] || 0,
        created_at: org.created_at,
      })) || []

    const stats = {
      totalOrganizations,
      activeOrganizations,
      totalUsers,
      totalValuations,
      totalRevenue,
      growthRate: 12.5, // Mock growth rate
      recentActivity,
      organizationsList,
    }

    return NextResponse.json(stats)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
