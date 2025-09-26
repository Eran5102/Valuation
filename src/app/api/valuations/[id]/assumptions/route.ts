import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  IdParamSchema,
  UpdateAssumptionsSchema,
  validateRequest,
} from '@/lib/validation/api-schemas'

// GET /api/valuations/[id]/assumptions - Get valuation assumptions
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params

    // Validate ID parameter
    const { id } = validateRequest(IdParamSchema, { id: idParam })

    const supabase = await createClient()

    const { data: valuation, error } = await supabase
      .from('valuations')
      .select('assumptions, updated_at')
      .eq('id', id)
      .single()

    if (error || !valuation) {
      return NextResponse.json({ error: 'Valuation not found' }, { status: 404 })
    }

    // Return assumptions as categories array if they exist
    // Handle both array format (new) and object format (legacy)
    let assumptionCategories = []

    if (valuation.assumptions) {
      if (Array.isArray(valuation.assumptions)) {
        assumptionCategories = valuation.assumptions
      } else if (
        typeof valuation.assumptions === 'object' &&
        Object.keys(valuation.assumptions).length > 0
      ) {
        // Legacy format - could be converted but for now just return empty
        assumptionCategories = []
      }
    }

    return NextResponse.json({
      assumptions: assumptionCategories,
      updated_at: valuation.updated_at,
    })
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Validation failed:')) {
      return NextResponse.json(
        { error: 'Invalid valuation ID', message: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Failed to fetch assumptions' }, { status: 500 })
  }
}

// PUT /api/valuations/[id]/assumptions - Update valuation assumptions
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params

    // Validate ID parameter
    const { id } = validateRequest(IdParamSchema, { id: idParam })

    // Parse and validate request body
    const rawData = await request.json()
    const { assumptions } = validateRequest(UpdateAssumptionsSchema, rawData)

    const supabase = await createClient()

    // Update the valuation with assumptions data
    const { data: valuation, error } = await supabase
      .from('valuations')
      .update({
        assumptions: assumptions,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('assumptions, updated_at')
      .single()

    if (error || !valuation) {
      return NextResponse.json({ error: 'Valuation not found or update failed' }, { status: 404 })
    }


    return NextResponse.json({
      success: true,
      message: 'Assumptions saved successfully',
      assumptions: valuation.assumptions,
      updated_at: valuation.updated_at,
    })
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Validation failed:')) {
      return NextResponse.json(
        { error: 'Validation Error', message: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Failed to update assumptions' }, { status: 500 })
  }
}
