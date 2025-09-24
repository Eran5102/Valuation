import { NextRequest, NextResponse } from 'next/server'
import { dcfIntegrationService } from '@/lib/services/dcfIntegrationService'
import { DCFCoreAssumptions } from '@/types/dcf'

// POST /api/valuations/[id]/dcf-model/calculate - Recalculate DCF model
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: valuationId } = await params
    const body = await request.json()

    // Extract components from request
    const { assumptions, debtSchedule, workingCapital, capexDepreciation, wacc } = body

    // Validate assumptions
    if (!assumptions) {
      return NextResponse.json(
        {
          success: false,
          error: 'Core assumptions are required for calculation',
        },
        { status: 400 }
      )
    }

    // Recalculate the integrated model
    const modelData = await dcfIntegrationService.integrateModel(
      valuationId,
      assumptions as DCFCoreAssumptions,
      {
        debt: debtSchedule,
        workingCapital,
        capex: capexDepreciation,
        wacc,
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
    console.error('Error calculating DCF model:', error)
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
