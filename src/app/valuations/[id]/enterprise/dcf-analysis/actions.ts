'use server'

import {
  calculateDCF,
  calculateDCFSensitivity,
  calculateImpliedSharePrice,
  DCFInputs,
} from '@/lib/calculations/dcf'
import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

// Validation schema for DCF inputs
const DCFInputSchema = z.object({
  cashFlows: z.array(z.number()),
  discountRate: z.number().min(0).max(1),
  discountingConvention: z.enum(['Mid-Year', 'End-Year']),
  terminalValueMethod: z.enum(['PGM', 'Exit Multiple']),
  terminalGrowthRate: z.number().optional(),
  exitMultiple: z.number().optional(),
  terminalMetric: z.number().optional(),
})

// Projection data schema
const ProjectionSchema = z.object({
  revenue: z.array(z.number()),
  ebitda: z.array(z.number()),
  depreciation: z.array(z.number()),
  ebit: z.array(z.number()),
  taxes: z.array(z.number()),
  capex: z.array(z.number()),
  workingCapitalChange: z.array(z.number()),
})

export async function getDCFData(valuationId: string) {
  const supabase = await createServerClient()

  // Fetch DCF projections and settings
  const { data: projections, error: projError } = await supabase
    .from('dcf_projections')
    .select('*')
    .eq('valuation_id', valuationId)
    .single()

  const { data: settings, error: settingsError } = await supabase
    .from('dcf_settings')
    .select('*')
    .eq('valuation_id', valuationId)
    .single()

  const { data: shares, error: sharesError } = await supabase
    .from('share_structures')
    .select('*')
    .eq('valuation_id', valuationId)

  // Calculate total shares outstanding
  const totalShares = shares?.reduce((sum, share) => sum + (share.shares || 0), 0) || 0

  // Return default data if not found
  if (!projections) {
    return {
      projections: {
        revenue: [0, 0, 0, 0, 0],
        ebitda: [0, 0, 0, 0, 0],
        depreciation: [0, 0, 0, 0, 0],
        ebit: [0, 0, 0, 0, 0],
        taxes: [0, 0, 0, 0, 0],
        capex: [0, 0, 0, 0, 0],
        workingCapitalChange: [0, 0, 0, 0, 0],
      },
      settings: {
        discountRate: 0.12,
        terminalGrowthRate: 0.02,
        terminalValueMethod: 'PGM' as const,
        exitMultiple: 8,
        discountingConvention: 'Mid-Year' as const,
        forecastPeriod: 5,
        taxRate: 0.21,
      },
      balanceSheet: {
        cashBalance: 0,
        debtBalance: 0,
      },
      sharesOutstanding: totalShares,
    }
  }

  return {
    projections: projections.data || {
      revenue: [0, 0, 0, 0, 0],
      ebitda: [0, 0, 0, 0, 0],
      depreciation: [0, 0, 0, 0, 0],
      ebit: [0, 0, 0, 0, 0],
      taxes: [0, 0, 0, 0, 0],
      capex: [0, 0, 0, 0, 0],
      workingCapitalChange: [0, 0, 0, 0, 0],
    },
    settings: settings?.data || {
      discountRate: 0.12,
      terminalGrowthRate: 0.02,
      terminalValueMethod: 'PGM' as const,
      exitMultiple: 8,
      discountingConvention: 'Mid-Year' as const,
      forecastPeriod: 5,
      taxRate: 0.21,
    },
    balanceSheet: {
      cashBalance: settings?.cash_balance || 0,
      debtBalance: settings?.debt_balance || 0,
    },
    sharesOutstanding: totalShares,
  }
}

export async function saveDCFProjections(
  valuationId: string,
  projections: z.infer<typeof ProjectionSchema>
) {
  const supabase = await createServerClient()

  // Validate input
  const validated = ProjectionSchema.parse(projections)

  // Upsert projections
  const { error } = await supabase.from('dcf_projections').upsert({
    valuation_id: valuationId,
    data: validated,
    updated_at: new Date().toISOString(),
  })

  if (error) throw error

  revalidatePath(`/valuations/${valuationId}/enterprise/dcf-analysis`)
  return { success: true }
}

