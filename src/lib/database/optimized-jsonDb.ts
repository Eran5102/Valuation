import fs from 'fs/promises'
import fsSync from 'fs'
import path from 'path'
import QueryMonitor from '@/lib/monitoring/queryMonitor'

// Use project root data directory for Next.js
const DB_PATH = path.join(process.cwd(), 'data')

interface Database {
  companies: any[]
  shareClasses: any[]
  valuations: any[]
  nextId: { [key: string]: number }
}

interface IndexEntry {
  [key: string]: Map<any, number[]> // field -> value -> array of indices
}

interface CacheEntry {
  data: any
  timestamp: number
  ttl: number
}

class OptimizedJsonDatabase {
  private static instance: OptimizedJsonDatabase
  private dbPath: string
  private db: Database | null = null
  private indexes: { [table: string]: IndexEntry } = {}
  private cache: Map<string, CacheEntry> = new Map()
  private writeQueue: Array<() => Promise<void>> = []
  private isWriting = false
  private readonly cacheTTL = 5 * 60 * 1000 // 5 minutes
  private readonly maxCacheSize = 1000
  private queryMonitor = QueryMonitor.getInstance()

  private constructor() {
    this.dbPath = path.join(DB_PATH, 'database.json')
    this.initializeDb()
    this.setupCacheCleanup()
  }

  static getInstance(): OptimizedJsonDatabase {
    if (!OptimizedJsonDatabase.instance) {
      OptimizedJsonDatabase.instance = new OptimizedJsonDatabase()
    }
    return OptimizedJsonDatabase.instance
  }

  private async initializeDb() {
    try {
      // Ensure directory exists
      if (!fsSync.existsSync(DB_PATH)) {
        await fs.mkdir(DB_PATH, { recursive: true })
      }

      // Initialize database file if it doesn't exist
      if (!fsSync.existsSync(this.dbPath)) {
        const initialDb: Database = {
          companies: [],
          shareClasses: [],
          valuations: [],
          nextId: { companies: 1, shareClasses: 1, valuations: 1 }
        }
        await fs.writeFile(this.dbPath, JSON.stringify(initialDb, null, 2))
      }

      // Load data and build indexes
      await this.loadData()
      this.buildIndexes()
    } catch (error) {
      console.error('Error initializing optimized JSON database:', error)
      throw error
    }
  }

  private async loadData(): Promise<Database> {
    if (!this.db) {
      try {
        const data = await fs.readFile(this.dbPath, 'utf-8')
        this.db = JSON.parse(data)
      } catch (error) {
        console.error('Error loading database:', error)
        throw error
      }
    }
    return this.db!
  }

  private buildIndexes() {
    if (!this.db) return

    // Build indexes for each table
    const tables = ['companies', 'shareClasses', 'valuations'] as const

    tables.forEach(tableName => {
      this.indexes[tableName] = {}
      const table = this.db![tableName]

      // Index commonly queried fields
      const indexFields = this.getIndexFields(tableName)

      indexFields.forEach(field => {
        this.indexes[tableName][field] = new Map()

        table.forEach((record, index) => {
          const value = this.getNestedValue(record, field)
          if (value !== undefined) {
            if (!this.indexes[tableName][field].has(value)) {
              this.indexes[tableName][field].set(value, [])
            }
            this.indexes[tableName][field].get(value)!.push(index)
          }
        })
      })
    })
  }

