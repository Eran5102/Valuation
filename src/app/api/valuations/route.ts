import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import ApiHandler from '@/lib/middleware/apiHandler'

// GET /api/valuations - Get all valuations
export const GET = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = (page - 1) * limit

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

  const { data: valuations, error } = await dataQuery
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching valuations:', error)
    return NextResponse.json({ error: 'Failed to fetch valuations' }, { status: 500 })
  }

  return NextResponse.json({
    data: valuations || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
    },
  })
}

// POST /api/valuations - Create valuation project
export const POST = async (request: NextRequest) => {
  const body = await request.json()
  const { client_id, ...valuationData } = body

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

  // Pass through all fields from valuationData, excluding ones we know don't exist
  const { name, ...restValuationData } = valuationData

  const insertData: any = {
    ...restValuationData,
    company_id: valuationData.company_id || client_id,
    title: valuationData.title || name || `Valuation ${new Date().toISOString().split('T')[0]}`,
    organization_id: organizationId,
    created_at: new Date().toISOString(),
  }

  // Ensure valuation_date is set if not provided
  if (!insertData.valuation_date) {
    insertData.valuation_date = new Date().toISOString().split('T')[0]
  }

  const { data: valuation, error } = await supabase
    .from('valuations')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    console.error('Error creating valuation:', error)
    return NextResponse.json({ error: 'Failed to create valuation' }, { status: 500 })
  }

  return NextResponse.json(
    {
      data: valuation,
      message: 'Valuation project created successfully',
    },
    { status: 201 }
  )
}
