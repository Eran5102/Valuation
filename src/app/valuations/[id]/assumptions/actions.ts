'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ConsolidatedAssumptions {
  company_name?: string
  company_address?: string
  state_incorporation?: string
  incorporation_date?: string
  industry?: string
  company_stage?: string
  valuation_date?: string
  fiscal_year_end?: string
  currency?: string
  discounting_convention?: string
  report_date?: string
  valuation_purpose?: string
  standard_of_value?: string
  premise_of_value?: string
  appraiser_name?: string
  appraiser_firm?: string
  appraiser_credentials?: string
  appraiser_phone?: string
  appraiser_email?: string
  historical_years?: number
  projection_years?: number
  risk_free_rate?: number
  equity_volatility?: number
  time_to_liquidity?: number
  last_financing_date?: string
  last_financing_amount?: number
  last_financing_valuation?: number
  last_financing_type?: string

  // Missing properties from ValuationAssumptionsConsolidated
  subject_security?: string
  designee_prefix?: string
  designee_first_name?: string
  designee_last_name?: string
  designee_title?: string
  engagement_letter_date?: string
  company_description?: string
  products_services?: string
  industry_description?: string
  stage_description?: string
  management_team?: Array<{
    name: string
    title: string
    bio?: string
  }>
  key_investors?: Array<{
    name: string
    type: string
    investment_amount?: number
  }>
}

export async function getAssumptions(valuationId: string) {
  const supabase = await createServerClient()

  // Fetch from valuation_assumptions table
  const { data, error } = await supabase
    .from('valuation_assumptions')
    .select('*')
    .eq('valuation_id', valuationId)
    .single()

  if (error && error.code !== 'PGRST116') {
    return null
  }

  return data as ConsolidatedAssumptions
}

export async function saveAssumptions(valuationId: string, assumptions: ConsolidatedAssumptions) {
  const supabase = await createServerClient()

  // Upsert assumptions
  const { error } = await supabase.from('valuation_assumptions').upsert({
    valuation_id: valuationId,
    ...assumptions,
    updated_at: new Date().toISOString(),
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/valuations/${valuationId}/assumptions`)
  return { success: true }
}

export async function getValuationData(valuationId: string) {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('valuations')
    .select('*')
    .eq('id', valuationId)
    .single()

  if (error) {
    return null
  }

  return data
}
