import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { validateSchema } from '../validation/schemas'

// Type definitions for middleware
export interface ValidationMiddlewareOptions {
  bodySchema?: z.ZodSchema
  querySchema?: z.ZodSchema
  paramsSchema?: z.ZodSchema
  skipValidation?: boolean
}

export interface ValidatedRequest extends NextRequest {
  validatedBody?: any
  validatedQuery?: any
  validatedParams?: any
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface ApiErrorResponse {
  error: string
  message: string
  details?: ValidationError[]
  timestamp: string
  path: string
}

// Custom error classes
export class ValidationException extends Error {
  public errors: ValidationError[]
  public statusCode: number

  constructor(errors: ValidationError[], message = 'Validation failed') {
    super(message)
    this.name = 'ValidationException'
    this.errors = errors
    this.statusCode = 400
  }
}

export class BusinessLogicException extends Error {
  public statusCode: number
  public code: string

  constructor(message: string, code: string = 'BUSINESS_LOGIC_ERROR', statusCode: number = 422) {
    super(message)
    this.name = 'BusinessLogicException'
    this.code = code
    this.statusCode = statusCode
  }
}

// Validation middleware factory
export function withValidation(options: ValidationMiddlewareOptions = {}) {
  return function <T extends (...args: any[]) => any>(handler: T): T {
    return (async (request: NextRequest, context: any) => {
      try {
        const validatedRequest = request as ValidatedRequest
        const url = new URL(request.url)

        // Skip validation if specified
        if (options.skipValidation) {
          return handler(validatedRequest, context)
        }

        // Validate request body
        if (
          options.bodySchema &&
          (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH')
        ) {
          try {
            const body = await request.json()
            const validation = validateSchema(options.bodySchema, body)

            if (!validation.success) {
              const errors: ValidationError[] = (validation.errors || []).map((error) => ({
                field: error.split(':')[0],
                message: error.split(':')[1]?.trim() || 'Invalid value',
                code: 'VALIDATION_ERROR',
              }))

              throw new ValidationException(errors)
            }

            validatedRequest.validatedBody = validation.data
          } catch (error) {
            if (error instanceof ValidationException) {
              throw error
            }
            throw new ValidationException([
              {
                field: 'body',
                message: 'Invalid JSON format',
                code: 'INVALID_JSON',
              },
            ])
          }
        }

        // Validate query parameters
        if (options.querySchema) {
          const query = Object.fromEntries(url.searchParams.entries())

          // Convert numeric strings to numbers where appropriate
          const processedQuery = processQueryParams(query)

          const validation = validateSchema(options.querySchema, processedQuery)

          if (!validation.success) {
            const errors: ValidationError[] = (validation.errors || []).map((error) => ({
              field: error.split(':')[0],
              message: error.split(':')[1]?.trim() || 'Invalid value',
              code: 'QUERY_VALIDATION_ERROR',
            }))

            throw new ValidationException(errors)
          }

          validatedRequest.validatedQuery = validation.data
        }

        // Validate route parameters
        if (options.paramsSchema && context?.params) {
          const validation = validateSchema(options.paramsSchema, context.params)

          if (!validation.success) {
            const errors: ValidationError[] = (validation.errors || []).map((error) => ({
              field: error.split(':')[0],
              message: error.split(':')[1]?.trim() || 'Invalid value',
              code: 'PARAMS_VALIDATION_ERROR',
            }))

            throw new ValidationException(errors)
          }

          validatedRequest.validatedParams = validation.data
        }

        // Call the original handler with validated request
        return handler(validatedRequest, context)
      } catch (error) {
        return handleValidationError(error, request)
      }
    }) as T
  }
}

// Query parameter processing helper
function processQueryParams(query: Record<string, string>): Record<string, any> {
  const processed: Record<string, any> = {}

  for (const [key, value] of Object.entries(query)) {
    // Try to convert to number if it looks like a number
    if (/^\d+$/.test(value)) {
      processed[key] = parseInt(value, 10)
    } else if (/^\d+\.\d+$/.test(value)) {
      processed[key] = parseFloat(value)
    } else if (value === 'true') {
      processed[key] = true
    } else if (value === 'false') {
      processed[key] = false
    } else {
      processed[key] = value
    }
  }

  return processed
}

// Error handling function
function handleValidationError(error: unknown, request: NextRequest): NextResponse {
  const url = new URL(request.url)

  if (error instanceof ValidationException) {
    const response: ApiErrorResponse = {
      error: 'Validation Error',
      message: error.message,
      details: error.errors,
      timestamp: new Date().toISOString(),
      path: url.pathname,
    }

    return NextResponse.json(response, { status: error.statusCode })
  }

  if (error instanceof BusinessLogicException) {
    const response: ApiErrorResponse = {
      error: error.code,
      message: error.message,
      timestamp: new Date().toISOString(),
      path: url.pathname,
    }

    return NextResponse.json(response, { status: error.statusCode })
  }

  // Handle other errors
  console.error('Unexpected error in validation middleware:', error)

  const response: ApiErrorResponse = {
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    timestamp: new Date().toISOString(),
    path: url.pathname,
  }

  return NextResponse.json(response, { status: 500 })
}

// Specific validation middlewares for common patterns
export const withPagination = withValidation({
  querySchema: z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
  }),
})

