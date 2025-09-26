interface QueryMetrics {
  queryType: 'supabase' | 'json'
  table: string
  operation: 'select' | 'insert' | 'update' | 'delete'
  duration: number
  timestamp: Date
  success: boolean
  error?: string
  cacheHit?: boolean
  rowsAffected?: number
  queryHash?: string
}

interface PerformanceStats {
  totalQueries: number
  slowQueries: number
  averageResponseTime: number
  errorRate: number
  cacheHitRate: number
  byTable: Record<
    string,
    {
      count: number
      avgDuration: number
      slowCount: number
    }
  >
}

class QueryMonitor {
  private static instance: QueryMonitor
  private metrics: QueryMetrics[] = []
  private readonly slowQueryThreshold = 1000 // 1 second
  private readonly maxMetricsHistory = 10000
  private readonly alertThresholds = {
    slowQueryRate: 0.1, // 10% slow queries triggers alert
    errorRate: 0.05, // 5% error rate triggers alert
    avgResponseTime: 500, // 500ms average response time triggers alert
  }

  private constructor() {
    this.setupPeriodicCleanup()
  }

  static getInstance(): QueryMonitor {
    if (!QueryMonitor.instance) {
      QueryMonitor.instance = new QueryMonitor()
    }
    return QueryMonitor.instance
  }

  /**
   * Record a query execution
   */
  recordQuery(metric: Omit<QueryMetrics, 'timestamp'>): void {
    const fullMetric: QueryMetrics = {
      ...metric,
      timestamp: new Date(),
    }

    this.metrics.push(fullMetric)

    // Limit memory usage
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory)
    }

    // Check for performance issues
    this.checkPerformanceAlerts(fullMetric)

    // Log slow queries immediately
    if (metric.duration > this.slowQueryThreshold) {
      console.warn('Slow query detected:', {
        table: metric.table,
        operation: metric.operation,
        duration: `${metric.duration}ms`,
        queryType: metric.queryType,
        timestamp: fullMetric.timestamp.toISOString(),
      })
    }
  }

  /**
   * Get performance statistics for a time window
   */
  getStats(timeWindowMinutes: number = 60): PerformanceStats {
    const cutoff = new Date(Date.now() - timeWindowMinutes * 60 * 1000)
    const recentMetrics = this.metrics.filter((m) => m.timestamp >= cutoff)

    if (recentMetrics.length === 0) {
      return {
        totalQueries: 0,
        slowQueries: 0,
        averageResponseTime: 0,
        errorRate: 0,
        cacheHitRate: 0,
        byTable: {},
      }
    }

    const slowQueries = recentMetrics.filter((m) => m.duration > this.slowQueryThreshold)
    const errors = recentMetrics.filter((m) => !m.success)
    const cacheHits = recentMetrics.filter((m) => m.cacheHit === true)

    const byTable: Record<string, { count: number; avgDuration: number; slowCount: number }> = {}

    // Group by table
    recentMetrics.forEach((metric) => {
      if (!byTable[metric.table]) {
        byTable[metric.table] = { count: 0, avgDuration: 0, slowCount: 0 }
      }
      byTable[metric.table].count++
      byTable[metric.table].avgDuration += metric.duration
      if (metric.duration > this.slowQueryThreshold) {
        byTable[metric.table].slowCount++
      }
    })

    // Calculate averages
    Object.keys(byTable).forEach((table) => {
      byTable[table].avgDuration = byTable[table].avgDuration / byTable[table].count
    })

    const totalDuration = recentMetrics.reduce((sum, m) => sum + m.duration, 0)

    return {
      totalQueries: recentMetrics.length,
      slowQueries: slowQueries.length,
      averageResponseTime: totalDuration / recentMetrics.length,
      errorRate: errors.length / recentMetrics.length,
      cacheHitRate: cacheHits.length / recentMetrics.length,
      byTable,
    }
  }

  /**
   * Get slow queries for debugging
   */
  getSlowQueries(limit: number = 50): QueryMetrics[] {
    return this.metrics
      .filter((m) => m.duration > this.slowQueryThreshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit)
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 50): QueryMetrics[] {
    return this.metrics
      .filter((m) => !m.success)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  /**
   * Check for performance alerts
   */
  private checkPerformanceAlerts(metric: QueryMetrics): void {
    const stats = this.getStats(15) // Check last 15 minutes

    if (stats.totalQueries < 10) return // Not enough data

    // Alert on high slow query rate
    const slowQueryRate = stats.slowQueries / stats.totalQueries
    if (slowQueryRate > this.alertThresholds.slowQueryRate) {
    }

    // Alert on high error rate
    if (stats.errorRate > this.alertThresholds.errorRate) {
    }

    // Alert on high average response time
    if (stats.averageResponseTime > this.alertThresholds.avgResponseTime) {
    }
  }

  /**
   * Periodic cleanup of old metrics
   */
  private setupPeriodicCleanup(): void {
    setInterval(
      () => {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        this.metrics = this.metrics.filter((m) => m.timestamp >= oneDayAgo)
      },
      60 * 60 * 1000
    ) // Clean up every hour
  }

  /**
   * Export metrics for external monitoring systems
   */
  exportMetrics(): {
    stats: PerformanceStats
    slowQueries: QueryMetrics[]
    recentErrors: QueryMetrics[]
  } {
    return {
      stats: this.getStats(),
      slowQueries: this.getSlowQueries(20),
      recentErrors: this.getRecentErrors(20),
    }
  }

  /**
   * Clear all metrics (for testing)
   */
  clearMetrics(): void {
    this.metrics = []
  }
}

// Helper functions for wrapping database operations
export function withQueryMonitoring<T extends any[], R>(
  operation: (...args: T) => Promise<R>,
  table: string,
  operationType: QueryMetrics['operation'],
  queryType: QueryMetrics['queryType'] = 'supabase'
) {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now()
    const monitor = QueryMonitor.getInstance()

    try {
      const result = await operation(...args)
      const duration = Date.now() - startTime

      monitor.recordQuery({
        queryType,
        table,
        operation: operationType,
        duration,
        success: true,
        rowsAffected: Array.isArray(result) ? result.length : 1,
      })

      return result
    } catch (error) {
      const duration = Date.now() - startTime

      monitor.recordQuery({
        queryType,
        table,
        operation: operationType,
        duration,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      })

      throw error
    }
  }
}

export default QueryMonitor
