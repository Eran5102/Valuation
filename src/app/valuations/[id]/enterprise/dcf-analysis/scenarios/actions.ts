'use server'

import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const ScenarioSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  type: z.enum(['Base', 'Optimistic', 'Pessimistic', 'Custom']),
  assumptions: z.object({
    revenueGrowthRate: z.number(),
    ebitdaMargin: z.number(),
    taxRate: z.number(),
    capexPercent: z.number(),
    workingCapitalPercent: z.number(),
    terminalGrowthRate: z.number(),
    discountRate: z.number(),
  }),
  projections: z
    .object({
      revenue: z.array(z.number()),
      ebitda: z.array(z.number()),
      depreciation: z.array(z.number()),
      ebit: z.array(z.number()),
      taxes: z.array(z.number()),
      capex: z.array(z.number()),
      workingCapitalChange: z.array(z.number()),
    })
    .optional(),
})

export async function getScenarios(valuationId: string) {
  try {
    const supabase = await createServerClient()

    const { data: scenarios, error } = await supabase
      .from('dcf_scenarios')
      .select('*')
      .eq('valuation_id', valuationId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching DCF scenarios:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        valuationId,
      })
      // Return empty array instead of throwing to prevent page crash
      return []
    }

    return scenarios || []
  } catch (err) {
    console.error('Unexpected error in getScenarios:', err)
    return []
  }
}

export async function createScenario(
  valuationId: string,
  scenario: z.infer<typeof ScenarioSchema>
) {
  const supabase = await createServerClient()

  // Validate input
  const validated = ScenarioSchema.parse(scenario)

  const { data, error } = await supabase
    .from('dcf_scenarios')
    .insert({
      valuation_id: valuationId,
      name: validated.name,
      description: validated.description,
      type: validated.type,
      assumptions: validated.assumptions,
      projections: validated.projections,
      is_active: false,
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath(`/valuations/${valuationId}/enterprise/dcf-analysis/scenarios`)
  return data
}

export async function updateScenario(
  valuationId: string,
  scenarioId: string,
  updates: Partial<z.infer<typeof ScenarioSchema>>
) {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('dcf_scenarios')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', scenarioId)
    .eq('valuation_id', valuationId)
    .select()
    .single()

  if (error) throw error

  revalidatePath(`/valuations/${valuationId}/enterprise/dcf-analysis/scenarios`)
  return data
}

export async function deleteScenario(valuationId: string, scenarioId: string) {
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('dcf_scenarios')
    .delete()
    .eq('id', scenarioId)
    .eq('valuation_id', valuationId)

  if (error) throw error

  revalidatePath(`/valuations/${valuationId}/enterprise/dcf-analysis/scenarios`)
  return { success: true }
}

export async function setActiveScenario(valuationId: string, scenarioId: string) {
  const supabase = await createServerClient()

  // First, deactivate all scenarios for this valuation
  await supabase.from('dcf_scenarios').update({ is_active: false }).eq('valuation_id', valuationId)

  // Then activate the selected scenario
  const { error } = await supabase
    .from('dcf_scenarios')
    .update({ is_active: true })
    .eq('id', scenarioId)
    .eq('valuation_id', valuationId)

  if (error) throw error

  revalidatePath(`/valuations/${valuationId}/enterprise/dcf-analysis/scenarios`)
  return { success: true }
}

export async function duplicateScenario(valuationId: string, scenarioId: string, newName: string) {
  const supabase = await createServerClient()

  // Fetch the original scenario
  const { data: original, error: fetchError } = await supabase
    .from('dcf_scenarios')
    .select('*')
    .eq('id', scenarioId)
    .eq('valuation_id', valuationId)
    .single()

  if (fetchError) throw fetchError

  // Create a duplicate with a new name
  const { data, error } = await supabase
    .from('dcf_scenarios')
    .insert({
      valuation_id: valuationId,
      name: newName,
      description: original.description,
      type: 'Custom',
      assumptions: original.assumptions,
      projections: original.projections,
      is_active: false,
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath(`/valuations/${valuationId}/enterprise/dcf-analysis/scenarios`)
  return data
}

export async function compareScenarios(valuationId: string, scenarioIds: string[]) {
  const supabase = await createServerClient()

  const { data: scenarios, error } = await supabase
    .from('dcf_scenarios')
    .select('*')
    .eq('valuation_id', valuationId)
    .in('id', scenarioIds)

  if (error) throw error

  // Calculate enterprise values for each scenario
  const comparisons = scenarios.map((scenario) => {
    // Simple EV calculation for comparison
    const projections = scenario.projections
    const assumptions = scenario.assumptions

    if (!projections || !assumptions) {
      return {
        id: scenario.id,
        name: scenario.name,
        enterpriseValue: 0,
        metrics: {},
      }
    }

    // Calculate free cash flows
    const fcf = projections.revenue.map((_, i) => {
      const ebit = projections.ebit[i] || 0
      const tax = projections.taxes[i] || 0
      const nopat = ebit - tax
      const depreciation = projections.depreciation[i] || 0
      const capex = projections.capex[i] || 0
      const nwcChange = projections.workingCapitalChange[i] || 0

      return nopat + depreciation - capex - nwcChange
    })

    // Simple DCF calculation
    const discountRate = assumptions.discountRate || 0.12
    const terminalGrowthRate = assumptions.terminalGrowthRate || 0.02

    const pvCashFlows = fcf.reduce((sum, cf, i) => {
      const discountFactor = 1 / Math.pow(1 + discountRate, i + 1)
      return sum + cf * discountFactor
    }, 0)

    const terminalValue =
      (fcf[fcf.length - 1] * (1 + terminalGrowthRate)) / (discountRate - terminalGrowthRate)
    const pvTerminalValue = terminalValue / Math.pow(1 + discountRate, fcf.length)

    const enterpriseValue = pvCashFlows + pvTerminalValue

    return {
      id: scenario.id,
      name: scenario.name,
      type: scenario.type,
      enterpriseValue,
      metrics: {
        revenueCAGR: assumptions.revenueGrowthRate,
        avgEbitdaMargin: assumptions.ebitdaMargin,
        discountRate: assumptions.discountRate * 100,
        terminalGrowthRate: assumptions.terminalGrowthRate * 100,
      },
    }
  })

  return comparisons
}
