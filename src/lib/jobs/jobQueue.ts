interface JobData {
  [key: string]: any
}

interface Job {
  id: string
  type: string
  data: JobData
  priority: number
  attempts: number
  maxAttempts: number
  delay: number
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  failedAt?: Date
  error?: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'delayed'
  progress?: number
  result?: any
}

interface JobProcessor {
  (job: Job): Promise<any>
}

interface QueueOptions {
  concurrency?: number
  maxAttempts?: number
  defaultDelay?: number
  retryDelay?: number
  jobTimeout?: number
}

interface JobStats {
  pending: number
  processing: number
  completed: number
  failed: number
  delayed: number
  totalProcessed: number
  averageProcessingTime: number
  throughputPerMinute: number
}

class JobQueue {
  private static instance: JobQueue
  private jobs: Map<string, Job> = new Map()
  private processors: Map<string, JobProcessor> = new Map()
  private processingJobs: Set<string> = new Set()
  private delayedJobs: Map<string, NodeJS.Timeout> = new Map()
  private isProcessing = false
  private stats = {
    totalProcessed: 0,
    totalProcessingTime: 0,
    lastMinuteCompleted: 0,
    lastMinuteTimestamp: Date.now(),
  }

  private readonly options: Required<QueueOptions> = {
    concurrency: 5,
    maxAttempts: 3,
    defaultDelay: 0,
    retryDelay: 5000,
    jobTimeout: 5 * 60 * 1000, // 5 minutes
  }

  private constructor(options: QueueOptions = {}) {
    this.options = { ...this.options, ...options }
    this.startProcessing()
    this.setupCleanup()
  }

  static getInstance(options?: QueueOptions): JobQueue {
    if (!JobQueue.instance) {
      JobQueue.instance = new JobQueue(options)
    }
    return JobQueue.instance
  }

  /**
   * Register a job processor
   */
  process(jobType: string, processor: JobProcessor): void {
    this.processors.set(jobType, processor)
  }

  /**
   * Add a job to the queue
   */
  async add(
    type: string,
    data: JobData,
    options: {
      priority?: number
      delay?: number
      maxAttempts?: number
      jobId?: string
    } = {}
  ): Promise<string> {
    const {
      priority = 0,
      delay = this.options.defaultDelay,
      maxAttempts = this.options.maxAttempts,
      jobId = this.generateJobId(),
    } = options

    const job: Job = {
      id: jobId,
      type,
      data,
      priority,
      attempts: 0,
      maxAttempts,
      delay,
      createdAt: new Date(),
      status: delay > 0 ? 'delayed' : 'pending',
    }

    this.jobs.set(jobId, job)

    if (delay > 0) {
      // Schedule delayed job
      const timeout = setTimeout(() => {
        const delayedJob = this.jobs.get(jobId)
        if (delayedJob && delayedJob.status === 'delayed') {
          delayedJob.status = 'pending'
          this.delayedJobs.delete(jobId)
        }
      }, delay)

      this.delayedJobs.set(jobId, timeout)
    }

    return jobId
  }

  /**
   * Get job by ID
   */
  getJob(jobId: string): Job | undefined {
    return this.jobs.get(jobId)
  }

  /**
   * Get jobs by status
   */
  getJobsByStatus(status: Job['status']): Job[] {
    return Array.from(this.jobs.values()).filter((job) => job.status === status)
  }

  /**
   * Get jobs by type
   */
  getJobsByType(type: string): Job[] {
    return Array.from(this.jobs.values()).filter((job) => job.type === type)
  }

  /**
   * Cancel a job
   */
  async cancel(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId)
    if (!job) return false

    if (job.status === 'processing') {
      // Cannot cancel processing jobs directly
      return false
    }

    if (job.status === 'delayed') {
      const timeout = this.delayedJobs.get(jobId)
      if (timeout) {
        clearTimeout(timeout)
        this.delayedJobs.delete(jobId)
      }
    }

