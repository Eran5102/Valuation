import { NextRequest, NextResponse } from 'next/server'
import { dcfIntegrationService } from '@/lib/services/dcfIntegrationService'
import { DCFModelData, DCFCoreAssumptions } from '@/types/dcf'

// GET /api/valuations/[id]/dcf-model - Fetch entire DCF model
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: valuationId } = await params

    // Check cache first
    let modelData = dcfIntegrationService.getCachedModel(valuationId)

    if (!modelData) {
      // Fetch all component data in parallel
      const [
        assumptionsResponse,
        debtResponse,
        workingCapitalResponse,
        capexResponse,
        waccResponse,
      ] = await Promise.all([
        fetch(`${request.nextUrl.origin}/api/valuations/${valuationId}/assumptions`),
        fetch(`${request.nextUrl.origin}/api/valuations/${valuationId}/debt-schedule`),
        fetch(`${request.nextUrl.origin}/api/valuations/${valuationId}/working-capital`),
        fetch(`${request.nextUrl.origin}/api/valuations/${valuationId}/capex`),
        fetch(`${request.nextUrl.origin}/api/valuations/${valuationId}/wacc`),
      ])

      // Parse responses
      const assumptionsData = assumptionsResponse.ok ? await assumptionsResponse.json() : null
      const debtData = debtResponse.ok ? await debtResponse.json() : null
      const wcData = workingCapitalResponse.ok ? await workingCapitalResponse.json() : null
      const capexData = capexResponse.ok ? await capexResponse.json() : null
      const waccData = waccResponse.ok ? await waccResponse.json() : null

      // Create default assumptions if not found
      const assumptions: DCFCoreAssumptions = assumptionsData || {
        valuationDate: new Date().toISOString().split('T')[0],
        mostRecentFiscalYearEnd: new Date().toISOString().split('T')[0],
        currency: 'USD',
        discountingConvention: 'Mid-Year',
        historicalYears: 3,
        maxProjectionYears: 10,
        projectionYears: 5,
        baseYear: new Date().getFullYear(),

        // Tax configuration
        taxRate: 21,
        corporateTaxRate: 21,
        stateTaxRate: 5,
        effectiveTaxRate: 25.05,
        taxCalculationMethod: 'effective',

        // Financial parameters
        discountRate: 12,
        terminalGrowthRate: 2.5,
        cashBalance: 1000000,
        debtBalance: 5000000,

        // Calculation methods
        depreciationMethod: 'percentage',
        workingCapitalMethod: 'percentage',
        capexMethod: 'percentage',
        debtMethod: 'schedule',
        interestMethod: 'schedule',

        // Default percentages
        depreciationPercent: 3,
        capexPercent: 5,
        workingCapitalPercent: 10,
        maintenanceCapexPercent: 3,
        growthCapexPercent: 2,
      }

      // Integrate the model
      modelData = await dcfIntegrationService.integrateModel(valuationId, assumptions, {
        debt: debtData,
        workingCapital: wcData,
        capex: capexData,
        wacc: waccData,
      })
    }

    // Validate the model
    const validation = dcfIntegrationService.validateModel(modelData)

    return NextResponse.json({
      success: true,
      data: modelData,
      validation,
    })
  } catch (error) {
    console.error('Error fetching DCF model:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch DCF model',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// PUT /api/valuations/[id]/dcf-model - Update DCF model
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: valuationId } = await params
    const modelData: DCFModelData = await request.json()

    // Validate the model
    const validation = dcfIntegrationService.validateModel(modelData)

    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Model validation failed',
          validation,
        },
        { status: 400 }
      )
    }

    // Save components individually
    // In a real implementation, these would be database operations
    const savePromises = []

    // Save assumptions
    if (modelData.assumptions) {
      savePromises.push(
        fetch(`${request.nextUrl.origin}/api/valuations/${valuationId}/assumptions`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(modelData.assumptions),
        })
      )
    }

    // Save debt schedule
    if (modelData.debtSchedule) {
      savePromises.push(
        fetch(`${request.nextUrl.origin}/api/valuations/${valuationId}/debt-schedule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(modelData.debtSchedule),
        })
      )
    }

    // Save working capital
    if (modelData.workingCapital) {
      savePromises.push(
        fetch(`${request.nextUrl.origin}/api/valuations/${valuationId}/working-capital`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(modelData.workingCapital),
        })
      )
    }

    // Save capex
    if (modelData.capexDepreciation) {
      savePromises.push(
        fetch(`${request.nextUrl.origin}/api/valuations/${valuationId}/capex`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(modelData.capexDepreciation),
        })
      )
    }

    // Save financial statements
    if (modelData.financialStatements) {
      savePromises.push(
        fetch(`${request.nextUrl.origin}/api/valuations/${valuationId}/financials`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            statements: modelData.financialStatements,
            dcfSummary: modelData.dcfValuation,
          }),
        })
      )
    }

    // Execute all saves in parallel
    await Promise.all(savePromises)

    // Update cache
    dcfIntegrationService.clearCache(valuationId)

    return NextResponse.json({
      success: true,
      data: modelData,
      validation,
    })
  } catch (error) {
    console.error('Error saving DCF model:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save DCF model',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
