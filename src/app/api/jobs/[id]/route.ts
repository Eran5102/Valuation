import { NextRequest, NextResponse } from 'next/server'
import ApiHandler from '@/lib/middleware/apiHandler'
import { jobManager } from '@/lib/jobs/jobManager'

// GET /api/jobs/[id] - Get specific job status
export const GET = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id: jobId } = await params
    const job = jobManager.getJobStatus(jobId)

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
}

// DELETE /api/jobs/[id] - Cancel a job
export const DELETE = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id: jobId } = await params
    const success = await jobManager.cancelJob(jobId)

    if (!success) {
      return NextResponse.json({ error: 'Job not found or cannot be cancelled' }, { status: 404 })
    }

    return NextResponse.json({
      message: 'Job cancelled successfully',
      jobId,
      timestamp: new Date().toISOString(),
    })
}

// POST /api/jobs/[id]/retry - Retry a failed job
export const POST = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id: jobId } = await params
    const success = await jobManager.retryJob(jobId)

    if (!success) {
      return NextResponse.json({ error: 'Job not found or cannot be retried' }, { status: 404 })
    }

    const job = jobManager.getJobStatus(jobId)

    return NextResponse.json({
      message: 'Job retry initiated successfully',
      jobId,
      job: job
        ? {
            id: job.id,
            status: job.status,
            attempts: job.attempts,
        }
        : null,
      timestamp: new Date().toISOString(),
    })
}
