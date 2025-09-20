import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import ApiHandler from '@/lib/middleware/apiHandler'
import {
  CreateCompanySchema,
  PaginationSchema,
  FilterSchema,
  Company,
} from '@/lib/validation/schemas'

// GET /api/companies - Get all companies with pagination and filtering
export const GET = async (request: NextRequest) => {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const companyId = searchParams.get('company_id')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const offset = (page - 1) * limit

    const supabase = await createClient()

    // Build query
    let query = supabase.from('companies').select('*', { count: 'exact' })

    // Apply filters
    if (companyId) {
      query = query.eq('id', companyId)
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo)
    }

    // Apply sorting and pagination
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

    const { data: companies, error, count } = await query

    if (error) {
      console.error('Error fetching companies:', error)
      return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
    }

    return NextResponse.json({
      data: companies || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    })
}

// POST /api/companies - Create new company
export const POST = async (request: NextRequest) => {
    const companyData = await request.json()
    const supabase = await createClient()

    // Check if company name already exists
    const { data: existingCompanies, error: checkError } = await supabase
      .from('companies')
      .select('name')
      .ilike('name', companyData.name)

    if (checkError) {
      console.error('Error checking company name:', checkError)
      return NextResponse.json({ error: 'Failed to validate company name' }, { status: 500 })
    }

    if (existingCompanies && existingCompanies.length > 0) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'A company with this name already exists',
          timestamp: new Date().toISOString(),
        },
        { status: 409 }
      )
    }

    // Create the company with all available fields
    const { data: company, error: createError } = await supabase
      .from('companies')
      .insert({
        ...companyData,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating company:', createError)
      return NextResponse.json({ error: 'Failed to create company' }, { status: 500 })
    }

    return NextResponse.json(
      {
        data: company,
        message: 'Company created successfully',
      },
      { status: 201 }
    )
}
