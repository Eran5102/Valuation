import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import ApiHandler from '@/lib/middleware/apiHandler'
import {
  CreateValuationSchema,
  PaginationSchema,
  validateRequest,
} from '@/lib/validation/api-schemas'

// GET /api/valuations - Get all valuations
export const GET = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)

    // Validate query parameters
    const queryParams = validateRequest(PaginationSchema, {
      page: searchParams.get('page'),
      limit: searchParams.get('limit') || '50', // Default to 50 for valuations
      sort: searchParams.get('sort'),
      order: searchParams.get('order'),
    })

    const offset = (queryParams.page - 1) * queryParams.limit

  const supabase = await createClient()

  // Get current user and organization
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let organizationId = null
  if (user) {
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    organizationId = membership?.organization_id
  }

  // Get total count with organization filter
  let countQuery = supabase.from('valuations').select('*', { count: 'exact', head: true })
  if (organizationId) {
    countQuery = countQuery.eq('organization_id', organizationId)
  }
  const { count } = await countQuery

  // Get paginated data
  let dataQuery = supabase.from('valuations').select('*')
  if (organizationId) {
    dataQuery = dataQuery.eq('organization_id', organizationId)
  }

  const sortField = queryParams.sort || 'created_at'
  const ascending = queryParams.order === 'asc'
  const { data: valuations, error } = await dataQuery
    .order(sortField, { ascending })
    .range(offset, offset + queryParams.limit - 1)

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch valuations' }, { status: 500 })
  }

    return NextResponse.json({
      data: valuations || [],
      pagination: {
        page: queryParams.page,
        limit: queryParams.limit,
        total: count || 0,
        hasMore: (count || 0) > offset + queryParams.limit,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Validation failed:')) {
      return NextResponse.json(
        { error: 'Invalid query parameters', message: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Failed to fetch valuations' }, { status: 500 })
  }
}

// POST /api/valuations - Create valuation project
export const POST = async (request: NextRequest) => {
  try {
    const rawData = await request.json()
    const { client_id, ...restData } = rawData

    // Validate the valuation data
    const valuationData = validateRequest(CreateValuationSchema, {
      ...restData,
      company_id: restData.company_id || client_id,
    })

  const supabase = await createClient()

  // Get current user and organization
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let organizationId = null
  if (user) {
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    organizationId = membership?.organization_id
  }

    const insertData = {
      ...valuationData,
      organization_id: organizationId,
      created_at: new Date().toISOString(),
    }

  const { data: valuation, error } = await supabase
    .from('valuations')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create valuation' }, { status: 500 })
  }

    return NextResponse.json(
      {
        data: valuation,
        message: 'Valuation project created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Validation failed:')) {
      return NextResponse.json(
        { error: 'Validation Error', message: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Failed to create valuation' }, { status: 500 })
  }
}
