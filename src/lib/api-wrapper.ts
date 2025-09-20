import { NextRequest, NextResponse } from 'next/server'
import { APIError, ValidationError, NotFoundError, PermissionError, logError } from './error-utils'

type APIHandler = (req: NextRequest, params?: any) => Promise<NextResponse>

interface APIWrapperOptions {
  requireAuth?: boolean
  validateBody?: (body: any) => { isValid: boolean; errors?: Record<string, string[]> }
}

export function withErrorHandler(
  handler: APIHandler,
  options: APIWrapperOptions = {}
): APIHandler {
  return async (req: NextRequest, params?: any) => {
    try {
      // Add authentication check if required
      if (options.requireAuth) {
        // Implement your auth logic here
        // const isAuthenticated = await checkAuth(req)
        // if (!isAuthenticated) {
        //   throw new PermissionError('Authentication required')
        // }
      }

      // Add body validation if provided
      if (options.validateBody && req.method !== 'GET' && req.method !== 'DELETE') {
        try {
          const body = await req.json()
          const validation = options.validateBody(body)

          if (!validation.isValid) {
            throw new ValidationError('Validation failed', validation.errors || {})
          }
        } catch (error) {
          if (error instanceof ValidationError) {
            throw error
          }
          throw new ValidationError('Invalid JSON body', { body: ['Invalid JSON format'] })
        }
      }

      // Execute the actual handler
      return await handler(req, params)

    } catch (error) {
      // Log the error
      logError(error, {
        method: req.method,
        url: req.url,
        headers: Object.fromEntries(req.headers.entries())
      })

      // Handle specific error types
      if (error instanceof ValidationError) {
        return NextResponse.json(
          {
            error: 'Validation Error',
            message: error.message,
            fields: error.fields
          },
          { status: 400 }
        )
      }

      if (error instanceof NotFoundError) {
        return NextResponse.json(
          {
            error: 'Not Found',
            message: error.message,
            resource: error.resource
          },
          { status: 404 }
        )
      }

      if (error instanceof PermissionError) {
        return NextResponse.json(
          {
            error: 'Permission Denied',
            message: error.message
          },
          { status: 403 }
        )
      }

      if (error instanceof APIError) {
        return NextResponse.json(
          {
            error: 'API Error',
            message: error.message,
            details: error.details
          },
          { status: error.statusCode }
        )
      }

      // Handle generic errors
      if (error instanceof Error) {
        return NextResponse.json(
          {
            error: 'Internal Server Error',
            message: process.env.NODE_ENV === 'production'
              ? 'An unexpected error occurred'
              : error.message
          },
          { status: 500 }
        )
      }

      // Handle unknown errors
      return NextResponse.json(
        {
          error: 'Internal Server Error',
          message: 'An unexpected error occurred'
        },
        { status: 500 }
      )
    }
  }
}

// Helper function for successful responses
export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(
    {
      success: true,
      data
    },
    { status }
  )
}

// Helper function for paginated responses
export function paginatedResponse<T>(
  data: T[],
  pagination: {
    page: number
    limit: number
    total: number
  }
) {
  return NextResponse.json(
    {
      success: true,
      data,
      pagination: {
        ...pagination,
        totalPages: Math.ceil(pagination.total / pagination.limit),
        hasNext: pagination.page * pagination.limit < pagination.total,
        hasPrev: pagination.page > 1
      }
    },
    { status: 200 }
  )
}

// Helper function to extract and validate query parameters
export function getQueryParams(req: NextRequest, schema: Record<string, 'string' | 'number' | 'boolean'>) {
  const searchParams = new URL(req.url).searchParams
  const params: Record<string, any> = {}

  for (const [key, type] of Object.entries(schema)) {
    const value = searchParams.get(key)

    if (value !== null) {
      switch (type) {
        case 'number':
          const num = Number(value)
          if (isNaN(num)) {
            throw new ValidationError(`Invalid ${key}`, { [key]: ['Must be a number'] })
          }
          params[key] = num
          break
        case 'boolean':
          params[key] = value === 'true'
          break
        default:
          params[key] = value
      }
    }
  }

  return params
}

// Helper function for CORS headers
export function corsHeaders(origin?: string) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  }
}