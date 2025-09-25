import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  fetchCompanyFundamentals,
  searchPeerCompanies,
  fetchMultipleCompanies,
  calculateIndustryAverages,
} from '@/lib/services/peer/peerCompaniesService'
import { calculateIndustryBeta } from '@/lib/services/beta/betaCalculationService'

const ALPHA_VANTAGE_API_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY || 'P9MHLKEMM4D1GOES'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get valuation data including assumptions
    const { data: valuation, error } = await supabase
      .from('valuations')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !valuation) {
      return NextResponse.json({ error: 'Valuation not found' }, { status: 404 })
    }

    // Get consolidated assumptions
    const { data: assumptions } = await supabase
      .from('valuation_assumptions_consolidated')
      .select('*')
      .eq('valuation_id', id)
      .single()

    // Extract ticker and valuation date from assumptions
    const ticker =
      assumptions?.assumptions?.['company.ticker'] ||
      assumptions?.assumptions?.ticker ||
      valuation.company_ticker
    const valuationDate =
      assumptions?.assumptions?.['company.valuation_date'] ||
      assumptions?.assumptions?.valuation_date ||
      valuation.valuation_date ||
      new Date().toISOString()

    if (!ticker) {
      return NextResponse.json({
        error: 'No company ticker found',
        ticker: null,
        peers: [],
        industryBeta: null,
        industryAverages: null,
      })
    }

    // Search for peer companies
    const peerTickers = await searchPeerCompanies(
      ticker,
      ALPHA_VANTAGE_API_KEY,
      8 // Limit to 8 peers to avoid API limits
    )

    // Fetch fundamentals for target and peers
    const targetCompany = await fetchCompanyFundamentals(ticker, ALPHA_VANTAGE_API_KEY)

    if (!targetCompany) {
      return NextResponse.json({
        error: 'Failed to fetch target company data',
        ticker,
        peers: [],
        industryBeta: null,
        industryAverages: null,
      })
    }

    // Fetch peer companies with rate limiting
    const peers = await fetchMultipleCompanies(
      peerTickers.slice(0, 5), // Limit to 5 peers due to API constraints
      ALPHA_VANTAGE_API_KEY,
      12000 // 12 second delay for free tier
    )

    // Calculate industry averages
    const allCompanies = [targetCompany, ...peers]
    const industryAverages = calculateIndustryAverages(allCompanies)

    // Extract betas for industry beta calculation
    const peerBetas = peers
      .filter((p) => p.beta !== undefined && p.beta > 0)
      .map((p) => ({
        beta: p.beta,
        marketCap: p.marketCap,
      }))

    let industryBeta = null
    if (peerBetas.length > 0) {
      industryBeta = calculateIndustryBeta(peerBetas)
    }

    return NextResponse.json({
      ticker,
      targetCompany,
      peers,
      peerTickers,
      industryBeta,
      industryAverages,
      valuationDate,
      dataPoints: peers.length,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching peer beta:', error)
    return NextResponse.json({ error: 'Failed to fetch peer beta data' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { customPeers, refreshData = false } = body

    const supabase = await createClient()

    // Get valuation data
    const { data: valuation, error } = await supabase
      .from('valuations')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !valuation) {
      return NextResponse.json({ error: 'Valuation not found' }, { status: 404 })
    }

    // If custom peers provided, use those instead
    const peerTickers =
      customPeers ||
      (await searchPeerCompanies(valuation.company_ticker, ALPHA_VANTAGE_API_KEY, 10))

    // Fetch peer companies
    const peers = await fetchMultipleCompanies(peerTickers, ALPHA_VANTAGE_API_KEY)

    // Calculate industry beta
    const peerBetas = peers
      .filter((p) => p.beta !== undefined && p.beta > 0)
      .map((p) => ({
        beta: p.beta,
        marketCap: p.marketCap,
      }))

    let industryBeta = null
    if (peerBetas.length > 0) {
      industryBeta = calculateIndustryBeta(peerBetas)
    }

    // Store in database for caching
    await supabase.from('peer_analysis').upsert({
      valuation_id: id,
      peer_tickers: peerTickers,
      peer_data: peers,
      industry_beta: industryBeta,
      updated_at: new Date().toISOString(),
    })

    return NextResponse.json({
      peers,
      industryBeta,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error updating peer beta:', error)
    return NextResponse.json({ error: 'Failed to update peer beta data' }, { status: 500 })
  }
}
