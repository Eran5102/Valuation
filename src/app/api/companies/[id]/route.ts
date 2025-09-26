import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  IdParamSchema,
  UpdateCompanySchema,
  validateRequest,
} from '@/lib/validation/api-schemas'

// GET /api/companies/[id] - Get company by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params

    // Validate ID parameter
    const { id } = validateRequest(IdParamSchema, { id: idParam })

    const supabase = await createClient()

    const { data: company, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    return NextResponse.json(company)
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Validation failed:')) {
      return NextResponse.json(
        { error: 'Invalid company ID', message: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Failed to fetch company' }, { status: 500 })
  }
}

// PATCH /api/companies/[id] - Update company (including status)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params

    // Validate ID parameter
    const { id } = validateRequest(IdParamSchema, { id: idParam })

    // Parse and validate request body
    const rawData = await request.json()
    const updateData = validateRequest(UpdateCompanySchema, rawData)

    const supabase = await createClient()

    // Update with all provided fields
    const { data: company, error } = await supabase
      .from('companies')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error || !company) {
      return NextResponse.json({ error: 'Company not found or update failed' }, { status: 404 })
    }

    return NextResponse.json(company)
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Validation failed:')) {
      return NextResponse.json(
        { error: 'Validation Error', message: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Failed to update company' }, { status: 500 })
  }
}

// DELETE /api/companies/[id] - Delete company
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params

    // Validate ID parameter
    const { id } = validateRequest(IdParamSchema, { id: idParam })

    const supabase = await createClient()

    const { error } = await supabase.from('companies').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: 'Company not found or delete failed' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Company deleted successfully' })
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Validation failed:')) {
      return NextResponse.json(
        { error: 'Invalid company ID', message: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Failed to delete company' }, { status: 500 })
  }
}
