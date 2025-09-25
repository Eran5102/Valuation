import { NextResponse } from 'next/server'
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
    const { action, ticker, peerTickers, maxPeers = 10, marketCapTolerance = 0.5 } = body

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

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: search, fetch, compare, or batch' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in peer companies API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ticker = searchParams.get('ticker')

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
    console.error('Error fetching company fundamentals:', error)
    return NextResponse.json({ error: 'Failed to fetch company fundamentals' }, { status: 500 })
  }
}
