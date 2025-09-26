import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrganizationId } from '@/lib/auth/get-organization'
import {
  fetchCompanyFundamentals,
  searchPeerCompanies,
  fetchMultipleCompanies,
  performPeerComparison,
  filterPeersByMarketCap,
  rankPeersBySimilarity,
} from '@/lib/services/peer/peerCompaniesService'

const ALPHA_VANTAGE_API_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY || 'P9MHLKEMM4D1GOES'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, ticker, peerTickers, maxPeers = 10, marketCapTolerance = 0.5, valuationId, companies } = body

    switch (action) {
      case 'search': {
        if (!ticker) {
          return NextResponse.json({ error: 'Ticker is required for search' }, { status: 400 })
        }

        const peers = await searchPeerCompanies(ticker, ALPHA_VANTAGE_API_KEY, maxPeers)

        return NextResponse.json({ peers })
      }

      case 'fetch': {
        if (!ticker) {
          return NextResponse.json({ error: 'Ticker is required' }, { status: 400 })
        }

        const fundamentals = await fetchCompanyFundamentals(ticker, ALPHA_VANTAGE_API_KEY)

        if (!fundamentals) {
          return NextResponse.json(
            { error: `Failed to fetch fundamentals for ${ticker}` },
            { status: 404 }
          )
        }

        return NextResponse.json(fundamentals)
      }

      case 'compare': {
        if (!ticker || !peerTickers || peerTickers.length === 0) {
          return NextResponse.json(
            { error: 'Target ticker and peer tickers are required' },
            { status: 400 }
          )
        }

        const comparison = await performPeerComparison(ticker, peerTickers, ALPHA_VANTAGE_API_KEY)

        if (!comparison) {
          return NextResponse.json({ error: 'Failed to perform peer comparison' }, { status: 500 })
        }

        // Filter by market cap if requested
        if (marketCapTolerance && comparison.company.marketCap > 0) {
          comparison.peers = filterPeersByMarketCap(
            comparison.peers,
            comparison.company.marketCap,
            marketCapTolerance
          )
        }

        // Rank peers by similarity
        const rankedPeers = rankPeersBySimilarity(comparison.company, comparison.peers)

        return NextResponse.json({
          ...comparison,
          rankedPeers,
        })
      }

      case 'batch': {
        if (!peerTickers || peerTickers.length === 0) {
          return NextResponse.json({ error: 'Peer tickers are required' }, { status: 400 })
        }

        const companies = await fetchMultipleCompanies(peerTickers, ALPHA_VANTAGE_API_KEY)

        return NextResponse.json({ companies })
      }

      case 'save': {
        // Save imported companies to database
        if (!companies || companies.length === 0) {
          return NextResponse.json({ error: 'Companies data required' }, { status: 400 })
        }

        const supabase = await createClient()
        const organizationId = await getOrganizationId()

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Transform and save companies to database
        const peerCompaniesData = companies.map((company: any) => ({
          organization_id: organizationId,
          valuation_id: valuationId || null,
          ticker: company.ticker,
          name: company.name,
          industry: company.industry || null,
          sector: company.sector || null,
          market_cap: company.marketCap || null,
          enterprise_value: company.enterpriseValue || null,
          revenue: company.revenue || null,
          ebitda: company.ebitda || null,
          revenue_growth: company.revenueGrowth || null,
          gross_margin: company.grossMargin || null,
          ebitda_margin: company.ebitdaMargin || null,
          ev_to_revenue: company.evToRevenue || null,
          ev_to_ebitda: company.evToEbitda || null,
          pe_ratio: company.peRatio || null,
          price_to_book: company.priceToBook || null,
          debt_to_equity: company.debtToEquity || null,
          beta: company.beta || null,
          source: 'alpha_vantage',
          source_updated_at: new Date().toISOString(),
          metadata: company.metadata || {},
          created_by: user.id,
          is_active: true,
        }))

        const { data: savedCompanies, error: saveError } = await supabase
          .from('peer_companies')
          .upsert(peerCompaniesData, {
            onConflict: 'ticker,organization_id',
            ignoreDuplicates: false
          })
          .select()

        if (saveError) {
          return NextResponse.json({ error: 'Failed to save companies' }, { status: 500 })
        }

        return NextResponse.json({ savedCompanies })
      }

      case 'list': {
        // Fetch saved peer companies from database
        const supabase = await createClient()
        const organizationId = await getOrganizationId()

        const query = supabase
          .from('peer_companies')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (valuationId) {
          query.eq('valuation_id', valuationId)
        }

        const { data: companies, error } = await query

        if (error) {
          return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
        }

        return NextResponse.json({ companies })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: search, fetch, compare, batch, save, or list' },
          { status: 400 }
        )
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ticker = searchParams.get('ticker')
  const valuationId = searchParams.get('valuationId')
  const action = searchParams.get('action') || 'fetch'

  // If action is 'list', fetch from database
  if (action === 'list') {
    try {
      const supabase = await createClient()
      const organizationId = await getOrganizationId()

      const query = supabase
        .from('peer_companies')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (valuationId) {
        query.eq('valuation_id', valuationId)
      }

      const { data: companies, error } = await query

      if (error) {
        return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
      }

      return NextResponse.json({ companies })
    } catch (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }

  // Original functionality for fetching from API
  if (!ticker) {
    return NextResponse.json({ error: 'Ticker parameter is required' }, { status: 400 })
  }

  try {
    const fundamentals = await fetchCompanyFundamentals(ticker, ALPHA_VANTAGE_API_KEY)

    if (!fundamentals) {
      return NextResponse.json({ error: `Company not found: ${ticker}` }, { status: 404 })
    }

    return NextResponse.json(fundamentals)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch company fundamentals' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Company ID required' }, { status: 400 })
    }

    const supabase = await createClient()
    const organizationId = await getOrganizationId()

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('peer_companies')
      .update({ is_active: false })
      .eq('id', id)
      .eq('organization_id', organizationId)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete company' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
