// Comprehensive error handling utilities for the 409A valuation app

import { ApiError, ApiErrorResponse } from '@/types/api'

// Error type definitions
export interface AppError extends Error {
  code?: string
  status?: number
  details?: Record<string, unknown>
  context?: Record<string, unknown>
}

export interface ErrorContext {
  component?: string
  action?: string
  userId?: string
  valuationId?: string
  metadata?: Record<string, unknown>
}

// Custom error classes
export class ValidationError extends Error implements AppError {
  code = 'VALIDATION_ERROR'
  status = 400
  details: Record<string, unknown>

  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message)
    this.name = 'ValidationError'
    this.details = details
  }
}

export class AuthenticationError extends Error implements AppError {
  code = 'AUTHENTICATION_ERROR'
  status = 401

  constructor(message = 'Authentication required') {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends Error implements AppError {
  code = 'AUTHORIZATION_ERROR'
  status = 403

  constructor(message = 'Access denied') {
    super(message)
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends Error implements AppError {
  code = 'NOT_FOUND'
  status = 404

  constructor(resource: string = 'Resource') {
    super(`${resource} not found`)
    this.name = 'NotFoundError'
  }
}

export class BusinessLogicError extends Error implements AppError {
  code = 'BUSINESS_LOGIC_ERROR'
  status = 422
  details: Record<string, unknown>

  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message)
    this.name = 'BusinessLogicError'
    this.details = details
  }
}

export class NetworkError extends Error implements AppError {
  code = 'NETWORK_ERROR'
  status = 0

  constructor(message = 'Network error occurred') {
    super(message)
    this.name = 'NetworkError'
  }
}

// Error handling functions
export function createApiError(
  message: string,
  code: string = 'UNKNOWN_ERROR',
  status: number = 500,
  details?: Record<string, unknown>
): AppError {
  const error = new Error(message) as AppError
  error.code = code
  error.status = status
  error.details = details
  return error
}

export function parseApiError(error: unknown): ApiError {
  // Handle our custom AppError instances
  if (isAppError(error)) {
    return {
      message: error.message,
      type: mapErrorCodeToType(error.code),
      status: error.status,
      details: error.details as Record<string, string | string[]>,
    }
  }

  // Handle fetch errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      message: 'Network error. Please check your connection and try again.',
      type: 'network',
      status: 0,
    }
  }

  // Handle Response objects
  if (error instanceof Response) {
    return {
      message: `HTTP ${error.status} Error`,
      type: mapStatusToType(error.status),
      status: error.status,
    }
  }

  // Handle generic Error objects
  if (error instanceof Error) {
    return {
      message: error.message || 'An unexpected error occurred',
      type: 'server',
    }
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      message: error,
      type: 'server',
    }
  }

  // Fallback for unknown error types
  return {
    message: 'An unexpected error occurred',
    type: 'server',
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof Error && 'code' in error && 'status' in error
}

function mapErrorCodeToType(code?: string): ApiError['type'] {
  switch (code) {
    case 'VALIDATION_ERROR':
      return 'validation'
    case 'AUTHENTICATION_ERROR':
      return 'authentication'
    case 'AUTHORIZATION_ERROR':
      return 'authorization'
    case 'NOT_FOUND':
      return 'not_found'
    case 'NETWORK_ERROR':
      return 'network'
    default:
      return 'server'
  }
}

function mapStatusToType(status: number): ApiError['type'] {
  switch (status) {
    case 400:
      return 'validation'
    case 401:
      return 'authentication'
    case 403:
      return 'authorization'
    case 404:
      return 'not_found'
    case 429:
      return 'rate_limit'
    default:
      return 'server'
  }
}

// Async wrapper with error handling
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: ErrorContext
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    const appError = enhanceError(error, context)
    logError(appError, context)
    throw appError
  }
}

// Enhance error with additional context
export function enhanceError(error: unknown, context?: ErrorContext): AppError {
  const appError = isAppError(error)
    ? error
    : createApiError(error instanceof Error ? error.message : 'Unknown error occurred')

  if (context) {
    appError.context = { ...appError.context, ...context }
  }

  return appError
}

// Centralized error logging
export function logError(error: AppError, context?: ErrorContext): void {
  const logData = {
    error: {
      name: error.name,
      message: error.message,
      code: error.code,
      status: error.status,
      stack: error.stack,
    },
    context,
    timestamp: new Date().toISOString(),
  }

  console.error('Application Error:', logData)

  // In production, you might want to send this to an external logging service
  // like Sentry, LogRocket, or your own logging infrastructure
}

// Error boundary helper for React components
export function createErrorHandler(componentName: string) {
  return (error: Error, errorInfo: { componentStack: string }) => {
    const appError = enhanceError(error, {
      component: componentName,
      action: 'render',
    })

    logError(appError, {
      component: componentName,
      action: 'render',
      metadata: {
        componentStack: errorInfo.componentStack,
      },
    })
  }
}

// Retry mechanism for failed operations
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000,
  context?: ErrorContext
): Promise<T> {
  let lastError: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      if (attempt === maxAttempts) {
        break
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000

      logError(enhanceError(error, { ...context, action: `retry-attempt-${attempt}` }), context)

      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw enhanceError(lastError, context)
}

// Format error for user display
export function formatErrorForUser(error: unknown): string {
  const apiError = parseApiError(error)

  switch (apiError.type) {
    case 'validation':
      return apiError.message || 'Please check your input and try again.'
    case 'authentication':
      return 'Please log in to continue.'
    case 'authorization':
      return 'You do not have permission to perform this action.'
    case 'not_found':
      return 'The requested resource was not found.'
    case 'network':
      return 'Network error. Please check your connection and try again.'
    case 'rate_limit':
      return 'Too many requests. Please wait a moment and try again.'
    default:
      return 'An unexpected error occurred. Please try again later.'
  }
}

// Type guard for checking if an error is retryable
export function isRetryableError(error: unknown): boolean {
  if (isAppError(error)) {
    return error.status === undefined || error.status >= 500 || error.code === 'NETWORK_ERROR'
  }

  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true
  }

  return false
}

// Helper to create standardized API error responses
export function createApiErrorResponse(error: unknown, requestPath: string = ''): ApiErrorResponse {
  const apiError = parseApiError(error)

  return {
    error: {
      code: apiError.type?.toUpperCase() || 'UNKNOWN_ERROR',
      message: apiError.message,
      details: apiError.details,
    },
    status: apiError.status || 500,
    timestamp: new Date().toISOString(),
  }
}
