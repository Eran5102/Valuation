import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { validateSchema } from '../validation/schemas'

// Improved type definitions for middleware
export interface ValidationMiddlewareOptions {
  bodySchema?: z.ZodSchema
  querySchema?: z.ZodSchema
  paramsSchema?: z.ZodSchema
  skipValidation?: boolean
}

export interface ValidatedRequestContext {
  validatedBody?: Record<string, unknown>
  validatedQuery?: Record<string, unknown>
  validatedParams?: Record<string, unknown>
  params?: Record<string, string>
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

// Handler type for API routes
export type ApiRouteHandler = (
  request: NextRequest,
  context: ValidatedRequestContext
) => Promise<Response> | Response

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

// Validation middleware factory with proper typing
export function withValidation(options: ValidationMiddlewareOptions = {}) {
  return function (handler: ApiRouteHandler): ApiRouteHandler {
    return async (request: NextRequest, context: ValidatedRequestContext) => {
      try {
        const url = new URL(request.url)

        // Skip validation if specified
        if (options.skipValidation) {
          return handler(request, context)
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

            context.validatedBody = validation.data as Record<string, unknown>
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
          const queryParams = processQueryParams(Object.fromEntries(url.searchParams))
          const validation = validateSchema(options.querySchema, queryParams)

          if (!validation.success) {
            const errors: ValidationError[] = (validation.errors || []).map((error) => ({
              field: error.split(':')[0],
              message: error.split(':')[1]?.trim() || 'Invalid value',
              code: 'QUERY_VALIDATION_ERROR',
            }))

            throw new ValidationException(errors)
          }

          context.validatedQuery = validation.data as Record<string, unknown>
        }

        // Validate route parameters
        if (options.paramsSchema && context.params) {
          const validation = validateSchema(options.paramsSchema, context.params)

          if (!validation.success) {
            const errors: ValidationError[] = (validation.errors || []).map((error) => ({
              field: error.split(':')[0],
              message: error.split(':')[1]?.trim() || 'Invalid value',
              code: 'PARAMS_VALIDATION_ERROR',
            }))

            throw new ValidationException(errors)
          }

          context.validatedParams = validation.data as Record<string, unknown>
        }

        return handler(request, context)
      } catch (error) {
        return handleValidationError(error, request)
      }
    }
  }
}

// Process query parameters with proper typing
function processQueryParams(query: Record<string, string>): Record<string, unknown> {
  const processed: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(query)) {
    // Handle array parameters (e.g., ?tags=a&tags=b)
    if (Array.isArray(value)) {
      processed[key] = value
      continue
    }

    // Try to parse as number
    if (!isNaN(Number(value)) && value.trim() !== '') {
      processed[key] = Number(value)
      continue
    }

    // Try to parse as boolean
    if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
      processed[key] = value.toLowerCase() === 'true'
      continue
    }

    // Try to parse as JSON
    if (
      (value.startsWith('{') && value.endsWith('}')) ||
      (value.startsWith('[') && value.endsWith(']'))
    ) {
      try {
        processed[key] = JSON.parse(value)
        continue
      } catch {
        // If JSON parsing fails, treat as string
      }
    }

    // Default to string
    processed[key] = value
  }

  return processed
}

// Rate limiting middleware with proper typing
interface RateLimitOptions {
  windowMs: number
  max: number
  keyGenerator?: (request: NextRequest) => string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const rateLimitStore: RateLimitStore = {}

export function withRateLimit(options: RateLimitOptions) {
  return function (handler: ApiRouteHandler): ApiRouteHandler {
    return async (request: NextRequest, context: ValidatedRequestContext) => {
      const { windowMs, max, keyGenerator = defaultKeyGenerator } = options
      const key = keyGenerator(request)
      const now = Date.now()

      // Clean up expired entries
      if (rateLimitStore[key] && rateLimitStore[key].resetTime <= now) {
        delete rateLimitStore[key]
      }

      // Initialize or increment counter
      if (!rateLimitStore[key]) {
        rateLimitStore[key] = {
          count: 1,
          resetTime: now + windowMs,
        }
      } else {
        rateLimitStore[key].count++
      }

      // Check if limit exceeded
      if (rateLimitStore[key].count > max) {
        return NextResponse.json(
          {
            error: 'TOO_MANY_REQUESTS',
            message: `Too many requests. Limit: ${max} per ${windowMs}ms`,
            details: {
              limit: max,
              windowMs,
              retryAfter: Math.ceil((rateLimitStore[key].resetTime - now) / 1000),
            },
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': max.toString(),
              'X-RateLimit-Remaining': Math.max(0, max - rateLimitStore[key].count).toString(),
              'X-RateLimit-Reset': Math.ceil(rateLimitStore[key].resetTime / 1000).toString(),
              'Retry-After': Math.ceil((rateLimitStore[key].resetTime - now) / 1000).toString(),
            },
          }
        )
      }

      return handler(request, context)
    }
  }
}

