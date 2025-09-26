import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  enhanceShareClassesWithCalculations,
  enhanceShareClassWithCalculations,
  validateShareClass,
} from '@/lib/capTableCalculations'
import {
  IdParamSchema,
  UpdateCapTableSchema,
  validateRequest,
} from '@/lib/validation/api-schemas'

// GET /api/valuations/[id]/cap-table - Get valuation cap table data
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params

    // Validate ID parameter
    const { id } = validateRequest(IdParamSchema, { id: idParam })

    const supabase = await createClient()

    const { data: valuation, error } = await supabase
      .from('valuations')
      .select('cap_table, updated_at, company_id')
      .eq('id', id)
      .single()

    if (error || !valuation) {
      return NextResponse.json({ error: 'Valuation not found' }, { status: 404 })
    }

    // Get cap table data from the valuation
    let shareClasses: any[] = []
    let options: any[] = []

    if (valuation.cap_table) {
      // Use cap table data from the valuation
      shareClasses = enhanceShareClassesWithCalculations(valuation.cap_table.shareClasses || [])
      options = valuation.cap_table.options || []
    }

    const capTableData = {
      shareClasses,
      options,
      updated_at: valuation.updated_at,
    }

    return NextResponse.json(capTableData)
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Validation failed:')) {
      return NextResponse.json(
        { error: 'Invalid valuation ID', message: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Failed to fetch cap table data' }, { status: 500 })
  }
}

// PUT /api/valuations/[id]/cap-table - Update valuation cap table data
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params

    // Validate ID parameter
    const { id } = validateRequest(IdParamSchema, { id: idParam })

    // Parse and validate request body
    const rawData = await request.json()
    const { shareClasses, options } = validateRequest(UpdateCapTableSchema, rawData)

    const supabase = await createClient()

    // First get the valuation to obtain companyId
    const { data: valuation, error: fetchError } = await supabase
      .from('valuations')
      .select('company_id')
      .eq('id', id)
      .single()

    if (fetchError || !valuation) {
      return NextResponse.json({ error: 'Valuation not found' }, { status: 404 })
    }

    // Add companyId to each shareClass
    const shareClassesWithCompanyId = shareClasses.map(shareClass => ({
      ...shareClass,
      companyId: valuation.company_id
    }))

    // Validate each share class
    const validationErrors: string[] = []
    shareClassesWithCompanyId.forEach((shareClass, index) => {
      const errors = validateShareClass(shareClass)
      if (errors.length > 0) {
        validationErrors.push(`Share class ${index + 1}: ${errors.join(', ')}`)
      }
    })

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationErrors,
        },
        { status: 400 }
      )
    }

    // Enhance share classes with calculated fields before saving
    const enhancedShareClasses = enhanceShareClassesWithCalculations(shareClassesWithCompanyId)

    // Update the valuation with cap table data
    const { data: updatedValuation, error } = await supabase
      .from('valuations')
      .update({
        cap_table: {
          shareClasses: enhancedShareClasses,
          options,
          updated_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('cap_table')
      .single()

    if (error || !updatedValuation) {
      return NextResponse.json({ error: 'Valuation not found or update failed' }, { status: 404 })
    }


    return NextResponse.json({
      success: true,
      message: 'Cap table data saved successfully',
      cap_table: updatedValuation.cap_table,
    })
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Validation failed:')) {
      return NextResponse.json(
        { error: 'Validation Error', message: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Failed to update cap table data' }, { status: 500 })
  }
}
