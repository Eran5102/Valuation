import { NextRequest, NextResponse } from 'next/server'
import ResponseOptimizer from './responseOptimizer'
import QueryMonitor from '@/lib/monitoring/queryMonitor'

interface ApiHandlerOptions {
  cache?: {
    maxAge?: number
    staleWhileRevalidate?: number
    private?: boolean
  }
  rateLimit?: {
    requests: number
    window: number // milliseconds
  }
  validation?: {
    bodySchema?: any
    querySchema?: any
  }
  compression?: boolean
  security?: boolean
  monitoring?: boolean
}

interface RequestMetrics {
  method: string
  path: string
  startTime: number
  userAgent?: string
  ip?: string
}

class ApiHandler {
  private static rateLimitCache = new Map<string, { count: number; resetTime: number }>()
  private static requestMetrics: RequestMetrics[] = []

  /**
   * Enhanced API handler with comprehensive optimizations
   */
  static handle<T = any>(
    handler: (request: NextRequest) => Promise<NextResponse<T>>,
    options: ApiHandlerOptions = {}
  ) {
    return async (request: NextRequest): Promise<NextResponse<any>> => {
      const startTime = Date.now()
      const queryMonitor = QueryMonitor.getInstance()

      try {
        // Extract request info for monitoring
        const requestInfo: RequestMetrics = {
          method: request.method,
          path: new URL(request.url).pathname,
          startTime,
          userAgent: request.headers.get('user-agent') || undefined,
          ip: this.getClientIP(request),
        }

        // Rate limiting
        if (options.rateLimit) {
          const rateLimitResult = this.checkRateLimit(
            requestInfo.ip || 'unknown',
            options.rateLimit
          )
          if (!rateLimitResult.allowed) {
            return this.createRateLimitResponse(rateLimitResult)
          }
        }

        // Input validation
        if (options.validation) {
          const validationResult = await this.validateRequest(request, options.validation)
          if (!validationResult.valid) {
            return this.createValidationErrorResponse(validationResult.errors)
          }
        }

        // Execute the actual handler
        let response = await handler(request)

        // Record API metrics
        if (options.monitoring !== false) {
          const duration = Date.now() - startTime
          queryMonitor.recordQuery({
            queryType: 'supabase', // or determine based on handler
            table: 'api_requests',
            operation: 'select',
            duration,
            success: response.status < 400,
            cacheHit: false,
            error: response.status >= 400 ? `HTTP ${response.status}` : undefined,
          })
        }

        // Apply response optimizations
        const optimizationOptions = {
          cache: options.cache,
          compression: options.compression !== false ? {} : false,
          security: options.security !== false,
          performance: true,
          startTime,
        }

        response = ResponseOptimizer.optimizeResponse(request, response, optimizationOptions)

        // Store request metrics
        this.storeRequestMetrics(requestInfo, response.status, Date.now() - startTime)

        return response
      } catch (error) {
        const duration = Date.now() - startTime

        // Record error metrics
        if (options.monitoring !== false) {
          queryMonitor.recordQuery({
            queryType: 'supabase',
            table: 'api_requests',
            operation: 'select',
            duration,
            success: false,
            cacheHit: false,
            error: error instanceof Error ? error.message : String(error),
          })
        }


        return this.createErrorResponse(error, startTime)
      }
    }
  }

  /**
   * Rate limiting check
   */
  private static checkRateLimit(
    identifier: string,
    rateLimit: { requests: number; window: number }
  ): { allowed: boolean; limit: number; remaining: number; resetTime: number } {
    const now = Date.now()
    const windowStart = now - rateLimit.window

    // Clean up old entries
    for (const [key, data] of this.rateLimitCache.entries()) {
      if (data.resetTime < windowStart) {
        this.rateLimitCache.delete(key)
      }
    }

    const current = this.rateLimitCache.get(identifier)
    const resetTime = now + rateLimit.window

    if (!current || current.resetTime < windowStart) {
      // First request or window expired
      this.rateLimitCache.set(identifier, { count: 1, resetTime })
      return {
        allowed: true,
        limit: rateLimit.requests,
        remaining: rateLimit.requests - 1,
        resetTime,
      }
    }

    if (current.count >= rateLimit.requests) {
      // Rate limit exceeded
      return {
        allowed: false,
        limit: rateLimit.requests,
        remaining: 0,
        resetTime: current.resetTime,
      }
    }

    // Increment count
    current.count++
    return {
      allowed: true,
      limit: rateLimit.requests,
      remaining: rateLimit.requests - current.count,
      resetTime: current.resetTime,
    }
  }

