import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { enhanceShareClassesWithCalculations, validateShareClass } from '@/lib/capTableCalculations'
import { IdParamSchema, validateRequest } from '@/lib/validation/api-schemas'

// GET /api/valuations/[id]/cap-table - Get cap table data from actual database tables
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params

    // Validate ID parameter
    const { id } = validateRequest(IdParamSchema, { id: idParam })

    const supabase = await createClient()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()
    if (authError || !session) {
      console.error('Auth error in cap-table GET:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get share classes from the share_classes table
    const { data: dbShareClasses, error: shareError } = await supabase
      .from('share_classes')
      .select('*')
      .eq('valuation_id', id)
      .order('seniority', { ascending: false })

    if (shareError) {
      return NextResponse.json({ error: 'Failed to fetch share classes' }, { status: 500 })
    }

    // Get options from the options_warrants table
    const { data: dbOptions, error: optionsError } = await supabase
      .from('options_warrants')
      .select('*')
      .eq('valuation_id', id)
      .order('grant_date', { ascending: false })

    if (optionsError) {
      console.error('Error fetching options:', optionsError)
      return NextResponse.json({ error: 'Failed to fetch options' }, { status: 500 })
    }

    // Transform database format to frontend format for share classes
    const shareClasses = (dbShareClasses || []).map((sc) => ({
      id: sc.id,
      shareType: sc.type?.toLowerCase() === 'common' ? 'common' : 'preferred',
      name: sc.class_name,
      roundDate: sc.round_date,
      sharesOutstanding: sc.shares || 0,
      pricePerShare: sc.price_per_share || 0,
      preferenceType:
        sc.preference_type === 'Non-Participating'
          ? 'non-participating'
          : sc.preference_type === 'Participating'
            ? 'participating'
            : 'participating-with-cap',
      lpMultiple: sc.liquidation_multiple || 1,
      seniority: sc.seniority || 0,
      participationCap: sc.participation_cap || 0,
      conversionRatio: sc.conversion_ratio || 1,
      dividendsDeclared: sc.dividends_declared || false,
      dividendsRate: sc.div_rate || 0,
      dividendsType: sc.dividends_type === 'Cumulative' ? 'cumulative' : 'non-cumulative',
      pik: sc.pik || false,
    }))

    // Transform database format to frontend format for options
    const options = (dbOptions || []).map((opt) => ({
      id: opt.id,
      numOptions: opt.num_options || 0,
      exercisePrice: opt.exercise_price || 0,
      type: opt.type || 'Options',
    }))

    // Enhance share classes with calculations
    const enhancedShareClasses = enhanceShareClassesWithCalculations(shareClasses)

    return NextResponse.json({
      shareClasses: enhancedShareClasses,
      options,
      updated_at: new Date().toISOString(),
    })
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Validation failed:')) {
      return NextResponse.json(
        { error: 'Invalid valuation ID', message: error.message },
        { status: 400 }
      )
    }
    console.error('Error in cap-table GET:', error)
    return NextResponse.json({ error: 'Failed to fetch cap table data' }, { status: 500 })
  }
}

