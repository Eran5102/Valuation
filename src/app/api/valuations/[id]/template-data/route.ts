import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TemplateDataMapper } from '@/lib/templates/templateDataMapper'
import { dlomCalculationService } from '@/services/dlomCalculations'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params
    const supabase = await createClient()

    // Fetch valuation data from Supabase
    const { data: valuation, error: valError } = await supabase
      .from('valuations')
      .select('*')
      .eq('id', idParam)
      .single()

    if (valError || !valuation) {
      return NextResponse.json({ error: 'Valuation not found' }, { status: 404 })
    }

    // Fetch company data from Supabase
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', valuation.company_id)
      .single()

    if (companyError || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Calculate DLOM if needed
    let dlomResults = null
    if (valuation.assumptions) {
      dlomResults = dlomCalculationService.getDLOMFromAssumptions(valuation.assumptions)
    }

    // Create valuation context for the mapper
    const context = {
      valuation,
      company,
      assumptions: valuation.assumptions || {},
      capTable: valuation.cap_table?.shareClasses || [],
      options: valuation.cap_table?.options || [],
      dlomResults,
      calculatedValues: {
        totalFunding:
          valuation.cap_table?.shareClasses?.reduce(
            (sum: number, sc: any) => sum + (sc.amountInvested || 0),
            0
          ) || 0,
        totalShares:
          valuation.cap_table?.shareClasses?.reduce(
            (sum: number, sc: any) => sum + (sc.sharesOutstanding || 0),
            0
          ) || 0,
        totalOptions:
          valuation.cap_table?.options?.reduce(
            (sum: number, opt: any) => sum + (opt.numOptions || 0),
            0
          ) || 0,
      },
    }

    // Use the TemplateDataMapper to generate template data
    const mapper = TemplateDataMapper.getInstance()
    const templateData = mapper.mapValuationData(context)

    return NextResponse.json({ data: templateData })
  } catch (error) {
    console.error('Error generating template data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
