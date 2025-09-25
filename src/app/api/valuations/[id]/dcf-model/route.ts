import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get valuation data
    const { data: valuation, error: valError } = await supabase
      .from('valuations')
      .select('*')
      .eq('id', id)
      .single()

    if (valError || !valuation) {
      // Return default DCF model structure if valuation doesn't exist yet
      return NextResponse.json({
        valuationId: id,
        assumptions: {
          projectionYears: 5,
          baseYear: new Date().getFullYear(),
          historicalYears: 3,
          discountRate: 0.1,
          discountingConvention: 'Mid-Year',
          effectiveTaxRate: 25,
          terminalGrowthRate: 3,
          exitMultiple: 8,
          workingCapitalMethod: 'days',
          daysReceivables: 45,
          daysPayables: 30,
          daysInventory: 60,
          targetNWCPercent: 15,
          capexMethod: 'percentage',
          capexPercent: 5,
          maintenanceCapexPercent: 3,
          growthCapexPercent: 2,
          depreciationMethod: 'percentage',
          depreciationPercent: 5,
        },
        historicalData: null,
        debtSchedule: null,
        workingCapital: null,
        capexDepreciation: null,
        wacc: null,
        financialStatements: null,
        dcfValuation: null,
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      })
    }

    // Get DCF model data
    const { data: dcfModel } = await supabase
      .from('dcf_models')
      .select('*')
      .eq('valuation_id', id)
      .single()

    if (dcfModel) {
      return NextResponse.json(dcfModel)
    }

    // Return default structure if no DCF model exists
    return NextResponse.json({
      valuationId: id,
      assumptions: {
        projectionYears: 5,
        baseYear: new Date().getFullYear(),
        historicalYears: 3,
        discountRate: 0.1,
        discountingConvention: 'Mid-Year',
        effectiveTaxRate: 25,
        terminalGrowthRate: 3,
        exitMultiple: 8,
        workingCapitalMethod: 'days',
        daysReceivables: 45,
        daysPayables: 30,
        daysInventory: 60,
        targetNWCPercent: 15,
        capexMethod: 'percentage',
        capexPercent: 5,
        maintenanceCapexPercent: 3,
        growthCapexPercent: 2,
        depreciationMethod: 'percentage',
        depreciationPercent: 5,
      },
      historicalData: null,
      debtSchedule: null,
      workingCapital: null,
      capexDepreciation: null,
      wacc: null,
      financialStatements: null,
      dcfValuation: null,
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching DCF model:', error)
    return NextResponse.json({ error: 'Failed to fetch DCF model' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const supabase = await createClient()

    // Check if DCF model exists
    const { data: existingModel } = await supabase
      .from('dcf_models')
      .select('id')
      .eq('valuation_id', id)
      .single()

    const modelData = {
      valuation_id: id,
      ...body,
      updated_at: new Date().toISOString(),
    }

    if (existingModel) {
      // Update existing model
      const { data, error } = await supabase
        .from('dcf_models')
        .update(modelData)
        .eq('valuation_id', id)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json(data)
    } else {
      // Create new model
      const { data, error } = await supabase
        .from('dcf_models')
        .insert({
          ...modelData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      return NextResponse.json(data)
    }
  } catch (error) {
    console.error('Error saving DCF model:', error)
    return NextResponse.json({ error: 'Failed to save DCF model' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return POST(request, { params })
}
