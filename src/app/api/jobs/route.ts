import { NextRequest, NextResponse } from 'next/server'
import ApiHandler from '@/lib/middleware/apiHandler'
import { jobManager } from '@/lib/jobs/jobManager'

// GET /api/jobs - Get job queue status and statistics
export const GET = async (request: NextRequest) => {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')

    let jobs
    if (status) {
      jobs = jobManager.getJobsByStatus(status as any)
    } else if (type) {
      jobs = jobManager.getJobsByType(type)
    } else {
      // Get recent jobs from all statuses
      const allJobs = [
        ...jobManager.getJobsByStatus('processing'),
        ...jobManager.getJobsByStatus('pending'),
        ...jobManager.getJobsByStatus('completed').slice(-20),
        ...jobManager.getJobsByStatus('failed').slice(-10),
      ]
      jobs = allJobs.slice(0, limit)
    }

    const stats = jobManager.getStats()
    const health = jobManager.getHealthStatus()

    return NextResponse.json({
      jobs: jobs.map((job) => ({
        id: job.id,
        type: job.type,
        status: job.status,
        priority: job.priority,
        attempts: job.attempts,
        progress: job.progress,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        error: job.error,
      })),
      stats,
      health,
      timestamp: new Date().toISOString(),
    })
}

// POST /api/jobs - Create new background job
export const POST = async (request: NextRequest) => {
    const body = await request.json()
    const { type, data, priority = 0, delay = 0 } = body

    if (!type || !data) {
      return NextResponse.json({ error: 'Missing required fields: type, data' }, { status: 400 })
    }

    let jobId: string

    // Route to appropriate job creation method
    switch (type) {
      case 'valuation-calculation':
        jobId = await jobManager.queueValuationCalculation(
          data.valuationId,
          data.companyId,
          data.assumptions,
          data.shareClasses,
          priority
        )
        break

      case 'report-generation':
        jobId = await jobManager.queueReportGeneration(
          data.valuationId,
          data.templateId,
          data.format,
          {
            includeCharts: data.includeCharts,
            watermark: data.watermark,
          },
          priority
        )
        break

      case 'data-export':
        jobId = await jobManager.queueDataExport(
          data.type,
          data.format,
          data.filters,
          data.dateRange,
          priority
        )
        break

      case 'email-notification':
        jobId = await jobManager.queueEmailNotification(
          data.to,
          data.template,
          data.data,
          data.attachments,
          priority
        )
        break

      default:
        return NextResponse.json({ error: `Unsupported job type: ${type}` }, { status: 400 })
    }

    const job = jobManager.getJobStatus(jobId)

    return NextResponse.json({
      jobId,
      job: job
        ? {
            id: job.id,
            type: job.type,
            status: job.status,
            priority: job.priority,
            createdAt: job.createdAt,
          }
        : null,
      message: 'Job queued successfully',
    })
}
