import { NextRequest, NextResponse } from 'next/server'
import ApiHandler from '@/lib/middleware/apiHandler'
import { jobManager } from '@/lib/jobs/jobManager'
import {
  IdParamSchema,
  validateRequest,
} from '@/lib/validation/api-schemas'

// GET /api/jobs/[id] - Get specific job status
export const GET = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id: idParam } = await params

    // Note: Job IDs are strings, not UUIDs, so we'll validate as string
    if (!idParam || typeof idParam !== 'string') {
      return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 })
    }

    const job = jobManager.getJobStatus(idParam)

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    return NextResponse.json({
      job: {
        id: job.id,
        type: job.type,
        status: job.status,
        priority: job.priority,
        attempts: job.attempts,
        maxAttempts: job.maxAttempts,
        progress: job.progress,
        data: job.data,
        result: job.result,
        error: job.error,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        failedAt: job.failedAt,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 })
  }
}

// DELETE /api/jobs/[id] - Cancel a job
export const DELETE = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id: idParam } = await params

    if (!idParam || typeof idParam !== 'string') {
      return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 })
    }

    const success = await jobManager.cancelJob(idParam)

    if (!success) {
      return NextResponse.json({ error: 'Job not found or cannot be cancelled' }, { status: 404 })
    }

    return NextResponse.json({
      message: 'Job cancelled successfully',
      jobId: idParam,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to cancel job' }, { status: 500 })
  }
}

// POST /api/jobs/[id]/retry - Retry a failed job
export const POST = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id: idParam } = await params

    if (!idParam || typeof idParam !== 'string') {
      return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 })
    }

    const success = await jobManager.retryJob(idParam)

    if (!success) {
      return NextResponse.json({ error: 'Job not found or cannot be retried' }, { status: 404 })
    }

    const job = jobManager.getJobStatus(idParam)

    return NextResponse.json({
      message: 'Job retry initiated successfully',
      jobId: idParam,
      job: job
        ? {
            id: job.id,
            status: job.status,
            attempts: job.attempts,
        }
        : null,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to retry job' }, { status: 500 })
  }
}
