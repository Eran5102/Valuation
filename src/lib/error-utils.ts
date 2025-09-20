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
      details: error.details
    }
  }

  if (error instanceof ValidationError) {
    return {
      message: error.message,
      type: 'validation',
      details: error.fields
    }
  }

  if (error instanceof NetworkError) {
    return {
      message: error.message,
      type: 'network'
    }
  }

  if (error instanceof NotFoundError) {
    return {
      message: error.message,
      statusCode: 404,
      type: 'notfound',
      details: { resource: error.resource }
    }
  }

  if (error instanceof PermissionError) {
    return {
      message: error.message,
      statusCode: 403,
      type: 'permission',
      details: { resource: error.resource, action: error.action }
    }
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      type: 'unknown'
    }
  }

  if (typeof error === 'string') {
    return {
      message: error,
      type: 'unknown'
    }
  }

  if (typeof error === 'object' && error !== null) {
    const err = error as any
    return {
      message: err.message || 'An unexpected error occurred',
      statusCode: err.statusCode || err.status,
      type: 'unknown',
      details: err
    }
  }

  return {
    message: 'An unexpected error occurred',
    type: 'unknown'
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

// Form Validation Helper
export function validateForm<T extends Record<string, any>>(
  data: T,
  rules: Record<keyof T, ((value: any) => string | null)[]>
): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  for (const [field, validators] of Object.entries(rules) as [keyof T, ((value: any) => string | null)[]][]) {
    const value = data[field]
    for (const validator of validators) {
      const error = validator(value)
      if (error) {
        errors[field as string] = error
        break
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Common Validators
export const validators = {
  required: (message?: string) => (value: any) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return message || 'This field is required'
    }
    return null
  },

  email: (message?: string) => (value: string) => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return message || 'Invalid email address'
    }
    return null
  },

  min: (min: number, message?: string) => (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    if (!isNaN(num) && num < min) {
      return message || `Must be at least ${min}`
    }
    return null
  },

  max: (max: number, message?: string) => (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    if (!isNaN(num) && num > max) {
      return message || `Must be at most ${max}`
    }
    return null
  },

  minLength: (min: number, message?: string) => (value: string) => {
    if (value && value.length < min) {
      return message || `Must be at least ${min} characters`
    }
    return null
  },

  maxLength: (max: number, message?: string) => (value: string) => {
    if (value && value.length > max) {
      return message || `Must be at most ${max} characters`
    }
    return null
  },

  pattern: (pattern: RegExp, message?: string) => (value: string) => {
    if (value && !pattern.test(value)) {
      return message || 'Invalid format'
    }
    return null
  },

  url: (message?: string) => (value: string) => {
    if (value) {
      try {
        new URL(value)
      } catch {
        return message || 'Invalid URL'
      }
    }
    return null
  },

  date: (message?: string) => (value: string) => {
    if (value && isNaN(Date.parse(value))) {
      return message || 'Invalid date'
    }
    return null
  },

  number: (message?: string) => (value: any) => {
    if (value !== '' && value != null && isNaN(Number(value))) {
      return message || 'Must be a number'
    }
    return null
  },

  integer: (message?: string) => (value: any) => {
    if (value !== '' && value != null && !Number.isInteger(Number(value))) {
      return message || 'Must be an integer'
    }
    return null
  },

  positive: (message?: string) => (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    if (!isNaN(num) && num <= 0) {
      return message || 'Must be positive'
    }
    return null
  },

  nonNegative: (message?: string) => (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    if (!isNaN(num) && num < 0) {
      return message || 'Must be non-negative'
    }
    return null
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
    shouldRetry = (error) => error instanceof NetworkError
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
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

// Error Logging
export function logError(error: unknown, context?: Record<string, any>) {
  const errorInfo = parseError(error)

  console.error('Error occurred:', {
    message: errorInfo.message,
    type: errorInfo.type,
    statusCode: errorInfo.statusCode,
    details: errorInfo.details,
    context,
    timestamp: new Date().toISOString(),
    stack: error instanceof Error ? error.stack : undefined
  })

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