  private getIndexFields(tableName: string): string[] {
    const indexConfig = {
      companies: ['id', 'name', 'industry', 'status'],
      shareClasses: ['id', 'companyId', 'name', 'type'],
      valuations: ['id', 'companyId', 'status', 'valuationDate', 'type']
    }
    return indexConfig[tableName as keyof typeof indexConfig] || ['id']
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  private setupCacheCleanup() {
    // Clean expired cache entries every 5 minutes
    setInterval(() => {
      const now = Date.now()
      for (const [key, { timestamp, ttl }] of this.cache.entries()) {
        if (now - timestamp > ttl) {
          this.cache.delete(key)
        }
      }
    }, 5 * 60 * 1000)
  }

  private getCacheKey(operation: string, params: any): string {
    return `${operation}:${JSON.stringify(params)}`
  }

  private getCachedResult(cacheKey: string): any | null {
    const cached = this.cache.get(cacheKey)
    if (!cached) return null

    const now = Date.now()
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(cacheKey)
      return null
    }

    return cached.data
  }

  private setCachedResult(cacheKey: string, data: any, ttl: number = this.cacheTTL) {
    // Limit cache size
    if (this.cache.size > this.maxCacheSize) {
      const oldestKeys = Array.from(this.cache.keys()).slice(0, 100)
      oldestKeys.forEach(key => this.cache.delete(key))
    }

    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  private invalidateCache(tableName: string) {
    const keysToDelete = Array.from(this.cache.keys()).filter(key =>
      key.includes(tableName)
    )
    keysToDelete.forEach(key => this.cache.delete(key))
  }

  private async queueWrite(writeOperation: () => Promise<void>) {
    this.writeQueue.push(writeOperation)
    if (!this.isWriting) {
      await this.processWriteQueue()
    }
  }

  private async processWriteQueue() {
    if (this.isWriting || this.writeQueue.length === 0) return

    this.isWriting = true
    try {
      while (this.writeQueue.length > 0) {
        const operation = this.writeQueue.shift()!
        await operation()
      }
    } finally {
      this.isWriting = false
    }
  }

  private async saveData() {
    if (this.db) {
      await fs.writeFile(this.dbPath, JSON.stringify(this.db, null, 2))
    }
  }

  /**
   * Optimized query with indexing and caching
   */
  async optimizedQuery<T>(
    tableName: keyof Database,
    options: {
      filter?: Record<string, any>
      sort?: { field: string; direction: 'asc' | 'desc' }
      limit?: number
      offset?: number
      cache?: boolean
    } = {}
  ): Promise<T[]> {
    const { filter = {}, sort, limit, offset = 0, cache = true } = options
    const startTime = Date.now()

    // Generate cache key
    const cacheKey = this.getCacheKey(`query:${tableName}`, { filter, sort, limit, offset })

    // Check cache first
    if (cache) {
      const cachedResult = this.getCachedResult(cacheKey)
      if (cachedResult) {
        // Record cache hit
        this.queryMonitor.recordQuery({
          queryType: 'json',
          table: tableName,
          operation: 'select',
          duration: Date.now() - startTime,
          success: true,
          cacheHit: true,
          rowsAffected: cachedResult.length
        })
        return cachedResult
      }
    }

    try {
      await this.loadData()
      if (tableName === 'nextId') {
        throw new Error('Cannot query nextId table')
      }

      let results = this.db![tableName] as T[]

      // Apply filters using indexes where possible
      if (Object.keys(filter).length > 0) {
        results = this.applyFilters(tableName, filter)
      }

      // Apply sorting
      if (sort) {
        results = this.applySorting(results, sort)
      }

      // Apply pagination
      if (limit || offset > 0) {
        const start = offset
        const end = limit ? start + limit : undefined
        results = results.slice(start, end)
      }

      const duration = Date.now() - startTime

      // Record query metrics
      this.queryMonitor.recordQuery({
        queryType: 'json',
        table: tableName,
        operation: 'select',
        duration,
        success: true,
        cacheHit: false,
        rowsAffected: results.length
      })

      // Cache successful results
      if (cache) {
        this.setCachedResult(cacheKey, results)
      }

      return results
    } catch (error) {
      const duration = Date.now() - startTime

      // Record error metrics
      this.queryMonitor.recordQuery({
        queryType: 'json',
        table: tableName,
        operation: 'select',
        duration,
        success: false,
        cacheHit: false,
        error: error instanceof Error ? error.message : String(error)
      })

      throw error
    }
  }

  private applyFilters<T>(tableName: keyof Database, filter: Record<string, any>): T[] {
    if (tableName === 'nextId') return []

    let candidateIndices: number[] | null = null

    // Use indexes for filtering when available
    for (const [field, value] of Object.entries(filter)) {
      if (this.indexes[tableName] && this.indexes[tableName][field]) {
        const indexedIndices = this.indexes[tableName][field].get(value) || []

        if (candidateIndices === null) {
          candidateIndices = [...indexedIndices]
        } else {
          // Intersection of indices
          candidateIndices = candidateIndices.filter(index =>
            indexedIndices.includes(index)
          )
        }
      } else {
        // Fallback to full table scan for non-indexed fields
        candidateIndices = null
        break
      }
    }

    const table = this.db![tableName] as T[]

    if (candidateIndices !== null) {
      // Use indexed results
      return candidateIndices.map(index => table[index])
    } else {
      // Full table scan
      return table.filter(record =>
        Object.entries(filter).every(([field, value]) => {
          const recordValue = this.getNestedValue(record, field)
          return recordValue === value
        })
      )
    }
  }

  private applySorting<T>(results: T[], sort: { field: string; direction: 'asc' | 'desc' }): T[] {
    return results.sort((a, b) => {
      const aValue = this.getNestedValue(a, sort.field)
      const bValue = this.getNestedValue(b, sort.field)

      if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1
      return 0
    })
  }

  /**
   * Optimized insert with index updates
   */
  async optimizedInsert<T>(tableName: keyof Database, data: Omit<T, 'id'>): Promise<T> {
    if (tableName === 'nextId') {
      throw new Error('Cannot insert into nextId table')
    }

    await this.loadData()

    const id = this.db!.nextId[tableName] || 1
    const newRecord = { id, ...data } as T

    await this.queueWrite(async () => {
      this.db![tableName].push(newRecord as any)
      this.db!.nextId[tableName] = id + 1

      // Update indexes
      this.updateIndexesForInsert(tableName, newRecord, this.db![tableName].length - 1)

      await this.saveData()
    })

    // Invalidate cache
    this.invalidateCache(tableName)

    return newRecord
  }

  private updateIndexesForInsert<T>(tableName: keyof Database, record: T, index: number) {
    if (!this.indexes[tableName]) return

    const indexFields = this.getIndexFields(tableName)
    indexFields.forEach(field => {
      if (this.indexes[tableName][field]) {
        const value = this.getNestedValue(record, field)
        if (value !== undefined) {
          if (!this.indexes[tableName][field].has(value)) {
            this.indexes[tableName][field].set(value, [])
          }
          this.indexes[tableName][field].get(value)!.push(index)
        }
      }
    })
  }

  /**
   * Legacy compatibility methods
   */
  getAllValuations() {
    return this.optimizedQuery('valuations')
  }

  createValuation(clientId: number, valuationData: any) {
    return this.optimizedInsert('valuations', { ...valuationData, companyId: clientId })
  }

  getAllCompanies() {
    return this.optimizedQuery('companies')
  }

  createCompany(companyData: any) {
    return this.optimizedInsert('companies', companyData)
  }

  /**
   * Cache and performance statistics
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      maxCacheSize: this.maxCacheSize,
      writeQueueSize: this.writeQueue.length,
      isWriting: this.isWriting,
      indexStats: Object.entries(this.indexes).reduce((acc, [table, indexes]) => {
        acc[table] = Object.keys(indexes).length
        return acc
      }, {} as Record<string, number>)
    }
  }

  /**
   * Clear cache for manual cache invalidation
   */
  clearCache() {
    this.cache.clear()
  }
}

// Export singleton instance
const optimizedDb = OptimizedJsonDatabase.getInstance()
export default optimizedDb