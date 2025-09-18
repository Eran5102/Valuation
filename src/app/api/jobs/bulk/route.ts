import { NextRequest, NextResponse } from 'next/server';
import ApiHandler from '@/lib/middleware/apiHandler';
import { jobManager } from '@/lib/jobs/jobManager';

// POST /api/jobs/bulk - Create multiple jobs or workflows
export const POST = ApiHandler.handle(
  async (request: NextRequest) => {
    const body = await request.json();
    const { operations, workflow } = body;

    if (workflow) {
      // Process as workflow (jobs with dependencies)
      if (!Array.isArray(workflow) || workflow.length === 0) {
        return NextResponse.json(
          { error: 'Workflow must be a non-empty array' },
          { status: 400 }
        );
      }

      const result = await jobManager.processWorkflow(workflow);

      return NextResponse.json({
        workflowId: result.workflowId,
        jobIds: result.jobIds,
        totalJobs: result.jobIds.length,
        message: 'Workflow initiated successfully'
      }, { status: 201 });

    } else if (operations) {
      // Process as bulk operations (independent jobs)
      if (!Array.isArray(operations) || operations.length === 0) {
        return NextResponse.json(
          { error: 'Operations must be a non-empty array' },
          { status: 400 }
        );
      }

      if (operations.length > 50) {
        return NextResponse.json(
          { error: 'Maximum 50 operations allowed per bulk request' },
          { status: 400 }
        );
      }

      const jobIds = await jobManager.queueBulkOperation(operations);

      return NextResponse.json({
        jobIds,
        totalJobs: jobIds.length,
        message: 'Bulk operations queued successfully'
      }, { status: 201 });

    } else {
      return NextResponse.json(
        { error: 'Either operations or workflow must be provided' },
        { status: 400 }
      );
    }
  },
  {
    rateLimit: {
      requests: 10, // Limit bulk operations
      window: 60000
    },
    validation: {
      bodySchema: { required: [] } // Custom validation in handler
    },
    security: true,
    monitoring: true
  }
);

// DELETE /api/jobs/bulk - Clean old jobs
export const DELETE = ApiHandler.handle(
  async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const ageHours = parseInt(searchParams.get('age') || '24');

    if (ageHours < 1 || ageHours > 168) { // Between 1 hour and 1 week
      return NextResponse.json(
        { error: 'Age must be between 1 and 168 hours' },
        { status: 400 }
      );
    }

    const cleaned = jobManager.cleanOldJobs(ageHours);

    return NextResponse.json({
      cleaned,
      ageHours,
      message: `Cleaned ${cleaned} jobs older than ${ageHours} hours`
    });
  },
  {
    rateLimit: {
      requests: 5,
      window: 300000 // 5 minutes
    },
    security: true,
    monitoring: true
  }
);