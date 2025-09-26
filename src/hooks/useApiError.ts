import { useState, useCallback } from 'react'

export interface ApiError {
  message: string
  type?:
    | 'validation'
    | 'authentication'
    | 'authorization'
    | 'not_found'
    | 'rate_limit'
    | 'server'
    | 'network'
  status?: number
  details?: Record<string, string | string[]>
}

interface UseApiErrorReturn {
  error: ApiError | null
  setError: (error: ApiError | null) => void
  clearError: () => void
  handleApiError: (error: any) => void
}

export function useApiError(): UseApiErrorReturn {
  const [error, setError] = useState<ApiError | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const handleApiError = useCallback((error: any) => {

    // Handle fetch errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      setError({
        message: 'Network error. Please check your connection and try again.',
        type: 'network',
        status: 0,
      })
      return
    }

    // Handle Response objects
    if (error instanceof Response) {
      error
        .json()
        .then((data: any) => {
          setError({
            message: data.error?.message || data.message || `HTTP ${error.status} Error`,
            type: data.error?.type || getErrorTypeFromStatus(error.status),
            status: error.status,
            details: data.error?.details,
          })
        })
        .catch(() => {
          setError({
            message: `HTTP ${error.status} Error`,
            type: getErrorTypeFromStatus(error.status),
            status: error.status,
          })
        })
      return
    }

    // Handle structured API errors
    if (error?.error) {
      setError({
        message: error.error.message || 'An error occurred',
        type: error.error.type || 'server',
        status: error.status,
        details: error.error.details,
      })
      return
    }

    // Handle Error objects
    if (error instanceof Error) {
      setError({
        message: error.message || 'An unexpected error occurred',
        type: 'server',
      })
      return
    }

    // Handle string errors
    if (typeof error === 'string') {
      setError({
        message: error,
        type: 'server',
      })
      return
    }

    // Fallback for unknown error types
    setError({
      message: 'An unexpected error occurred. Please try again.',
      type: 'server',
    })
  }, [])

  return {
    error,
    setError,
    clearError,
    handleApiError,
  }
}

function getErrorTypeFromStatus(status: number): ApiError['type'] {
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
    case 500:
    case 502:
    case 503:
    case 504:
      return 'server'
    default:
      return 'server'
  }
}

// Hook for handling form validation errors specifically
export function useFormError() {
  const [errors, setErrors] = useState<Record<string, string | string[]>>({})

  const setFieldError = useCallback((field: string, error: string | string[]) => {
    setErrors((prev) => ({ ...prev, [field]: error }))
  }, [])

  const clearFieldError = useCallback((field: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }, [])

  const clearAllErrors = useCallback(() => {
    setErrors({})
  }, [])

  const hasErrors = Object.keys(errors).length > 0

  const handleValidationError = useCallback((validationError: any) => {
    if (validationError?.details) {
      setErrors(validationError.details)
    } else if (validationError?.message) {
      setErrors({ general: validationError.message })
    }
  }, [])

  return {
    errors,
    hasErrors,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    handleValidationError,
  }
}

// Hook for retry logic with exponential backoff
export function useRetry() {
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)

  const retry = useCallback(
    async (fn: () => Promise<any>, maxRetries = 3) => {
      setIsRetrying(true)

      try {
        const result = await fn()
        setRetryCount(0) // Reset on success
        return result
      } catch (error) {
        if (retryCount < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, retryCount) * 1000

          setTimeout(() => {
            setRetryCount((prev) => prev + 1)
            retry(fn, maxRetries)
          }, delay)
        } else {
          // Max retries reached, throw the error
          setRetryCount(0)
          throw error
        }
      } finally {
        setIsRetrying(false)
      }
    },
    [retryCount]
  )

  const reset = useCallback(() => {
    setRetryCount(0)
    setIsRetrying(false)
  }, [])

  return {
    retry,
    retryCount,
    isRetrying,
    reset,
  }
}

// Hook for optimistic updates with error rollback
export function useOptimisticUpdate<T>(initialData: T) {
  const [data, setData] = useState<T>(initialData)
  const [originalData, setOriginalData] = useState<T>(initialData)
  const [isOptimistic, setIsOptimistic] = useState(false)

  const performOptimisticUpdate = useCallback(
    (newData: T, updateFn: () => Promise<T>) => {
      setOriginalData(data)
      setData(newData)
      setIsOptimistic(true)

      return updateFn()
        .then((result) => {
          setData(result)
          setIsOptimistic(false)
          return result
        })
        .catch((error) => {
          // Rollback on error
          setData(originalData)
          setIsOptimistic(false)
          throw error
        })
    },
    [data, originalData]
  )

  return {
    data,
    isOptimistic,
    performOptimisticUpdate,
    setData,
  }
}