export const withSorting = withValidation({
  querySchema: z.object({
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
  }),
})

export const withIdParam = withValidation({
  paramsSchema: z.object({
    id: z.string().min(1, 'ID is required'),
  }),
})

export const withNumericIdParam = withValidation({
  paramsSchema: z.object({
    id: z.string().refine((val) => !isNaN(Number(val)), 'ID must be a valid number'),
  }),
})

// Rate limiting middleware (simple implementation)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function withRateLimit(limit: number = 100, windowMs: number = 60000) {
  return function <T extends (...args: any[]) => any>(handler: T): T {
    return (async (request: NextRequest, context: any) => {
      const ip =
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      const now = Date.now()
      const windowStart = now - windowMs

      // Clean up old entries
      for (const [key, data] of rateLimitStore.entries()) {
        if (data.resetTime < windowStart) {
          rateLimitStore.delete(key)
        }
      }

      const current = rateLimitStore.get(ip) || { count: 0, resetTime: now + windowMs }

      if (current.count >= limit && current.resetTime > now) {
        return NextResponse.json(
          {
            error: 'Rate Limit Exceeded',
            message: `Too many requests. Limit: ${limit} per ${windowMs}ms`,
            timestamp: new Date().toISOString(),
          },
          { status: 429 }
        )
      }

      rateLimitStore.set(ip, {
        count: current.count + 1,
        resetTime: current.resetTime > now ? current.resetTime : now + windowMs,
      })

      return handler(request, context)
    }) as T
  }
}

// CORS middleware
export function withCors(
  options: {
    origin?: string | string[]
    methods?: string[]
    headers?: string[]
  } = {}
) {
  const {
    origin = '*',
    methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    headers = ['Content-Type', 'Authorization'],
  } = options

  return function <T extends (...args: any[]) => any>(handler: T): T {
    return (async (request: NextRequest, context: any) => {
      // Handle preflight requests
      if (request.method === 'OPTIONS') {
        return new NextResponse(null, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': Array.isArray(origin) ? origin.join(', ') : origin,
            'Access-Control-Allow-Methods': methods.join(', '),
            'Access-Control-Allow-Headers': headers.join(', '),
            'Access-Control-Max-Age': '86400',
          },
        })
      }

      const response = await handler(request, context)

      // Add CORS headers to response
      if (response instanceof NextResponse) {
        response.headers.set(
          'Access-Control-Allow-Origin',
          Array.isArray(origin) ? origin.join(', ') : origin
        )
        response.headers.set('Access-Control-Allow-Methods', methods.join(', '))
        response.headers.set('Access-Control-Allow-Headers', headers.join(', '))
      }

      return response
    }) as T
  }
}

// Compose multiple middlewares
export function compose<T extends (...args: any[]) => any>(
  ...middlewares: Array<(handler: T) => T>
) {
  return function (handler: T): T {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler)
  }
}

// Authentication middleware placeholder
export function withAuth(requiredRole?: string) {
  return function <T extends (...args: any[]) => any>(handler: T): T {
    return (async (request: NextRequest, context: any) => {
      // TODO: Implement actual authentication logic
      const authHeader = request.headers.get('authorization')

      if (!authHeader) {
        return NextResponse.json(
          {
            error: 'Unauthorized',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
          },
          { status: 401 }
        )
      }

      // For now, just pass through - implement actual auth logic later
      return handler(request, context)
    }) as T
  }
}

// Logging middleware
export function withLogging(options: { includeBody?: boolean; includeQuery?: boolean } = {}) {
  return function <T extends (...args: any[]) => any>(handler: T): T {
    return (async (request: NextRequest, context: any) => {
      const start = Date.now()
      const url = new URL(request.url)

      const logData: any = {
        method: request.method,
        path: url.pathname,
        timestamp: new Date().toISOString(),
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      }

      if (options.includeQuery && url.search) {
        logData.query = Object.fromEntries(url.searchParams.entries())
      }

      if (
        options.includeBody &&
        (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH')
      ) {
        try {
          const body = await request.clone().json()
          logData.body = body
        } catch {
          // Body is not JSON, skip logging it
        }
      }

      console.log('API Request:', logData)

      try {
        const response = await handler(request, context)
        const duration = Date.now() - start

        console.log('API Response:', {
          ...logData,
          status: response.status,
          duration: `${duration}ms`,
        })

        return response
      } catch (error) {
        const duration = Date.now() - start

        console.error('API Error:', {
          ...logData,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: `${duration}ms`,
        })

        throw error
      }
    }) as T
  }
}
