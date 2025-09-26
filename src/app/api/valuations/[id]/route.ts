import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  IdParamSchema,
  UpdateValuationSchema,
  validateRequest,
} from '@/lib/validation/api-schemas'

// GET /api/valuations/[id] - Get single valuation
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params

    // Validate ID parameter
    const { id } = validateRequest(IdParamSchema, { id: idParam })

    const supabase = await createClient()

    const { data: valuation, error } = await supabase
      .from('valuations')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !valuation) {
      return NextResponse.json({ error: 'Valuation not found' }, { status: 404 })
    }

    return NextResponse.json(valuation)
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Validation failed:')) {
      return NextResponse.json(
        { error: 'Invalid valuation ID', message: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Failed to fetch valuation' }, { status: 500 })
  }
}

// PATCH /api/valuations/[id] - Update valuation (including status)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params

    // Validate ID parameter
    const { id } = validateRequest(IdParamSchema, { id: idParam })

    // Parse and validate request body
    const rawData = await request.json()
    const updateData = validateRequest(UpdateValuationSchema, rawData)

    const supabase = await createClient()

    const { data: valuation, error } = await supabase
      .from('valuations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error || !valuation) {
      return NextResponse.json({ error: 'Valuation not found' }, { status: 404 })
    }

    return NextResponse.json(valuation)
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Validation failed:')) {
      return NextResponse.json(
        { error: 'Validation Error', message: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Failed to update valuation' }, { status: 500 })
  }
}

// PUT /api/valuations/[id] - Update valuation
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params

    // Validate ID parameter
    const { id } = validateRequest(IdParamSchema, { id: idParam })

    // Parse and validate request body
    const rawData = await request.json()
    const updateData = validateRequest(UpdateValuationSchema, rawData)

    const supabase = await createClient()

    const { data: valuation, error } = await supabase
      .from('valuations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error || !valuation) {
      return NextResponse.json({ error: 'Valuation not found' }, { status: 404 })
    }

    return NextResponse.json(valuation)
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Validation failed:')) {
      return NextResponse.json(
        { error: 'Validation Error', message: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Failed to update valuation' }, { status: 500 })
  }
}

// DELETE /api/valuations/[id] - Delete valuation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params

    // Validate ID parameter
    const { id } = validateRequest(IdParamSchema, { id: idParam })

    const supabase = await createClient()

    const { error } = await supabase.from('valuations').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: 'Valuation not found or delete failed' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Valuation deleted successfully' })
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Validation failed:')) {
      return NextResponse.json(
        { error: 'Invalid valuation ID', message: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Failed to delete valuation' }, { status: 500 })
  }
}
