'use server'

import { calculateWACC, findOptimalCapitalStructure, WACCInputs } from '@/lib/calculations/wacc'
import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const PeerCompanySchema = z.object({
  name: z.string().min(1),
  leveredBeta: z.number().min(0),
  debtToEquity: z.number().min(0),
  taxRate: z.number().min(0).max(1),
})

const WACCDataSchema = z.object({
  peerCompanies: z.array(PeerCompanySchema),
  targetDebtToEquity: z.number().min(0),
  targetTaxRate: z.number().min(0).max(1),
  riskFreeRate: z.number(),
  equityRiskPremium: z.number(),
  sizePremium: z.number(),
  countryRiskPremium: z.number(),
  companySpecificPremium: z.number(),
  preTaxCostOfDebt: z.number(),
  debtTaxRate: z.number().min(0).max(1),
  debtWeight: z.number().min(0).max(1),
})

export async function getWACCData(valuationId: string) {
  const supabase = await createServerClient()

  // Fetch WACC data
  const { data: waccData } = await supabase
    .from('wacc_calculations')
    .select('*')
    .eq('valuation_id', valuationId)
    .single()

  // Fetch peer companies
  const { data: peers } = await supabase
    .from('wacc_peer_companies')
    .select('*')
    .eq('valuation_id', valuationId)
    .order('created_at', { ascending: true })

  // Get core assumptions for tax rate
  const { data: assumptions } = await supabase
    .from('core_assumptions')
    .select('tax_rate')
    .eq('valuation_id', valuationId)
    .single()

  const taxRate = assumptions?.tax_rate || 0.21

  return {
    waccData: waccData?.data || {
      targetDebtToEquity: 0.4,
      targetTaxRate: taxRate,
      riskFreeRate: 0.025,
      equityRiskPremium: 0.055,
      sizePremium: 0,
      countryRiskPremium: 0,
      companySpecificPremium: 0,
      preTaxCostOfDebt: 0.05,
      debtTaxRate: taxRate,
      debtWeight: 0.3,
      equityWeight: 0.7,
    },
    peerCompanies: peers || [],
    calculatedWACC: waccData?.calculated_wacc || null,
    lastUpdated: waccData?.updated_at || null,
  }
}

export async function saveWACCData(valuationId: string, data: z.infer<typeof WACCDataSchema>) {
  const supabase = await createServerClient()

  // Validate data
  const validated = WACCDataSchema.parse(data)

  // Calculate WACC
  const equityWeight = 1 - validated.debtWeight
  const waccInputs: WACCInputs = {
    ...validated,
    equityWeight,
  }
  const results = calculateWACC(waccInputs)

  // Save WACC data
  const { error: waccError } = await supabase.from('wacc_calculations').upsert({
    valuation_id: valuationId,
    data: validated,
    calculated_wacc: results.wacc,
    cost_of_equity: results.costOfEquity,
    after_tax_cost_of_debt: results.afterTaxCostOfDebt,
    unlevered_beta: results.unleveredBeta,
    relevered_beta: results.releveredBeta,
    updated_at: new Date().toISOString(),
  })

  if (waccError) throw waccError

  // Update DCF settings with new WACC
  await supabase
    .from('dcf_settings')
    .update({
      discount_rate: results.wacc,
      updated_at: new Date().toISOString(),
    })
    .eq('valuation_id', valuationId)

  revalidatePath(`/valuations/${valuationId}/enterprise/dcf-analysis/wacc`)
  return { success: true, results }
}

export async function addPeerCompany(
  valuationId: string,
  peerCompany: z.infer<typeof PeerCompanySchema>
) {
  const supabase = await createServerClient()

  // Validate
  const validated = PeerCompanySchema.parse(peerCompany)

  const { data, error } = await supabase
    .from('wacc_peer_companies')
    .insert({
      valuation_id: valuationId,
      ...validated,
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath(`/valuations/${valuationId}/enterprise/dcf-analysis/wacc`)
  return data
}

export async function updatePeerCompany(
  valuationId: string,
  peerId: string,
  updates: Partial<z.infer<typeof PeerCompanySchema>>
) {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('wacc_peer_companies')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', peerId)
    .eq('valuation_id', valuationId)
    .select()
    .single()

  if (error) throw error

  revalidatePath(`/valuations/${valuationId}/enterprise/dcf-analysis/wacc`)
  return data
}

export async function deletePeerCompany(valuationId: string, peerId: string) {
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('wacc_peer_companies')
    .delete()
    .eq('id', peerId)
    .eq('valuation_id', valuationId)

  if (error) throw error

  revalidatePath(`/valuations/${valuationId}/enterprise/dcf-analysis/wacc`)
  return { success: true }
}

export async function calculateOptimalStructure(
  valuationId: string,
  baseInputs: Omit<WACCInputs, 'debtWeight' | 'equityWeight' | 'targetDebtToEquity'>
) {
  // Calculate optimal capital structure
  const results = findOptimalCapitalStructure(baseInputs)

  // Find the structure with minimum WACC
  const optimal = results.reduce((min, current) => (current.wacc < min.wacc ? current : min))

  return {
    optimalDebtRatio: optimal.debtRatio,
    optimalWACC: optimal.wacc,
    allResults: results,
  }
}

export async function importPeerBetas(source: 'Bloomberg' | 'CapitalIQ' | 'Manual') {
  // Mock function for importing peer betas from external sources
  // In production, this would connect to actual data providers

  const mockPeers = {
    Bloomberg: [
      { name: 'Company A', leveredBeta: 1.2, debtToEquity: 0.3, taxRate: 0.21 },
      { name: 'Company B', leveredBeta: 0.9, debtToEquity: 0.5, taxRate: 0.25 },
      { name: 'Company C', leveredBeta: 1.1, debtToEquity: 0.4, taxRate: 0.22 },
    ],
    CapitalIQ: [
      { name: 'Peer X', leveredBeta: 1.15, debtToEquity: 0.35, taxRate: 0.23 },
      { name: 'Peer Y', leveredBeta: 0.95, debtToEquity: 0.45, taxRate: 0.2 },
    ],
    Manual: [],
  }

  return mockPeers[source]
}