function defaultKeyGenerator(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
  return ip
}

// CORS middleware with proper typing
interface CorsOptions {
  origin?: string | string[] | boolean
  methods?: string[]
  allowedHeaders?: string[]
  credentials?: boolean
  maxAge?: number
}

export function withCors(options: CorsOptions = {}) {
  return function (handler: ApiRouteHandler): ApiRouteHandler {
    return async (request: NextRequest, context: ValidatedRequestContext) => {
      const response = await handler(request, context)

      // Set CORS headers
      const headers = new Headers(response.headers)

      if (options.origin) {
        if (typeof options.origin === 'boolean') {
          headers.set('Access-Control-Allow-Origin', options.origin ? '*' : '')
        } else if (typeof options.origin === 'string') {
          headers.set('Access-Control-Allow-Origin', options.origin)
        } else if (Array.isArray(options.origin)) {
          const requestOrigin = request.headers.get('origin')
          if (requestOrigin && options.origin.includes(requestOrigin)) {
            headers.set('Access-Control-Allow-Origin', requestOrigin)
          }
        }
      }

      if (options.methods) {
        headers.set('Access-Control-Allow-Methods', options.methods.join(', '))
      }

      if (options.allowedHeaders) {
        headers.set('Access-Control-Allow-Headers', options.allowedHeaders.join(', '))
      }

      if (options.credentials) {
        headers.set('Access-Control-Allow-Credentials', 'true')
      }

      if (options.maxAge) {
        headers.set('Access-Control-Max-Age', options.maxAge.toString())
      }

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      })
    }
  }
}

// Middleware composition with proper typing
export function compose(...middlewares: Array<(handler: ApiRouteHandler) => ApiRouteHandler>) {
  return function (handler: ApiRouteHandler): ApiRouteHandler {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler)
  }
}

// Request logging middleware with proper typing
interface LoggingOptions {
  includeBody?: boolean
  includeHeaders?: boolean
  excludeHeaders?: string[]
}

export function withLogging(options: LoggingOptions = {}) {
  return function (handler: ApiRouteHandler): ApiRouteHandler {
    return async (request: NextRequest, context: ValidatedRequestContext) => {
      const startTime = Date.now()
      const requestId = generateRequestId()

      const logData: Record<string, unknown> = {
        requestId,
        method: request.method,
        url: request.url,
        timestamp: new Date().toISOString(),
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      }

      if (options.includeHeaders) {
        const headers: Record<string, string> = {}
        request.headers.forEach((value, key) => {
          if (!options.excludeHeaders?.includes(key.toLowerCase())) {
            headers[key] = value
          }
        })
        logData.headers = headers
      }

      if (options.includeBody && request.method !== 'GET') {
        try {
          const body = await request.clone().text()
          logData.body = body
        } catch {
          logData.body = '[Unable to parse body]'
        }
      }


      try {
        const response = await handler(request, context)
        const duration = Date.now() - startTime

        // Log successful response - in production, send to logging service
        const responseLog = {
          requestId,
          status: response.status,
          duration: `${duration}ms`,
          timestamp: new Date().toISOString(),
        }

        return response
      } catch (error) {
        const duration = Date.now() - startTime

        // Log error response - in production, send to logging service
        const errorLog = {
          requestId,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: `${duration}ms`,
          timestamp: new Date().toISOString(),
        }

        throw error
      }
    }
  }
}

function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// Error handling with proper typing
function handleValidationError(error: unknown, request: NextRequest): Response {
  const url = new URL(request.url)

  if (error instanceof ValidationException) {
    return NextResponse.json(
      {
        error: 'VALIDATION_ERROR',
        message: error.message,
        details: error.errors,
        timestamp: new Date().toISOString(),
        path: url.pathname,
      } as ApiErrorResponse,
      { status: error.statusCode }
    )
  }

  if (error instanceof BusinessLogicException) {
    return NextResponse.json(
      {
        error: error.code,
        message: error.message,
        timestamp: new Date().toISOString(),
        path: url.pathname,
      } as ApiErrorResponse,
      { status: error.statusCode }
    )
  }


  return NextResponse.json(
    {
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      path: url.pathname,
    } as ApiErrorResponse,
    { status: 500 }
  )
}
