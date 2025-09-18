import JobQueue from './jobQueue';
import { registerValuationProcessors } from './processors/valuationProcessors';

class JobManager {
  private static instance: JobManager;
  private queue: JobQueue;

  private constructor() {
    // Initialize job queue with optimized settings
    this.queue = JobQueue.getInstance({
      concurrency: 3, // Process 3 jobs concurrently
      maxAttempts: 3,
      defaultDelay: 0,
      retryDelay: 5000,
      jobTimeout: 10 * 60 * 1000 // 10 minutes for heavy operations
    });

    // Register all job processors
    this.registerProcessors();

    console.log('JobManager initialized with background processing');
  }

  static getInstance(): JobManager {
    if (!JobManager.instance) {
      JobManager.instance = new JobManager();
    }
    return JobManager.instance;
  }

  /**
   * Register all job processors
   */
  private registerProcessors(): void {
    registerValuationProcessors(this.queue);
  }

  /**
   * Queue valuation calculation job
   */
  async queueValuationCalculation(
    valuationId: number,
    companyId: number,
    assumptions: any,
    shareClasses: any[],
    priority: number = 1
  ): Promise<string> {
    return await this.queue.add(
      'valuation-calculation',
      {
        valuationId,
        companyId,
        assumptions,
        shareClasses
      },
      {
        priority,
        maxAttempts: 2 // Valuation calculations are critical
      }
    );
  }

  /**
   * Queue report generation job
   */
  async queueReportGeneration(
    valuationId: number,
    templateId: string,
    format: 'pdf' | 'excel' | 'word',
    options: { includeCharts?: boolean; watermark?: string } = {},
    priority: number = 0
  ): Promise<string> {
    return await this.queue.add(
      'report-generation',
      {
        valuationId,
        templateId,
        format,
        includeCharts: options.includeCharts || false,
        watermark: options.watermark
      },
      {
        priority,
        delay: 2000 // Small delay to allow valuation to complete first
      }
    );
  }

  /**
   * Queue data export job
   */
  async queueDataExport(
    type: 'companies' | 'valuations' | 'cap-table',
    format: 'csv' | 'excel' | 'json',
    filters?: Record<string, any>,
    dateRange?: { from: string; to: string },
    priority: number = 0
  ): Promise<string> {
    return await this.queue.add(
      'data-export',
      {
        type,
        format,
        filters,
        dateRange
      },
      {
        priority,
        maxAttempts: 2
      }
    );
  }

  /**
   * Queue email notification job
   */
  async queueEmailNotification(
    to: string[],
    template: string,
    data: Record<string, any>,
    attachments?: Array<{
      filename: string;
      content: Buffer;
      contentType: string;
    }>,
    priority: number = 0
  ): Promise<string> {
    return await this.queue.add(
      'email-notification',
      {
        to,
        template,
        data,
        attachments
      },
      {
        priority,
        maxAttempts: 3 // Retry email notifications
      }
    );
  }

  /**
   * Queue bulk operation (multiple jobs)
   */
  async queueBulkOperation(
    operations: Array<{
      type: string;
      data: any;
      priority?: number;
      delay?: number;
    }>
  ): Promise<string[]> {
    const jobIds: string[] = [];

    for (const operation of operations) {
      const jobId = await this.queue.add(
        operation.type,
        operation.data,
        {
          priority: operation.priority || 0,
          delay: operation.delay || 0
        }
      );
      jobIds.push(jobId);
    }

    console.log(`Queued ${operations.length} bulk operations`);
    return jobIds;
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string) {
    return this.queue.getJob(jobId);
  }

  /**
   * Get jobs by status
   */
  getJobsByStatus(status: 'pending' | 'processing' | 'completed' | 'failed' | 'delayed') {
    return this.queue.getJobsByStatus(status);
  }

  /**
   * Get jobs by type
   */
  getJobsByType(type: string) {
    return this.queue.getJobsByType(type);
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    return await this.queue.cancel(jobId);
  }

  /**
   * Retry a failed job
   */
  async retryJob(jobId: string): Promise<boolean> {
    return await this.queue.retry(jobId);
  }

  /**
   * Get queue statistics
   */
  getStats() {
    return this.queue.getStats();
  }

  /**
   * Clean old jobs
   */
  cleanOldJobs(ageInHours: number = 24): number {
    return this.queue.clean(ageInHours * 60 * 60 * 1000);
  }

  /**
   * Health check for job system
   */
  getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    stats: any;
    issues: string[];
  } {
    const stats = this.getStats();
    const issues: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    // Check for concerning metrics
    if (stats.failed > stats.completed * 0.1) {
      issues.push('High failure rate detected');
      status = 'warning';
    }

    if (stats.pending > 100) {
      issues.push('Large number of pending jobs');
      status = 'warning';
    }

    if (stats.processing === 0 && stats.pending > 0) {
      issues.push('Jobs not being processed');
      status = 'critical';
    }

    if (stats.averageProcessingTime > 5 * 60 * 1000) { // 5 minutes
      issues.push('Slow job processing detected');
      status = status === 'critical' ? 'critical' : 'warning';
    }

    return { status, stats, issues };
  }

  /**
   * Process job workflow (chain multiple jobs)
   */
  async processWorkflow(
    workflow: Array<{
      type: string;
      data: any;
      dependsOn?: string; // Job ID this job depends on
      delay?: number;
    }>
  ): Promise<{ workflowId: string; jobIds: string[] }> {
    const workflowId = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const jobIds: string[] = [];

    for (const step of workflow) {
      let delay = step.delay || 0;

      // If this step depends on another job, add delay to allow completion
      if (step.dependsOn) {
        const dependentJob = this.queue.getJob(step.dependsOn);
        if (dependentJob && dependentJob.status !== 'completed') {
          delay = Math.max(delay, 30000); // Minimum 30 second delay for dependencies
        }
      }

      const jobId = await this.queue.add(
        step.type,
        {
          ...step.data,
          workflowId,
          dependsOn: step.dependsOn
        },
        { delay }
      );

      jobIds.push(jobId);
    }

    console.log(`Started workflow ${workflowId} with ${workflow.length} steps`);
    return { workflowId, jobIds };
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    await this.queue.shutdown();
  }
}

// Export singleton instance
export const jobManager = JobManager.getInstance();
export default JobManager;