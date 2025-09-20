import { useState, useCallback } from 'react'
import {
  parseApiError,
  formatErrorForUser,
  isRetryableError,
  retryOperation,
  withErrorHandling,
  ErrorContext,
  AppError,
} from '@/lib/utils/errorHandling'
import { ApiError } from '@/types/api'

interface UseErrorHandlerOptions {
  showUserFriendlyMessages?: boolean
  enableRetry?: boolean
  maxRetryAttempts?: number
  retryDelay?: number
  context?: ErrorContext
}

interface UseErrorHandlerReturn {
  error: ApiError | null
  isRetrying: boolean
  retryCount: number
  setError: (error: ApiError | null) => void
  clearError: () => void
  handleError: (error: unknown) => void
  executeWithErrorHandling: <T>(operation: () => Promise<T>) => Promise<T>
  executeWithRetry: <T>(operation: () => Promise<T>) => Promise<T>
  formatError: (error: unknown) => string
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}): UseErrorHandlerReturn {
  const {
    showUserFriendlyMessages = true,
    enableRetry = false,
    maxRetryAttempts = 3,
    retryDelay = 1000,
    context,
  } = options

  const [error, setError] = useState<ApiError | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  const clearError = useCallback(() => {
    setError(null)
    setRetryCount(0)
  }, [])

  const handleError = useCallback((error: unknown) => {
    const apiError = parseApiError(error)
    setError(apiError)

    // Log error for debugging
    console.error('Error handled by useErrorHandler:', error)
  }, [])

  const executeWithErrorHandling = useCallback(
    async <T>(operation: () => Promise<T>): Promise<T> => {
      try {
        clearError()
        return await withErrorHandling(operation, context)
      } catch (error) {
        handleError(error)
        throw error
      }
    },
    [context, clearError, handleError]
  )

  const executeWithRetry = useCallback(
    async <T>(operation: () => Promise<T>): Promise<T> => {
      if (!enableRetry) {
        return executeWithErrorHandling(operation)
      }

      try {
        clearError()
        setIsRetrying(true)

        const result = await retryOperation(operation, maxRetryAttempts, retryDelay, context)

        setRetryCount(0)
        return result
      } catch (error) {
        handleError(error)
        throw error
      } finally {
        setIsRetrying(false)
      }
    },
    [
      enableRetry,
      executeWithErrorHandling,
      clearError,
      maxRetryAttempts,
      retryDelay,
      context,
      handleError,
    ]
  )

  const formatError = useCallback(
    (error: unknown): string => {
      if (showUserFriendlyMessages) {
        return formatErrorForUser(error)
      }

      const apiError = parseApiError(error)
      return apiError.message
    },
    [showUserFriendlyMessages]
  )

  return {
    error,
    isRetrying,
    retryCount,
    setError,
    clearError,
    handleError,
    executeWithErrorHandling,
    executeWithRetry,
    formatError,
  }
}

// Specialized hook for API operations
export function useApiErrorHandler(valuationId?: string) {
  return useErrorHandler({
    showUserFriendlyMessages: true,
    enableRetry: true,
    maxRetryAttempts: 3,
    retryDelay: 1000,
    context: {
      component: 'api-operation',
      valuationId,
    },
  })
}

// Specialized hook for form validation
export function useFormErrorHandler() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const setFieldError = useCallback((field: string, error: string) => {
    setFieldErrors((prev) => ({ ...prev, [field]: error }))
  }, [])

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }, [])

  const clearAllFieldErrors = useCallback(() => {
    setFieldErrors({})
  }, [])

  const hasFieldErrors = Object.keys(fieldErrors).length > 0

  const handleValidationError = useCallback((error: unknown) => {
    const apiError = parseApiError(error)

    if (apiError.details && typeof apiError.details === 'object') {
      const errors: Record<string, string> = {}

      Object.entries(apiError.details).forEach(([field, value]) => {
        if (typeof value === 'string') {
          errors[field] = value
        } else if (Array.isArray(value) && value.length > 0) {
          errors[field] = value[0]
        }
      })

      setFieldErrors(errors)
    } else {
      setFieldErrors({ general: apiError.message })
    }
  }, [])

  const baseErrorHandler = useErrorHandler({
    showUserFriendlyMessages: true,
    context: { component: 'form-validation' },
  })

  return {
    ...baseErrorHandler,
    fieldErrors,
    hasFieldErrors,
    setFieldError,
    clearFieldError,
    clearAllFieldErrors,
    handleValidationError,
  }
}

// Hook for optimistic updates with error rollback
export function useOptimisticErrorHandler<T>(initialData: T) {
  const [data, setData] = useState<T>(initialData)
  const [originalData, setOriginalData] = useState<T>(initialData)
  const [isOptimistic, setIsOptimistic] = useState(false)

  const errorHandler = useErrorHandler({
    showUserFriendlyMessages: true,
    context: { component: 'optimistic-update' },
  })

  const performOptimisticUpdate = useCallback(
    async (newData: T, updateFn: () => Promise<T>): Promise<T> => {
      try {
        // Store original data for rollback
        setOriginalData(data)

        // Apply optimistic update
        setData(newData)
        setIsOptimistic(true)

        // Perform actual update
        const result = await errorHandler.executeWithErrorHandling(updateFn)

        // Update with real result
        setData(result)
        setIsOptimistic(false)

        return result
      } catch (error) {
        // Rollback on error
        setData(originalData)
        setIsOptimistic(false)
        throw error
      }
    },
    [data, originalData, errorHandler]
  )

  return {
    data,
    isOptimistic,
    performOptimisticUpdate,
    setData,
    ...errorHandler,
  }
}