export async function saveDCFSettings(
  valuationId: string,
  settings: {
    discountRate: number
    terminalGrowthRate: number
    terminalValueMethod: 'PGM' | 'Exit Multiple'
    exitMultiple?: number
    discountingConvention: 'Mid-Year' | 'End-Year'
    forecastPeriod: number
    taxRate: number
  }
) {
  const supabase = await createServerClient()

  const { error } = await supabase.from('dcf_settings').upsert({
    valuation_id: valuationId,
    data: settings,
    updated_at: new Date().toISOString(),
  })

  if (error) throw error

  revalidatePath(`/valuations/${valuationId}/enterprise/dcf-analysis`)
  return { success: true }
}

export async function runDCFCalculation(
  valuationId: string,
  inputs: {
    projections: z.infer<typeof ProjectionSchema>
    settings: {
      discountRate: number
      terminalGrowthRate: number
      terminalValueMethod: 'PGM' | 'Exit Multiple'
      exitMultiple?: number
      discountingConvention: 'Mid-Year' | 'End-Year'
    }
  }
) {
  // Calculate free cash flows from projections
  const cashFlows = inputs.projections.ebit.map((ebit, i) => {
    const nopat = ebit - inputs.projections.taxes[i]
    const fcf =
      nopat +
      inputs.projections.depreciation[i] -
      inputs.projections.capex[i] -
      inputs.projections.workingCapitalChange[i]
    return fcf
  })

  // Prepare DCF inputs
  const dcfInputs: DCFInputs = {
    cashFlows,
    discountRate: inputs.settings.discountRate,
    discountingConvention: inputs.settings.discountingConvention,
    terminalValueMethod: inputs.settings.terminalValueMethod,
    terminalGrowthRate: inputs.settings.terminalGrowthRate,
    exitMultiple: inputs.settings.exitMultiple,
    terminalMetric:
      inputs.settings.terminalValueMethod === 'Exit Multiple'
        ? inputs.projections.ebitda[inputs.projections.ebitda.length - 1]
        : undefined,
    valuationDate: new Date(),
    firstProjectionDate: new Date(),
  }

  // Run DCF calculation on server
  const results = calculateDCF(dcfInputs)

  // Save results to database
  const supabase = await createServerClient()
  await supabase.from('dcf_results').upsert({
    valuation_id: valuationId,
    enterprise_value: results.enterpriseValue,
    terminal_value: results.terminalValue,
    pv_cash_flows: results.presentValueOfCashFlows,
    pv_terminal_value: results.presentValueOfTerminalValue,
    discount_factors: results.discountFactors,
    discounted_cash_flows: results.discountedCashFlows,
    calculated_at: new Date().toISOString(),
  })

  return results
}

export async function runSensitivityAnalysis(
  valuationId: string,
  baseInputs: {
    projections: z.infer<typeof ProjectionSchema>
    settings: {
      discountRate: number
      terminalGrowthRate: number
      terminalValueMethod: 'PGM' | 'Exit Multiple'
      exitMultiple?: number
      discountingConvention: 'Mid-Year' | 'End-Year'
    }
  },
  discountRateRange: number[],
  growthRateRange: number[]
) {
  // Calculate base case cash flows
  const cashFlows = baseInputs.projections.ebit.map((ebit, i) => {
    const nopat = ebit - baseInputs.projections.taxes[i]
    const fcf =
      nopat +
      baseInputs.projections.depreciation[i] -
      baseInputs.projections.capex[i] -
      baseInputs.projections.workingCapitalChange[i]
    return fcf
  })

  const dcfInputs: DCFInputs = {
    cashFlows,
    discountRate: baseInputs.settings.discountRate,
    discountingConvention: baseInputs.settings.discountingConvention,
    terminalValueMethod: baseInputs.settings.terminalValueMethod,
    terminalGrowthRate: baseInputs.settings.terminalGrowthRate,
    exitMultiple: baseInputs.settings.exitMultiple,
    terminalMetric:
      baseInputs.settings.terminalValueMethod === 'Exit Multiple'
        ? baseInputs.projections.ebitda[baseInputs.projections.ebitda.length - 1]
        : undefined,
    valuationDate: new Date(),
    firstProjectionDate: new Date(),
  }

  const results = calculateDCFSensitivity(dcfInputs, discountRateRange, growthRateRange)

  return results
}
