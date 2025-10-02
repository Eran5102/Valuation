// Error Types
export class APIError extends Error {
  statusCode: number
  details?: any

  constructor(message: string, statusCode: number = 500, details?: any) {
    super(message)
    this.name = 'APIError'
    this.statusCode = statusCode
    this.details = details
  }
}

export class ValidationError extends Error {
  fields: Record<string, string[]>

  constructor(message: string, fields: Record<string, string[]> = {}) {
    super(message)
    this.name = 'ValidationError'
    this.fields = fields
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network request failed') {
    super(message)
    this.name = 'NetworkError'
  }
}

export class NotFoundError extends Error {
  resource: string

  constructor(resource: string, id?: string) {
    super(id ? `${resource} with ID ${id} not found` : `${resource} not found`)
    this.name = 'NotFoundError'
    this.resource = resource
  }
}

export class PermissionError extends Error {
  resource?: string
  action?: string

  constructor(message?: string, resource?: string, action?: string) {
    super(message || 'You do not have permission to perform this action')
    this.name = 'PermissionError'
    this.resource = resource
    this.action = action
  }
}

// Error Parsing Utilities
export function parseError(error: unknown): {
  message: string
  statusCode?: number
  type: 'api' | 'validation' | 'network' | 'permission' | 'notfound' | 'unknown'
  details?: any
} {
  if (error instanceof APIError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      type: 'api',
      details: error.details,
    }
  }

  if (error instanceof ValidationError) {
    return {
      message: error.message,
      type: 'validation',
      details: error.fields,
    }
  }

  if (error instanceof NetworkError) {
    return {
      message: error.message,
      type: 'network',
    }
  }

  if (error instanceof NotFoundError) {
    return {
      message: error.message,
      statusCode: 404,
      type: 'notfound',
      details: { resource: error.resource },
    }
  }

  if (error instanceof PermissionError) {
    return {
      message: error.message,
      statusCode: 403,
      type: 'permission',
      details: { resource: error.resource, action: error.action },
    }
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      type: 'unknown',
    }
  }

  if (typeof error === 'string') {
    return {
      message: error,
      type: 'unknown',
    }
  }

  if (typeof error === 'object' && error !== null) {
    const err = error as any
    return {
      message: err.message || 'An unexpected error occurred',
      statusCode: err.statusCode || err.status,
      type: 'unknown',
      details: err,
    }
  }

  return {
    message: 'An unexpected error occurred',
    type: 'unknown',
  }
}

// HTTP Error Handler
export async function handleAPIResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`
    let errorDetails = null

    try {
      const errorData = await response.json()
      errorMessage = errorData.message || errorMessage
      errorDetails = errorData
    } catch {
      // If response is not JSON, use default message
    }

    throw new APIError(errorMessage, response.status, errorDetails)
  }

  try {
    return await response.json()
  } catch {
    throw new Error('Invalid JSON response')
  }
}

// Retry Logic
export async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    initialDelay?: number
    maxDelay?: number
    shouldRetry?: (error: unknown, attempt: number) => boolean
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    shouldRetry = (error) => error instanceof NetworkError,
  } = options

  let lastError: unknown

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      if (attempt === maxRetries - 1 || !shouldRetry(error, attempt)) {
        throw error
      }

      const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

// Error Logging
export function logError(error: unknown, context?: Record<string, any>) {
  const errorInfo = parseError(error)

  // Log error information - in production, send to error tracking service
  const errorLog = {
    message: errorInfo.message,
    type: errorInfo.type,
    statusCode: errorInfo.statusCode,
    details: errorInfo.details,
    context,
    timestamp: new Date().toISOString(),
    stack: error instanceof Error ? error.stack : undefined,
  }

  // In production, you would send this to an error tracking service
  // like Sentry, LogRocket, etc.
}

// Safe JSON Parse
export function safeJSONParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json)
  } catch {
    return fallback
  }
}

// Error Message Formatter
export function formatErrorMessage(error: unknown): string {
  const { message, type, statusCode } = parseError(error)

  switch (type) {
    case 'network':
      return 'Unable to connect to the server. Please check your internet connection.'
    case 'permission':
      return 'You do not have permission to perform this action.'
    case 'notfound':
      return message
    case 'validation':
      return 'Please check your input and try again.'
    case 'api':
      if (statusCode === 500) {
        return 'A server error occurred. Please try again later.'
      }
      if (statusCode === 503) {
        return 'Service temporarily unavailable. Please try again later.'
      }
      return message
    default:
      return message || 'An unexpected error occurred.'
  }
}
