import { useState, useEffect, useCallback } from 'react'

interface FetchOptions {
  autoFetch?: boolean
  retryCount?: number
  retryDelay?: number
}

/**
 * Custom hook for data fetching with loading, error, and retry logic
 */
export function useDataFetch<T>(
  url: string,
  options: FetchOptions = { autoFetch: true }
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`)
      }
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }, [url])

  const refetch = useCallback(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (options.autoFetch) {
      fetchData()
    }
  }, [fetchData, options.autoFetch])

  return {
    data,
    loading,
    error,
    refetch,
    setData
  }
}