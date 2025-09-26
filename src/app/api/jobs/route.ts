import { NextRequest, NextResponse } from 'next/server'
import { jobManager } from '@/lib/jobs/jobManager'
import {
  CreateJobSchema,
  validateRequest,
} from '@/lib/validation/api-schemas'

// GET /api/jobs - Get job queue status and statistics
export const GET = async (request: NextRequest) => {
  try {
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
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
  }
}

// POST /api/jobs - Create new background job
export const POST = async (request: NextRequest) => {
  try {
    const rawData = await request.json()
    const validatedData = validateRequest(CreateJobSchema, rawData)
    const { type, data, priority } = validatedData

    // Convert string priority to number
    const priorityMap: Record<string, number> = {
      'low': 0,
      'normal': 1,
      'high': 2,
      'critical': 3
    }
    const numericPriority = typeof priority === 'string' ? priorityMap[priority] || 1 : priority || 1

    let jobId: string

    // Route to appropriate job creation method
    switch (type) {
      case 'valuation-calculation':
        jobId = await jobManager.queueValuationCalculation(
          data.valuationId,
          data.companyId,
          data.assumptions,
          data.shareClasses,
          numericPriority
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
          numericPriority
        )
        break

      case 'data-export':
        jobId = await jobManager.queueDataExport(
          data.type,
          data.format,
          data.filters,
          data.dateRange,
          numericPriority
        )
        break

      case 'email-notification':
        jobId = await jobManager.queueEmailNotification(
          data.to,
          data.template,
          data.data,
          data.attachments,
          numericPriority
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
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Validation failed:')) {
      return NextResponse.json(
        { error: 'Validation Error', message: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 })
  }
}
