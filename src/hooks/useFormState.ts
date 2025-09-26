import { useState, useCallback } from 'react'

/**
 * Custom hook for managing form state with loading and error handling
 */
export function useFormState<T>(initialState: T) {
  const [data, setData] = useState<T>(initialState)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  const updateField = useCallback((field: keyof T, value: any) => {
    setData(prev => ({
      ...prev,
      [field]: value
    }))
    setHasChanges(true)
    setError(null)
  }, [])

  const updateData = useCallback((updates: Partial<T>) => {
    setData(prev => ({
      ...prev,
      ...updates
    }))
    setHasChanges(true)
    setError(null)
  }, [])

  const reset = useCallback(() => {
    setData(initialState)
    setHasChanges(false)
    setError(null)
  }, [initialState])

  const setLoaded = useCallback((newData: T) => {
    setData(newData)
    setHasChanges(false)
    setError(null)
  }, [])

  return {
    data,
    setData,
    loading,
    setLoading,
    error,
    setError,
    hasChanges,
    setHasChanges,
    updateField,
    updateData,
    reset,
    setLoaded
  }
}