// PUT /api/valuations/[id]/cap-table - Update cap table data in database tables
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params

    // Validate ID parameter
    const { id } = validateRequest(IdParamSchema, { id: idParam })

    // Parse request body
    const { shareClasses, options } = await request.json()

    const supabase = await createClient()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()
    if (authError || !session) {
      console.error('Auth error in cap-table PUT:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const errors = []
    const results = {
      shareClasses: [],
      options: [],
    }

    // Handle share classes
    if (shareClasses && Array.isArray(shareClasses)) {
      // Get existing share classes to determine which to delete
      const { data: existingShareClasses } = await supabase
        .from('share_classes')
        .select('id')
        .eq('valuation_id', id)

      const existingIds = new Set(existingShareClasses?.map((sc) => sc.id) || [])
      const newIds = new Set(shareClasses.filter((sc) => sc.id).map((sc) => sc.id))

      // Delete removed share classes
      for (const existingId of existingIds) {
        if (!newIds.has(existingId)) {
          const { error } = await supabase.from('share_classes').delete().eq('id', existingId)

          if (error) {
            errors.push({ shareClass: existingId, error: error.message })
          }
        }
      }

      // Update or insert share classes
      for (const shareClass of shareClasses) {
        // Transform frontend format to database format
        const dbShareClass = {
          valuation_id: id,
          type: shareClass.shareType === 'common' ? 'Common' : 'Preferred',
          class_name: shareClass.name,
          round_date: shareClass.roundDate,
          shares: shareClass.sharesOutstanding || 0,
          price_per_share: shareClass.pricePerShare || 0,
          amount_invested: (shareClass.sharesOutstanding || 0) * (shareClass.pricePerShare || 0),
          preference_type:
            shareClass.preferenceType === 'non-participating'
              ? 'Non-Participating'
              : shareClass.preferenceType === 'participating'
                ? 'Participating'
                : 'Participating with Cap',
          liquidation_multiple: shareClass.lpMultiple || 1,
          liquidation_preference:
            (shareClass.sharesOutstanding || 0) *
            (shareClass.pricePerShare || 0) *
            (shareClass.lpMultiple || 1),
          seniority: shareClass.seniority || 0,
          participation_cap: shareClass.participationCap || null,
          conversion_ratio: shareClass.conversionRatio || 1,
          as_conv_shares: (shareClass.sharesOutstanding || 0) * (shareClass.conversionRatio || 1),
          dividends_declared: shareClass.dividendsDeclared || false,
          div_rate: shareClass.dividendsRate || null,
          dividends_type:
            shareClass.dividendsType === 'cumulative'
              ? 'Cumulative'
              : shareClass.dividendsType === 'non-cumulative'
                ? 'Non-Cumulative'
                : 'None',
          pik: shareClass.pik || false,
          updated_at: new Date().toISOString(),
        }

        // Check if it's a UUID (existing) or a temporary ID (new)
        const isExistingShareClass =
          shareClass.id &&
          shareClass.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)

        if (isExistingShareClass) {
          // Update existing share class
          const { data, error } = await supabase
            .from('share_classes')
            .update(dbShareClass)
            .eq('id', shareClass.id)
            .select()
            .single()

          if (error) {
            errors.push({ shareClass: shareClass.id, error: error.message })
          } else {
            results.shareClasses.push(data)
          }
        } else {
          // Insert new share class
          const { data, error } = await supabase
            .from('share_classes')
            .insert(dbShareClass)
            .select()
            .single()

          if (error) {
            errors.push({ shareClass: 'new', error: error.message })
          } else {
            results.shareClasses.push(data)
          }
        }
      }
    }

    // Handle options
    if (options && Array.isArray(options)) {
      // Get existing options to determine which to delete
      const { data: existingOptions } = await supabase
        .from('options_warrants')
        .select('id')
        .eq('valuation_id', id)

      const existingIds = new Set(existingOptions?.map((opt) => opt.id) || [])
      const newIds = new Set(options.filter((opt) => opt.id).map((opt) => opt.id))

      // Delete removed options
      for (const existingId of existingIds) {
        if (!newIds.has(existingId)) {
          const { error } = await supabase.from('options_warrants').delete().eq('id', existingId)

          if (error) {
            errors.push({ option: existingId, error: error.message })
          }
        }
      }

      // Update or insert options
      for (const option of options) {
        const dbOption = {
          valuation_id: id,
          num_options: option.numOptions || 0,
          exercise_price: option.exercisePrice || 0,
          type: option.type || 'Options',
          updated_at: new Date().toISOString(),
        }

        // Check if it's a UUID (existing) or a temporary ID (new)
        const isExistingOption =
          option.id &&
          option.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)

        if (isExistingOption) {
          // Update existing option
          const { data, error } = await supabase
            .from('options_warrants')
            .update(dbOption)
            .eq('id', option.id)
            .select()
            .single()

          if (error) {
            errors.push({ option: option.id, error: error.message })
          } else {
            results.options.push(data)
          }
        } else {
          // Insert new option
          const { data, error } = await supabase
            .from('options_warrants')
            .insert(dbOption)
            .select()
            .single()

          if (error) {
            errors.push({ option: 'new', error: error.message })
          } else {
            results.options.push(data)
          }
        }
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          warning: 'Some items failed to save',
          errors,
          results,
        },
        { status: 207 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Cap table data saved successfully',
      ...results,
    })
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Validation failed:')) {
      return NextResponse.json(
        { error: 'Validation Error', message: error.message },
        { status: 400 }
      )
    }
    console.error('Error in cap-table PUT:', error)
    return NextResponse.json({ error: 'Failed to update cap table data' }, { status: 500 })
  }
}
