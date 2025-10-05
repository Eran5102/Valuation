'use server'

import { createServerClient } from '@/lib/supabase/server'

/**
 * Get consolidated assumptions for OPM
 * Fetches from valuation_assumptions table (new format) with fallback to old assumptions column
 */
export async function getOPMAssumptions(valuationId: string) {
  try {
    const supabase = await createServerClient()

    // Fetch from new valuation_assumptions table
    const { data: newAssumptions, error: newError } = await supabase
      .from('valuation_assumptions')
      .select('*')
      .eq('valuation_id', valuationId)
      .single()

    // If found in new table, return it (in flat format)
    if (newAssumptions && !newError) {
      console.log('[getOPMAssumptions] Loaded from valuation_assumptions table:', newAssumptions)
      // Remove metadata fields
      const { id, valuation_id, created_at, updated_at, ...assumptionsData } = newAssumptions
      return { success: true, data: assumptionsData, source: 'valuation_assumptions' }
    }

    // Fallback: fetch from old assumptions column
    const { data: valuation, error: valuationError } = await supabase
      .from('valuations')
      .select('assumptions')
      .eq('id', valuationId)
      .single()

    if (valuationError || !valuation) {
      console.error('[getOPMAssumptions] Failed to fetch assumptions:', valuationError)
      return { success: false, error: 'Failed to fetch assumptions', data: null, source: null }
    }

    console.log(
      '[getOPMAssumptions] Loaded from valuations.assumptions column:',
      valuation.assumptions
    )
    return { success: true, data: valuation.assumptions, source: 'valuations.assumptions' }
  } catch (error) {
    console.error('[getOPMAssumptions] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null,
      source: null,
    }
  }
}