  /**
   * Request validation
   */
  private static async validateRequest(
    request: NextRequest,
    validation: { bodySchema?: any; querySchema?: any }
  ): Promise<{ valid: boolean; errors?: string[] }> {
    const errors: string[] = []

    try {
      // Validate query parameters
      if (validation.querySchema) {
        const url = new URL(request.url)
        const queryParams = Object.fromEntries(url.searchParams.entries())

        // Simple validation - in a real app, use a library like Zod
        if (validation.querySchema.page && queryParams.page) {
          const page = parseInt(queryParams.page)
          if (isNaN(page) || page < 1) {
            errors.push('Page must be a positive integer')
          }
        }
      }

      // Validate request body
      if (validation.bodySchema && (request.method === 'POST' || request.method === 'PUT')) {
        try {
          const body = await request.clone().json()

          // Simple validation - in a real app, use a proper schema validator
          if (validation.bodySchema.required) {
            for (const field of validation.bodySchema.required) {
              if (!(field in body)) {
                errors.push(`Missing required field: ${field}`)
              }
            }
          }
        } catch (error) {
          errors.push('Invalid JSON in request body')
        }
      }

      return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined }
    } catch (error) {
      return { valid: false, errors: ['Validation error occurred'] }
    }
  }

  /**
   * Get client IP address
   */
  private static getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const real = request.headers.get('x-real-ip')
    const connection = request.headers.get('x-connecting-ip')

    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }

    return real || connection || 'unknown'
  }

  /**
   * Store request metrics
   */
  private static storeRequestMetrics(
    requestInfo: RequestMetrics,
    statusCode: number,
    duration: number
  ): void {
    // Keep only last 1000 requests
    if (this.requestMetrics.length >= 1000) {
      this.requestMetrics = this.requestMetrics.slice(-500)
    }

    this.requestMetrics.push({
      ...requestInfo,
      startTime: duration, // Reuse field for duration
    })
  }

  /**
   * Create rate limit response
   */
  private static createRateLimitResponse(rateLimitInfo: {
    limit: number
    remaining: number
    resetTime: number
  }): NextResponse {
    return NextResponse.json(
      {
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        rateLimitInfo: {
          limit: rateLimitInfo.limit,
          remaining: rateLimitInfo.remaining,
          resetTime: new Date(rateLimitInfo.resetTime).toISOString(),
        },
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitInfo.limit.toString(),
          'X-RateLimit-Remaining': rateLimitInfo.remaining.toString(),
          'X-RateLimit-Reset': rateLimitInfo.resetTime.toString(),
          'Retry-After': Math.ceil((rateLimitInfo.resetTime - Date.now()) / 1000).toString(),
        },
      }
    )
  }

  /**
   * Create validation error response
   */
  private static createValidationErrorResponse(errors: string[]): NextResponse {
    return NextResponse.json(
      {
        error: 'Validation Error',
        message: 'Request validation failed',
        details: errors,
      },
      { status: 400 }
    )
  }

  /**
   * Create error response
   */
  private static createErrorResponse(error: unknown, startTime: number): NextResponse {
    const duration = Date.now() - startTime
    const isDevelopment = process.env.NODE_ENV === 'development'

    const errorResponse = {
      error: 'Internal Server Error',
      message: isDevelopment
        ? error instanceof Error
          ? error.message
          : String(error)
        : 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      ...(isDevelopment && error instanceof Error && { stack: error.stack }),
    }

    const response = NextResponse.json(errorResponse, { status: 500 })

    return ResponseOptimizer.addPerformanceHeaders(response, startTime)
  }

  /**
   * Get API metrics
   */
  static getMetrics(): {
    totalRequests: number
    avgResponseTime: number
    errorRate: number
    requestsPerMethod: Record<string, number>
    recentRequests: Array<{
      method: string
      path: string
      duration: number
      userAgent?: string
      ip?: string
    }>
  } {
    const total = this.requestMetrics.length
    if (total === 0) {
      return {
        totalRequests: 0,
        avgResponseTime: 0,
        errorRate: 0,
        requestsPerMethod: {},
        recentRequests: [],
      }
    }

    const totalDuration = this.requestMetrics.reduce((sum, req) => sum + req.startTime, 0)
    const methodCounts: Record<string, number> = {}

    this.requestMetrics.forEach((req) => {
      methodCounts[req.method] = (methodCounts[req.method] || 0) + 1
    })

    return {
      totalRequests: total,
      avgResponseTime: totalDuration / total,
      errorRate: 0, // Would need to track status codes
      requestsPerMethod: methodCounts,
      recentRequests: this.requestMetrics.slice(-20).map((req) => ({
        method: req.method,
        path: req.path,
        duration: req.startTime,
        userAgent: req.userAgent,
        ip: req.ip,
      })),
    }
  }
}

export default ApiHandler
