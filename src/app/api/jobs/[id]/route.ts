import { NextRequest, NextResponse } from 'next/server';
import ApiHandler from '@/lib/middleware/apiHandler';
import { jobManager } from '@/lib/jobs/jobManager';

// GET /api/jobs/[id] - Get specific job status
export const GET = ApiHandler.handle(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const jobId = params.id;
    const job = jobManager.getJobStatus(jobId);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
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
        failedAt: job.failedAt
      },
      timestamp: new Date().toISOString()
    });
  },
  {
    cache: {
      maxAge: 5, // Cache for 5 seconds
      private: true
    },
    rateLimit: {
      requests: 200,
      window: 60000
    },
    security: true,
    monitoring: true
  }
);

// DELETE /api/jobs/[id] - Cancel a job
export const DELETE = ApiHandler.handle(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const jobId = params.id;
    const success = await jobManager.cancelJob(jobId);

    if (!success) {
      return NextResponse.json(
        { error: 'Job not found or cannot be cancelled' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Job cancelled successfully',
      jobId,
      timestamp: new Date().toISOString()
    });
  },
  {
    rateLimit: {
      requests: 30,
      window: 60000
    },
    security: true,
    monitoring: true
  }
);

// POST /api/jobs/[id]/retry - Retry a failed job
export const POST = ApiHandler.handle(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const jobId = params.id;
    const success = await jobManager.retryJob(jobId);

    if (!success) {
      return NextResponse.json(
        { error: 'Job not found or cannot be retried' },
        { status: 404 }
      );
    }

    const job = jobManager.getJobStatus(jobId);

    return NextResponse.json({
      message: 'Job retry initiated successfully',
      jobId,
      job: job ? {
        id: job.id,
        status: job.status,
        attempts: job.attempts
      } : null,
      timestamp: new Date().toISOString()
    });
  },
  {
    rateLimit: {
      requests: 20,
      window: 60000
    },
    security: true,
    monitoring: true
  }
);