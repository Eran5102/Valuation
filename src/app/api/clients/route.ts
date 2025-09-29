import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateRequest } from '@/lib/validation/api-schemas'
import { CreateClientRequest, UpdateClientRequest, PaginationParams } from '@/types/database'

// GET /api/clients - Get all clients with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse query parameters with defaults
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const queryParams: PaginationParams = {
      page,
      limit,
      sort: searchParams.get('sort') || 'created_at',
      order: (searchParams.get('order') || 'desc') as 'asc' | 'desc',
    }

    const clientId = searchParams.get('client_id')
    const status = searchParams.get('status')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const offset = (page - 1) * limit

    const supabase = await createClient()

    // Get current user and their organization
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a super admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single()

    const isSuperAdmin = profile?.is_super_admin === true

    let organizationId = null
    if (!isSuperAdmin) {
      // Regular users - get their organization
      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      organizationId = membership?.organization_id

      // If not super admin and no organization, return empty
      if (!organizationId) {
        return NextResponse.json({
          data: [],
          pagination: {
            page: queryParams.page,
            limit: queryParams.limit,
            total: 0,
            pages: 0,
          },
        })
      }
    }

    // Build query - use 'clients' table or 'companies' view
    let query = supabase.from('clients').select('*', { count: 'exact' })

    // Super admins see all clients, others see only their organization's
    if (!isSuperAdmin && organizationId) {
      query = query.eq('organization_id', organizationId)
    }

    // Apply filters
    if (clientId) {
      query = query.eq('id', clientId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo)
    }

    // Apply sorting and pagination
    const sortField = queryParams.sort || 'created_at'
    const ascending = queryParams.order === 'asc'
    query = query
      .order(sortField, { ascending })
      .range(offset, offset + (queryParams.limit ?? 20) - 1)

    const { data: clients, error, count } = await query

    if (error) {
      console.error('Error fetching clients:', error)
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
    }

    return NextResponse.json({
      data: clients || [],
      pagination: {
        page: queryParams.page,
        limit: queryParams.limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / (queryParams.limit ?? 20)),
      },
    })
  } catch (error) {
    console.error('Error in clients GET:', error)
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
  }
}

// POST /api/clients - Create new client
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const rawData = await request.json()
    const clientData = rawData as CreateClientRequest

    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'You must belong to an organization to create clients' },
        { status: 403 }
      )
    }

    // Check permissions - only certain roles can create clients
    const allowedRoles = ['owner', 'admin', 'appraiser']
    if (!allowedRoles.includes(membership.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to create clients' },
        { status: 403 }
      )
    }

    // Create the client
    const { data: newClient, error } = await supabase
      .from('clients')
      .insert({
        ...clientData,
        organization_id: membership.organization_id,
        created_by: user.id,
        lead_assigned: clientData.lead_assigned || user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating client:', error)
      return NextResponse.json(
        { error: 'Failed to create client', details: error.message },
        { status: 500 }
      )
    }

    // Track in assignment history
    if (newClient.lead_assigned) {
      await supabase.from('assignment_history').insert({
        entity_type: 'client',
        entity_id: newClient.id,
        user_id: newClient.lead_assigned,
        role: 'lead',
        assigned_by: user.id,
      })
    }

    return NextResponse.json(newClient, { status: 201 })
  } catch (error) {
    console.error('Error in clients POST:', error)
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
  }
}
