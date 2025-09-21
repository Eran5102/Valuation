import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/valuations/[id]/assumptions - Get valuation assumptions
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params
    const supabase = await createClient()

    const { data: valuation, error } = await supabase
      .from('valuations')
      .select('assumptions, updated_at')
      .eq('id', idParam)
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
    console.error('Error fetching assumptions:', error)
    return NextResponse.json({ error: 'Failed to fetch assumptions' }, { status: 500 })
  }
}

// PUT /api/valuations/[id]/assumptions - Update valuation assumptions
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params
    const body = await request.json()
    const { assumptions } = body

    // Validate the assumptions data - should be an array of categories
    if (!assumptions) {
      return NextResponse.json({ error: 'Invalid assumptions data' }, { status: 400 })
    }

    // Accept both array format (new) and object format (for backward compatibility)
    let assumptionsToSave = assumptions

    // If it's an object but not an array, we might be getting legacy format
    if (!Array.isArray(assumptions) && typeof assumptions === 'object') {
      // For now, we'll still save it but log a warning
      console.warn('Received assumptions in legacy object format, should be array of categories')
    }

    const supabase = await createClient()

    // Update the valuation with assumptions data
    const { data: valuation, error } = await supabase
      .from('valuations')
      .update({
        assumptions: assumptionsToSave,
        updated_at: new Date().toISOString(),
      })
      .eq('id', idParam)
      .select('assumptions, updated_at')
      .single()

    if (error || !valuation) {
      console.error('Error updating assumptions:', error)
      return NextResponse.json({ error: 'Valuation not found or update failed' }, { status: 404 })
    }

    console.log(
      `Assumptions updated for valuation ${idParam}:`,
      Array.isArray(assumptionsToSave) ? `${assumptionsToSave.length} categories` : 'legacy format'
    )

    return NextResponse.json({
      success: true,
      message: 'Assumptions saved successfully',
      assumptions: valuation.assumptions,
      updated_at: valuation.updated_at,
    })
  } catch (error) {
    console.error('Error updating assumptions:', error)
    return NextResponse.json({ error: 'Failed to update assumptions' }, { status: 500 })
  }
}
