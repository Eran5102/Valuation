import { NextRequest, NextResponse } from 'next/server'

interface TreasuryYieldData {
  date: string
  '1Mo'?: number
  '2Mo'?: number
  '3Mo'?: number
  '4Mo'?: number
  '6Mo'?: number
  '1Yr'?: number
  '2Yr'?: number
  '3Yr'?: number
  '5Yr'?: number
  '7Yr'?: number
  '10Yr'?: number
  '20Yr'?: number
  '30Yr'?: number
}

// GET /api/external/treasury-yield-curve - Get latest yield curve data
export async function GET(request: NextRequest) {
  try {
    // Treasury provides an XML feed with the latest yield curve data
    const treasuryUrl = 'https://home.treasury.gov/sites/default/files/interest-rates/yield.xml'

    const response = await fetch(treasuryUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    if (!response.ok) {
      throw new Error(`Treasury API returned ${response.status}: ${response.statusText}`)
    }

    const xmlText = await response.text()
    const yieldData = parseYieldXML(xmlText)

    return NextResponse.json({
      success: true,
      data: yieldData,
      source: 'treasury.gov',
      fetchedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching Treasury yield curve:', error)

    // Return mock data as last resort if Treasury API fails
    const mockData: TreasuryYieldData[] = [
      {
        date: new Date().toISOString().split('T')[0],
        '1Mo': 4.24,
        '2Mo': 4.2,
        '3Mo': 4.08,
        '4Mo': 4.02,
        '6Mo': 3.83,
        '1Yr': 3.66,
        '2Yr': 3.56,
        '3Yr': 3.52,
        '5Yr': 3.63,
        '7Yr': 3.81,
        '10Yr': 4.06,
        '20Yr': 4.65,
        '30Yr': 4.68,
      },
    ]

    return NextResponse.json({
      success: true,
      data: mockData,
      source: 'mock-data',
      fetchedAt: new Date().toISOString(),
      note: 'Using mock data due to Treasury API unavailability',
    })
  }
}

// POST /api/external/treasury-yield-curve - Get yield curve data for specific date
export async function POST(request: NextRequest) {
  try {
    const { date } = await request.json()

    if (!date) {
      return NextResponse.json(
        { success: false, error: 'Date parameter is required' },
        { status: 400 }
      )
    }

    // For historical data, we would need to use Treasury's historical data API
    // For now, we'll try the current endpoint and filter/mock as needed
    const treasuryUrl = 'https://home.treasury.gov/sites/default/files/interest-rates/yield.xml'

    const response = await fetch(treasuryUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    if (!response.ok) {
      throw new Error(`Treasury API returned ${response.status}: ${response.statusText}`)
    }

    const xmlText = await response.text()
    const yieldData = parseYieldXML(xmlText)

    // Filter data for the requested date or find closest available date
    const requestedDate = new Date(date)
    const filteredData = yieldData.filter((item) => {
      const itemDate = new Date(item.date)
      return itemDate <= requestedDate
    })

    // If no data found for the date, return the most recent available
    const resultData = filteredData.length > 0 ? filteredData : yieldData

    return NextResponse.json({
      success: true,
      data: resultData.slice(0, 1), // Return most recent match
      source: 'treasury.gov',
      requestedDate: date,
      fetchedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching historical Treasury data:', error)

    // Return mock data for the requested date as last resort
    const { date } = await request.json()
    const mockData: TreasuryYieldData[] = [
      {
        date: date || new Date().toISOString().split('T')[0],
        '1Mo': 4.24,
        '2Mo': 4.2,
        '3Mo': 4.08,
        '4Mo': 4.02,
        '6Mo': 3.83,
        '1Yr': 3.66,
        '2Yr': 3.56,
        '3Yr': 3.52,
        '5Yr': 3.63,
        '7Yr': 3.81,
        '10Yr': 4.06,
        '20Yr': 4.65,
        '30Yr': 4.68,
      },
    ]

    return NextResponse.json({
      success: true,
      data: mockData,
      source: 'mock-data',
      requestedDate: date,
      fetchedAt: new Date().toISOString(),
      note: 'Using mock data due to Treasury API unavailability',
    })
  }
}

/**
 * Parse Treasury XML yield data
 * The XML structure contains yield curve data with various maturities
 */
function parseYieldXML(xmlText: string): TreasuryYieldData[] {
  try {
    // Treasury XML structure:
    // <G_NEW_DATE>
    //   <NEW_DATE>09-02-2025</NEW_DATE>
    //   <LIST_G_BC_CAT><G_BC_CAT>
    //     <BC_1MONTH>4.4</BC_1MONTH>
    //     <BC_5YEAR>3.74</BC_5YEAR>
    //     ...
    //   </G_BC_CAT></LIST_G_BC_CAT>
    // </G_NEW_DATE>

    const entries: TreasuryYieldData[] = []

    // Find all G_NEW_DATE sections
    const dateBlockRegex = /<G_NEW_DATE>([\s\S]*?)<\/G_NEW_DATE>/g

    let dateBlockMatch
    while ((dateBlockMatch = dateBlockRegex.exec(xmlText)) !== null) {
      const dateBlock = dateBlockMatch[1]

      // Extract date from NEW_DATE tag
      const dateMatch = /<NEW_DATE>([^<]+)<\/NEW_DATE>/.exec(dateBlock)
      if (!dateMatch) continue

      const dateStr = dateMatch[1]
      // Convert MM-DD-YYYY to YYYY-MM-DD format
      let formattedDate: string
      if (dateStr.includes('MARKET CLOSED')) {
        continue // Skip market closed days
      } else {
        // Parse date like "09-02-2025"
        const [month, day, year] = dateStr.split('-')
        formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      }

      const yieldEntry: TreasuryYieldData = { date: formattedDate }

      // Extract rates for each maturity from G_BC_CAT section
      const bcCatMatch = /<G_BC_CAT>([\s\S]*?)<\/G_BC_CAT>/.exec(dateBlock)
      if (bcCatMatch) {
        const ratesSection = bcCatMatch[1]

        const rateMapping = {
          '1Mo': /<BC_1MONTH>([^<]+)<\/BC_1MONTH>/,
          '2Mo': /<BC_2MONTH>([^<]+)<\/BC_2MONTH>/,
          '3Mo': /<BC_3MONTH>([^<]+)<\/BC_3MONTH>/,
          '4Mo': /<BC_4MONTH>([^<]+)<\/BC_4MONTH>/,
          '6Mo': /<BC_6MONTH>([^<]+)<\/BC_6MONTH>/,
          '1Yr': /<BC_1YEAR>([^<]+)<\/BC_1YEAR>/,
          '2Yr': /<BC_2YEAR>([^<]+)<\/BC_2YEAR>/,
          '3Yr': /<BC_3YEAR>([^<]+)<\/BC_3YEAR>/,
          '5Yr': /<BC_5YEAR>([^<]+)<\/BC_5YEAR>/,
          '7Yr': /<BC_7YEAR>([^<]+)<\/BC_7YEAR>/,
          '10Yr': /<BC_10YEAR>([^<]+)<\/BC_10YEAR>/,
          '20Yr': /<BC_20YEAR>([^<]+)<\/BC_20YEAR>/,
          '30Yr': /<BC_30YEAR>([^<]+)<\/BC_30YEAR>/,
        }

        for (const [maturity, regex] of Object.entries(rateMapping)) {
          const rateMatch = regex.exec(ratesSection)
          if (rateMatch && rateMatch[1] && rateMatch[1].trim() !== '') {
            const rate = parseFloat(rateMatch[1])
            if (!isNaN(rate)) {
              (yieldEntry as any)[maturity] = rate
            }
          }
        }
      }

      entries.push(yieldEntry)
    }

    // Return all entries sorted by date (most recent first)
    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  } catch (error) {
    console.error('Error parsing Treasury XML:', error)
    return []
  }
}