    this.jobs.delete(jobId)
    return true
  }

  /**
   * Retry a failed job
   */
  async retry(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId)
    if (!job || job.status !== 'failed') return false

    job.status = 'pending'
    job.attempts = 0
    job.error = undefined
    job.failedAt = undefined

    return true
  }

  /**
   * Clear completed/failed jobs
   */
  clean(age: number = 24 * 60 * 60 * 1000): number {
    // 24 hours default
    const cutoff = Date.now() - age
    let cleaned = 0

    for (const [jobId, job] of this.jobs.entries()) {
      if (
        (job.status === 'completed' || job.status === 'failed') &&
        job.createdAt.getTime() < cutoff
      ) {
        this.jobs.delete(jobId)
        cleaned++
      }
    }

    return cleaned
  }

  /**
   * Get queue statistics
   */
  getStats(): JobStats {
    const jobs = Array.from(this.jobs.values())

    const stats = {
      pending: jobs.filter((j) => j.status === 'pending').length,
      processing: jobs.filter((j) => j.status === 'processing').length,
      completed: jobs.filter((j) => j.status === 'completed').length,
      failed: jobs.filter((j) => j.status === 'failed').length,
      delayed: jobs.filter((j) => j.status === 'delayed').length,
      totalProcessed: this.stats.totalProcessed,
      averageProcessingTime:
        this.stats.totalProcessed > 0
          ? this.stats.totalProcessingTime / this.stats.totalProcessed
          : 0,
      throughputPerMinute: this.calculateThroughput(),
    }

    return stats
  }

  /**
   * Start processing jobs
   */
  private startProcessing(): void {
    if (this.isProcessing) return

    this.isProcessing = true
    setInterval(() => {
      this.processNextJobs()
    }, 1000) // Check every second
  }

  /**
   * Process next available jobs
   */
  private async processNextJobs(): Promise<void> {
    const availableSlots = this.options.concurrency - this.processingJobs.size
    if (availableSlots <= 0) return

    // Get pending jobs sorted by priority (higher first) and creation time
    const pendingJobs = Array.from(this.jobs.values())
      .filter((job) => job.status === 'pending')
      .sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority // Higher priority first
        }
        return a.createdAt.getTime() - b.createdAt.getTime() // Earlier first
      })
      .slice(0, availableSlots)

    // Process jobs concurrently
    const processingPromises = pendingJobs.map((job) => this.processJob(job))
    await Promise.allSettled(processingPromises)
  }

  /**
   * Process a single job
   */
  private async processJob(job: Job): Promise<void> {
    const processor = this.processors.get(job.type)
    if (!processor) {
      return
    }

    this.processingJobs.add(job.id)
    job.status = 'processing'
    job.startedAt = new Date()
    job.attempts++


    try {
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Job timeout')), this.options.jobTimeout)
      })

      // Race between job execution and timeout
      const result = await Promise.race([processor(job), timeoutPromise])

      // Job completed successfully
      job.status = 'completed'
      job.completedAt = new Date()
      job.result = result

      const processingTime = job.completedAt.getTime() - job.startedAt!.getTime()
      this.updateStats(processingTime)

    } catch (error) {
      // Job failed
      const errorMessage = error instanceof Error ? error.message : String(error)

      job.error = errorMessage

      if (job.attempts >= job.maxAttempts) {
        job.status = 'failed'
        job.failedAt = new Date()
      } else {
        // Schedule retry with exponential backoff
        const retryDelay = this.options.retryDelay * Math.pow(2, job.attempts - 1)
        job.status = 'delayed'

        const timeout = setTimeout(() => {
          const retryJob = this.jobs.get(job.id)
          if (retryJob && retryJob.status === 'delayed') {
            retryJob.status = 'pending'
            this.delayedJobs.delete(job.id)
          }
        }, retryDelay)

        this.delayedJobs.set(job.id, timeout)
      }
    } finally {
      this.processingJobs.delete(job.id)
    }
  }

  /**
   * Update processing statistics
   */
  private updateStats(processingTime: number): void {
    this.stats.totalProcessed++
    this.stats.totalProcessingTime += processingTime

    // Update throughput calculation
    const now = Date.now()
    if (now - this.stats.lastMinuteTimestamp >= 60000) {
      this.stats.lastMinuteCompleted = 0
      this.stats.lastMinuteTimestamp = now
    }
    this.stats.lastMinuteCompleted++
  }

  /**
   * Calculate throughput per minute
   */
  private calculateThroughput(): number {
    const now = Date.now()
    const timeSinceLastMinute = now - this.stats.lastMinuteTimestamp

    if (timeSinceLastMinute >= 60000) {
      return this.stats.lastMinuteCompleted
    } else {
      // Extrapolate based on partial minute
      const factor = 60000 / timeSinceLastMinute
      return Math.round(this.stats.lastMinuteCompleted * factor)
    }
  }

  /**
   * Generate unique job ID
   */
  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Setup cleanup interval
   */
  private setupCleanup(): void {
    // Clean old jobs every hour
    setInterval(
      () => {
        this.clean()
      },
      60 * 60 * 1000
    )
  }

  /**
   * Shutdown queue gracefully
   */
  async shutdown(): Promise<void> {

    // Clear all delayed job timeouts
    for (const timeout of this.delayedJobs.values()) {
      clearTimeout(timeout)
    }
    this.delayedJobs.clear()

    // Wait for processing jobs to complete (with timeout)
    const maxWaitTime = 30000 // 30 seconds
    const startTime = Date.now()

    while (this.processingJobs.size > 0 && Date.now() - startTime < maxWaitTime) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

  }
}

export default JobQueue
