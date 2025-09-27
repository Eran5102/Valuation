import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import ApiHandler from '@/lib/middleware/apiHandler'
import {
  CreateCompanySchema,
  PaginationSchema,
  validateRequest,
} from '@/lib/validation/api-schemas'

// GET /api/companies - Get all companies with pagination and filtering
export const GET = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)

    // Validate query parameters
    const queryParams = validateRequest(PaginationSchema, {
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      sort: searchParams.get('sort'),
      order: searchParams.get('order'),
    })

    const companyId = searchParams.get('company_id')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const offset = (queryParams.page - 1) * queryParams.limit

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

    // Build query
    let query = supabase.from('companies').select('*', { count: 'exact' })

    // Super admins see all companies, others see only their organization's
    if (!isSuperAdmin && organizationId) {
      query = query.eq('organization_id', organizationId)
    }

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
    const sortField = queryParams.sort || 'created_at'
    const ascending = queryParams.order === 'asc'
    query = query.order(sortField, { ascending }).range(offset, offset + queryParams.limit - 1)

    const { data: companies, error, count } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
    }

    return NextResponse.json({
      data: companies || [],
      pagination: {
        page: queryParams.page,
        limit: queryParams.limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / queryParams.limit),
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Validation failed:')) {
      return NextResponse.json(
        { error: 'Invalid query parameters', message: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
  }
}

// POST /api/companies - Create new company
export const POST = async (request: NextRequest) => {
  try {
    // Parse and validate request body
    const rawData = await request.json()
    const companyData = validateRequest(CreateCompanySchema, rawData)

    // Create Supabase client
    let supabase
    try {
      supabase = await createClient()
    } catch (clientError) {
      return NextResponse.json(
        {
          error: 'Database Connection Error',
          message: 'Unable to connect to database. Please check your environment variables.',
          details: process.env.NODE_ENV === 'development' ? String(clientError) : undefined,
        },
        { status: 500 }
      )
    }

    // Check if Supabase URL and key are configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        {
          error: 'Configuration Error',
          message:
            'Database configuration is missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables in Vercel.',
        },
        { status: 500 }
      )
    }

    // Check if company name already exists
    const { data: existingCompanies, error: checkError } = await supabase
      .from('companies')
      .select('name')
      .ilike('name', companyData.name)

    if (checkError) {
      return NextResponse.json(
        {
          error: 'Database Query Error',
          message: 'Failed to validate company name',
          details: process.env.NODE_ENV === 'development' ? checkError.message : undefined,
        },
        { status: 500 }
      )
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

    // Get current user and organization
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Get user's organization - REQUIRED for company creation
    let organizationId = null
    if (user) {
      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      organizationId = membership?.organization_id
    }

    // Check if user has an organization - required for creating companies
    if (!organizationId) {
      return NextResponse.json(
        {
          error: 'Organization Required',
          message:
            'You must be part of an organization to create companies. Please contact your administrator.',
        },
        { status: 403 }
      )
    }

    // Use service client to bypass RLS for company creation
    console.log('Creating company with organization_id:', organizationId)
    const serviceClient = await createServiceClient()

    // Create the company with all available fields and organization
    const { data: company, error: createError } = await serviceClient
      .from('companies')
      .insert({
        ...companyData,
        organization_id: organizationId,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (createError) {
      console.error('Failed to create company:', createError)
      return NextResponse.json(
        {
          error: 'Database Insert Error',
          message: 'Failed to create company',
          details: process.env.NODE_ENV === 'development' ? createError.message : undefined,
        },
        { status: 500 }
      )
    }

    if (!company) {
      return NextResponse.json(
        {
          error: 'Database Error',
          message: 'Company was created but could not be retrieved',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        data: company,
        message: 'Company created successfully',
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

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred while creating the company',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    )
  }
}
