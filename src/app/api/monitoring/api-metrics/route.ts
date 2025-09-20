import { NextRequest, NextResponse } from 'next/server'
import ApiHandler from '@/lib/middleware/apiHandler'

// GET /api/monitoring/api-metrics - Get API performance metrics
export const GET = async (request: NextRequest) => {
    try {
      const metrics = ApiHandler.getMetrics()

      return NextResponse.json({
        timestamp: new Date().toISOString(),
        metrics,
        message: 'API metrics retrieved successfully',
      })
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to retrieve API metrics' },
        { status: 500 }
      )
    }
}
