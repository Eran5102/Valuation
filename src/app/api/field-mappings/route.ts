import { NextRequest, NextResponse } from 'next/server'
import { TemplateDataMapper } from '@/lib/templates/templateDataMapper'
import {
  FieldMappingSchema,
  validateRequest,
} from '@/lib/validation/api-schemas'

export async function GET() {
  try {
    const mapper = TemplateDataMapper.getInstance()
    const fieldMappings = mapper.getFieldMappings()

    return NextResponse.json({
      success: true,
      data: fieldMappings,
      count: Object.keys(fieldMappings).length,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to get field mappings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawData = await request.json()
    const { fieldId, mapping } = rawData

    if (!fieldId || typeof fieldId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'fieldId is required and must be a string' },
        { status: 400 }
      )
    }

    // Validate mapping structure using Zod schema
    const validatedMapping = validateRequest(FieldMappingSchema, mapping)

    const mapper = TemplateDataMapper.getInstance()
    mapper.registerFieldMapping(fieldId, validatedMapping)

    return NextResponse.json({
      success: true,
      message: `Field mapping '${fieldId}' added successfully`,
      data: { fieldId, mapping: validatedMapping },
    })
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Validation failed:')) {
      return NextResponse.json(
        { success: false, error: 'Validation Error', message: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to add field mapping' },
      { status: 500 }
    )
  }
}
