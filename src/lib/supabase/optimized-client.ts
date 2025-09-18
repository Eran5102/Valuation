import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'
import QueryMonitor from '@/lib/monitoring/queryMonitor'

/**
 * Optimized Supabase client with connection pooling and query optimization
 */
class OptimizedSupabaseClient {
  private static instance: OptimizedSupabaseClient
  private client: SupabaseClient<Database>
  private connectionPool: Map<string, SupabaseClient<Database>> = new Map()
  private queryCache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map()
  private readonly maxConnections = 10
  private readonly defaultCacheTTL = 5 * 60 * 1000 // 5 minutes
  private queryMonitor = QueryMonitor.getInstance()

  private constructor() {
    this.client = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        db: {
          schema: 'public',
        },
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        },
        global: {
          headers: {
            'x-application-name': '409a-valuation-app',
          },
        },
        // Enable connection pooling
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      }
    )

    // Initialize connection pool
    this.initializeConnectionPool()

    // Setup cache cleanup
    this.setupCacheCleanup()
  }

  static getInstance(): OptimizedSupabaseClient {
    if (!OptimizedSupabaseClient.instance) {
      OptimizedSupabaseClient.instance = new OptimizedSupabaseClient()
    }
    return OptimizedSupabaseClient.instance
  }

  private initializeConnectionPool() {
    // Pre-warm connection pool
    for (let i = 0; i < Math.min(3, this.maxConnections); i++) {
      const poolKey = `pool-${i}`
      this.connectionPool.set(poolKey, this.createPooledClient())
    }
  }

  private createPooledClient(): SupabaseClient<Database> {
    return createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        db: { schema: 'public' },
        auth: { persistSession: false }, // Pool connections don't need session persistence
      }
    )
  }

  private getPooledClient(): SupabaseClient<Database> {
    // Round-robin selection from pool
    const poolKeys = Array.from(this.connectionPool.keys())
    if (poolKeys.length === 0) {
      return this.client // Fallback to main client
    }

    const index = Math.floor(Math.random() * poolKeys.length)
    return this.connectionPool.get(poolKeys[index]) || this.client
  }

  private setupCacheCleanup() {
    // Clean expired cache entries every 5 minutes
    setInterval(() => {
      const now = Date.now()
      for (const [key, { timestamp, ttl }] of this.queryCache.entries()) {
        if (now - timestamp > ttl) {
          this.queryCache.delete(key)
        }
      }
    }, 5 * 60 * 1000)
  }

  private getCacheKey(query: string, params: any): string {
    return `${query}:${JSON.stringify(params)}`
  }

  private getCachedResult(cacheKey: string): any | null {
    const cached = this.queryCache.get(cacheKey)
    if (!cached) return null

    const now = Date.now()
    if (now - cached.timestamp > cached.ttl) {
      this.queryCache.delete(cacheKey)
      return null
    }

    return cached.data
  }

  private setCachedResult(cacheKey: string, data: any, ttl: number = this.defaultCacheTTL) {
    // Limit cache size to prevent memory leaks
    if (this.queryCache.size > 1000) {
      // Remove oldest entries
      const oldestKeys = Array.from(this.queryCache.keys()).slice(0, 100)
      oldestKeys.forEach(key => this.queryCache.delete(key))
    }

    this.queryCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  /**
   * Optimized query with caching and connection pooling
   */
  async optimizedQuery<T>(
    tableName: string,
    options: {
      select?: string
      filter?: Record<string, any>
      order?: { column: string; ascending?: boolean }
      limit?: number
      offset?: number
      cache?: boolean
      cacheTTL?: number
    } = {}
  ): Promise<{ data: T[] | null; error: any; count?: number }> {
    const {
      select = '*',
      filter = {},
      order,
      limit,
      offset,
      cache = true,
      cacheTTL = this.defaultCacheTTL
    } = options

    const startTime = Date.now()

    // Generate cache key
    const cacheKey = this.getCacheKey(`${tableName}:${select}`, { filter, order, limit, offset })

    // Check cache first
    if (cache) {
      const cachedResult = this.getCachedResult(cacheKey)
      if (cachedResult) {
        // Record cache hit
        this.queryMonitor.recordQuery({
          queryType: 'supabase',
          table: tableName,
          operation: 'select',
          duration: Date.now() - startTime,
          success: true,
          cacheHit: true,
          rowsAffected: cachedResult.data?.length || 0
        })
        return cachedResult
      }
    }

    try {
      // Use pooled client for better performance
      const client = this.getPooledClient()
      let query = client.from(tableName).select(select, { count: 'exact' })

      // Apply filters
      Object.entries(filter).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          query = query.in(key, value)
        } else if (typeof value === 'object' && value.operator) {
          // Support advanced operators like { operator: 'gt', value: 100 }
          query = query.filter(key, value.operator, value.value)
        } else {
          query = query.eq(key, value)
        }
      })

      // Apply ordering
      if (order) {
        query = query.order(order.column, { ascending: order.ascending ?? true })
      }

      // Apply pagination
      if (limit) {
        query = query.limit(limit)
      }
      if (offset) {
        query = query.range(offset, offset + (limit || 50) - 1)
      }

      const result = await query
      const duration = Date.now() - startTime

      // Record query metrics
      this.queryMonitor.recordQuery({
        queryType: 'supabase',
        table: tableName,
        operation: 'select',
        duration,
        success: !result.error,
        cacheHit: false,
        error: result.error?.message,
        rowsAffected: result.data?.length || 0
      })

      // Cache successful results
      if (cache && !result.error) {
        this.setCachedResult(cacheKey, result, cacheTTL)
      }

      return result
    } catch (error) {
      const duration = Date.now() - startTime

      // Record error metrics
      this.queryMonitor.recordQuery({
        queryType: 'supabase',
        table: tableName,
        operation: 'select',
        duration,
        success: false,
        cacheHit: false,
        error: error instanceof Error ? error.message : String(error)
      })

      console.error(`Optimized query error for ${tableName}:`, error)
      return { data: null, error }
    }
  }

  /**
   * Optimized mutation with cache invalidation
   */
  async optimizedMutation<T>(
    tableName: string,
    operation: 'insert' | 'update' | 'delete',
    data: any,
    options: {
      filter?: Record<string, any>
      returning?: string
    } = {}
  ): Promise<{ data: T[] | null; error: any }> {
    try {
      const client = this.getPooledClient()
      let query

      switch (operation) {
        case 'insert':
          query = client.from(tableName).insert(data)
          break
        case 'update':
          query = client.from(tableName).update(data)
          // Apply filters for update
          if (options.filter) {
            Object.entries(options.filter).forEach(([key, value]) => {
              query = query.eq(key, value)
            })
          }
          break
        case 'delete':
          query = client.from(tableName).delete()
          // Apply filters for delete
          if (options.filter) {
            Object.entries(options.filter).forEach(([key, value]) => {
              query = query.eq(key, value)
            })
          }
          break
        default:
          throw new Error(`Unsupported operation: ${operation}`)
      }

      if (options.returning) {
        query = query.select(options.returning)
      }

      const result = await query

      // Invalidate related cache entries
      if (!result.error) {
        this.invalidateTableCache(tableName)
      }

      return result
    } catch (error) {
      console.error(`Optimized mutation error for ${tableName}:`, error)
      return { data: null, error }
    }
  }

  /**
   * Invalidate cache entries for a specific table
   */
  private invalidateTableCache(tableName: string) {
    const keysToDelete = Array.from(this.queryCache.keys()).filter(key =>
      key.startsWith(`${tableName}:`)
    )
    keysToDelete.forEach(key => this.queryCache.delete(key))
  }

  /**
   * Get the main client for direct access
   */
  getClient(): SupabaseClient<Database> {
    return this.client
  }

  /**
   * Clear all cached queries
   */
  clearCache() {
    this.queryCache.clear()
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.queryCache.size,
      poolSize: this.connectionPool.size,
      maxConnections: this.maxConnections
    }
  }
}

// Export singleton instance
export const optimizedSupabase = OptimizedSupabaseClient.getInstance()
export default optimizedSupabase