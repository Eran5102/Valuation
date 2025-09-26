import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  parseError,
  formatErrorMessage,
  logError,
  APIError,
  NotFoundError,
  PermissionError,
  NetworkError,
  ValidationError
} from '@/lib/error-utils'

// useError Hook
interface UseErrorOptions {
  autoLog?: boolean
  autoRedirect?: boolean
  redirectPath?: string
  onError?: (error: unknown) => void
}

export function useError(options: UseErrorOptions = {}) {
  const [error, setError] = useState<unknown>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const {
    autoLog = true,
    autoRedirect = false,
    redirectPath = '/error',
    onError
  } = options

  const handleError = useCallback((error: unknown) => {
    setError(error)

    if (autoLog) {
      logError(error)
    }

    if (onError) {
      onError(error)
    }

    const parsedError = parseError(error)

    if (autoRedirect) {
      if (parsedError.statusCode === 404) {
        router.push('/404')
      } else if (parsedError.statusCode === 403) {
        router.push('/403')
      } else if (parsedError.statusCode === 401) {
        router.push('/login')
      } else if (parsedError.statusCode && parsedError.statusCode >= 500) {
        router.push(redirectPath)
      }
    }
  }, [autoLog, autoRedirect, redirectPath, onError, router])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const executeAsync = useCallback(async <T,>(
    fn: () => Promise<T>
  ): Promise<T | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await fn()
      setIsLoading(false)
      return result
    } catch (error) {
      handleError(error)
      setIsLoading(false)
      return null
    }
  }, [handleError])

  return {
    error,
    isLoading,
    handleError,
    clearError,
    executeAsync,
    errorMessage: error ? formatErrorMessage(error) : null
  }
}

// useAPICall Hook
interface UseAPICallOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: unknown) => void
  retryCount?: number
  retryDelay?: number
}

export function useAPICall<T = unknown>(
  apiCall: () => Promise<T>,
  options: UseAPICallOptions<T> = {}
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const {
    onSuccess,
    onError,
    retryCount = 0,
    retryDelay = 1000
  } = options

  const execute = useCallback(async () => {
    setLoading(true)
    setError(null)

    let lastError: unknown = null
    let attempts = 0

    while (attempts <= retryCount) {
      try {
        const result = await apiCall()
        setData(result)
        setLoading(false)
        onSuccess?.(result)
        return result
      } catch (err) {
        lastError = err
        attempts++

        if (attempts <= retryCount) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempts))
        }
      }
    }

    setError(lastError)
    setLoading(false)
    onError?.(lastError)
    logError(lastError)
    return null
  }, [apiCall, onSuccess, onError, retryCount, retryDelay])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return {
    data,
    loading,
    error,
    execute,
    reset,
    errorMessage: error ? formatErrorMessage(error) : null
  }
}

// useFormValidation Hook
interface UseFormValidationOptions {
  validateOnChange?: boolean
  validateOnBlur?: boolean
}

export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  validationRules: Record<keyof T, ((value: any) => string | null)[]>,
  options: UseFormValidationOptions = {}
) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Record<keyof T, string>>({} as Record<keyof T, string>)
  const [touched, setTouched] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    validateOnChange = true,
    validateOnBlur = true
  } = options

  const validateField = useCallback((field: keyof T, value: any): string | null => {
    const validators = validationRules[field] || []
    for (const validator of validators) {
      const error = validator(value)
      if (error) return error
    }
    return null
  }, [validationRules])

  const validateAllFields = useCallback((): boolean => {
    const newErrors: Record<keyof T, string> = {} as Record<keyof T, string>
    let isValid = true

    for (const field in validationRules) {
      const error = validateField(field, values[field])
      if (error) {
        newErrors[field] = error
        isValid = false
      }
    }

    setErrors(newErrors)
    return isValid
  }, [values, validationRules, validateField])

  const handleChange = useCallback((field: keyof T) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const value = e.target.type === 'checkbox'
      ? (e.target as HTMLInputElement).checked
      : e.target.value

    setValues(prev => ({ ...prev, [field]: value }))

    if (validateOnChange && touched[field]) {
      const error = validateField(field, value)
      setErrors(prev => ({ ...prev, [field]: error || '' }))
    }
  }, [validateOnChange, touched, validateField])

  const handleBlur = useCallback((field: keyof T) => () => {
    setTouched(prev => ({ ...prev, [field]: true }))

    if (validateOnBlur) {
      const error = validateField(field, values[field])
      setErrors(prev => ({ ...prev, [field]: error || '' }))
    }
  }, [validateOnBlur, values, validateField])

  const handleSubmit = useCallback((
    onSubmit: (values: T) => void | Promise<void>
  ) => async (e: React.FormEvent) => {
    e.preventDefault()

    setIsSubmitting(true)
    const allTouched = Object.keys(validationRules).reduce(
      (acc, field) => ({ ...acc, [field]: true }),
      {} as Record<keyof T, boolean>
    )
    setTouched(allTouched)

    if (validateAllFields()) {
      try {
        await onSubmit(values)
      } catch (error) {
        logError(error)
        throw error
      }
    }

    setIsSubmitting(false)
  }, [values, validationRules, validateAllFields])

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({} as Record<keyof T, string>)
    setTouched({} as Record<keyof T, boolean>)
    setIsSubmitting(false)
  }, [initialValues])

  const setFieldValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }))
  }, [])

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }))
  }, [])

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setFieldValue,
    setFieldError,
    validateField,
    validateAllFields,
    isValid: Object.keys(errors).length === 0
  }
}

// useAsyncError Hook for Error Boundaries
export function useAsyncError() {
  const [, setError] = useState()

  return useCallback((error: unknown) => {
    setError(() => {
      throw error
    })
  }, [])
}

// useRetry Hook
interface UseRetryOptions {
  maxAttempts?: number
  delay?: number
  backoff?: 'linear' | 'exponential'
  onRetry?: (attempt: number, error: unknown) => void
}

export function useRetry(options: UseRetryOptions = {}) {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = 'exponential',
    onRetry
  } = options

  const [attempt, setAttempt] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)

  const retry = useCallback(async <T,>(
    fn: () => Promise<T>
  ): Promise<T> => {
    setIsRetrying(true)
    let lastError: unknown

    for (let i = 0; i < maxAttempts; i++) {
      setAttempt(i + 1)

      try {
        const result = await fn()
        setIsRetrying(false)
        setAttempt(0)
        return result
      } catch (error) {
        lastError = error
        onRetry?.(i + 1, error)

        if (i < maxAttempts - 1) {
          const waitTime = backoff === 'exponential'
            ? delay * Math.pow(2, i)
            : delay * (i + 1)

          await new Promise(resolve => setTimeout(resolve, waitTime))
        }
      }
    }

    setIsRetrying(false)
    setAttempt(0)
    throw lastError
  }, [maxAttempts, delay, backoff, onRetry])

  const reset = useCallback(() => {
    setAttempt(0)
    setIsRetrying(false)
  }, [])

  return {
    attempt,
    isRetrying,
    retry,
    reset,
    canRetry: attempt < maxAttempts
  }
}

// useErrorToast Hook (requires a toast library)
export function useErrorToast() {
  const showError = useCallback((error: unknown, options?: {
    title?: string
    duration?: number
  }) => {
    const message = formatErrorMessage(error)

    // This would integrate with your toast library
    // For example, with shadcn/ui toast:
    // toast({
    //   title: options?.title || 'Error',
    //   description: message,
    //   variant: 'destructive',
    //   duration: options?.duration || 5000
    // })

  }, [])

  return { showError }
}