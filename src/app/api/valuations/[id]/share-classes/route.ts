import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/valuations/[id]/share-classes
 *
 * Fetch all share classes (cap table securities) for a valuation
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await context.params
    const valuationId = resolvedParams.id

    if (!valuationId || valuationId.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Valuation ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Fetch share classes for this valuation
    const { data: shareClasses, error } = await supabase
      .from('share_classes')
      .select('*')
      .eq('valuation_id', valuationId)
      .order('seniority', { ascending: false }) // Highest seniority first

    if (error) {
      console.error('[share-classes] Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch share classes', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      shareClasses: shareClasses || [],
      count: shareClasses?.length || 0,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    console.error('[share-classes] Unhandled exception:', errorMessage)

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: 'An unexpected error occurred while fetching share classes',
      },
      { status: 500 }
    )
  }
}
