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

    // Get total count
    const { count } = await supabase.from('valuations').select('*', { count: 'exact', head: true })

    // Get paginated data
    const { data: valuations, error } = await supabase
      .from('valuations')
      .select('*')
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

    // Pass through all fields from valuationData, excluding ones we know don't exist
    const { name, ...restValuationData } = valuationData

    const insertData: any = {
      ...restValuationData,
      company_id: valuationData.company_id || client_id,
      title: valuationData.title || name || `Valuation ${new Date().toISOString().split('T')[0]}`,
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
      }, { status: 201 }
    )
}
