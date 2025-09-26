import { NextRequest, NextResponse } from 'next/server'
import { dcfIntegrationService } from '@/lib/services/dcfIntegrationService'
import { DCFCoreAssumptions } from '@/types/dcf'
import {
  IdParamSchema,
  DCFCalculateSchema,
  validateRequest,
} from '@/lib/validation/api-schemas'

// POST /api/valuations/[id]/dcf-model/calculate - Recalculate DCF model
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params

    // Validate ID parameter
    const { id: valuationId } = validateRequest(IdParamSchema, { id: idParam })

    // Parse and validate request body
    const rawData = await request.json()
    const validatedData = validateRequest(DCFCalculateSchema, rawData)

    // Extract components from validated request
    const { assumptions, historicalData, useScheduleData } = validatedData

    // Recalculate the integrated model
    const modelData = await dcfIntegrationService.integrateModel(
      valuationId,
      assumptions as DCFCoreAssumptions,
      {
        debt: undefined, // These would come from the request body if needed
        workingCapital: undefined,
        capex: undefined,
        wacc: undefined,
      }
    )

    // Validate the recalculated model
    const validation = dcfIntegrationService.validateModel(modelData)

    return NextResponse.json({
      success: true,
      data: modelData,
      validation,
    })
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Validation failed:')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation Error',
          details: error.message,
        },
        { status: 400 }
      )
    }
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to calculate DCF model',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
