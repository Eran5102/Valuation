import { NextRequest, NextResponse } from 'next/server'
import QueryMonitor from '@/lib/monitoring/queryMonitor'

// GET /api/monitoring/performance - Get performance metrics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeWindow = parseInt(searchParams.get('timeWindow') || '60') // minutes
    const includeDetails = searchParams.get('details') === 'true'

    const monitor = QueryMonitor.getInstance()
    const stats = monitor.getStats(timeWindow)

    const response: any = {
      timeWindow: `${timeWindow} minutes`,
      stats,
      timestamp: new Date().toISOString(),
    }

    if (includeDetails) {
      response.slowQueries = monitor.getSlowQueries(20)
      response.recentErrors = monitor.getRecentErrors(10)
    }

    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to fetch performance metrics',
      },
      { status: 500 }
    )
  }
}

// POST /api/monitoring/performance/clear - Clear metrics (for testing)
export async function POST() {
  try {
    const monitor = QueryMonitor.getInstance()
    monitor.clearMetrics()

    return NextResponse.json({
      message: 'Metrics cleared successfully',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to clear metrics',
      },
      { status: 500 }
    )
  }
}
