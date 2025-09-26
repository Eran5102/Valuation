import { renderHook, act, waitFor } from '@testing-library/react'
import { useDataFetch } from './useDataFetch'

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('useDataFetch', () => {
  beforeEach(() => {
    mockFetch.mockClear()
    mockFetch.mockReset()
  })

  describe('initialization', () => {
    it('should initialize with default state', () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: 'test' })
      })

      const { result } = renderHook(() =>
        useDataFetch('/api/test', { autoFetch: false })
      )

      expect(result.current.data).toBe(null)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it('should auto-fetch by default', async () => {
      const mockData = { id: 1, name: 'Test' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData)
      })

      const { result } = renderHook(() => useDataFetch('/api/test'))

      expect(result.current.loading).toBe(true)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toEqual(mockData)
      expect(result.current.error).toBe(null)
      expect(mockFetch).toHaveBeenCalledWith('/api/test')
    })

    it('should not auto-fetch when disabled', () => {
      const { result } = renderHook(() =>
        useDataFetch('/api/test', { autoFetch: false })
      )

      expect(result.current.loading).toBe(false)
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('successful data fetching', () => {
    it('should fetch and set data successfully', async () => {
      const mockData = { users: [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }] }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData)
      })

      const { result } = renderHook(() =>
        useDataFetch<typeof mockData>('/api/users', { autoFetch: false })
      )

      act(() => {
        result.current.refetch()
      })

      expect(result.current.loading).toBe(true)
      expect(result.current.error).toBe(null)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toEqual(mockData)
      expect(result.current.error).toBe(null)
    })

    it('should handle different data types', async () => {
      // Test string response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve('string response')
      })

      const { result: stringResult } = renderHook(() =>
        useDataFetch<string>('/api/string', { autoFetch: false })
      )

      act(() => {
        stringResult.current.refetch()
      })

      await waitFor(() => {
        expect(stringResult.current.loading).toBe(false)
      })

      expect(stringResult.current.data).toBe('string response')

      // Test number response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(42)
      })

      const { result: numberResult } = renderHook(() =>
        useDataFetch<number>('/api/number', { autoFetch: false })
      )

      act(() => {
        numberResult.current.refetch()
      })

      await waitFor(() => {
        expect(numberResult.current.loading).toBe(false)
      })

      expect(numberResult.current.data).toBe(42)

      // Test array response
      const arrayData = [1, 2, 3, 4, 5]
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(arrayData)
      })

      const { result: arrayResult } = renderHook(() =>
        useDataFetch<number[]>('/api/array', { autoFetch: false })
      )

      act(() => {
        arrayResult.current.refetch()
      })

      await waitFor(() => {
        expect(arrayResult.current.loading).toBe(false)
      })

      expect(arrayResult.current.data).toEqual(arrayData)
    })
  })

  describe('error handling', () => {
    it('should handle HTTP error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found'
      })

      const { result } = renderHook(() =>
        useDataFetch('/api/notfound', { autoFetch: false })
      )

      act(() => {
        result.current.refetch()
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toBe(null)
      expect(result.current.error).toBe('Error: Not Found')
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() =>
        useDataFetch('/api/error', { autoFetch: false })
      )

      act(() => {
        result.current.refetch()
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toBe(null)
      expect(result.current.error).toBe('Network error')
    })

    it('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      })

      const { result } = renderHook(() =>
        useDataFetch('/api/invalid-json', { autoFetch: false })
      )

      act(() => {
        result.current.refetch()
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toBe(null)
      expect(result.current.error).toBe('Invalid JSON')
    })

    it('should handle non-Error objects in catch', async () => {
      mockFetch.mockRejectedValueOnce('String error')

      const { result } = renderHook(() =>
        useDataFetch('/api/string-error', { autoFetch: false })
      )

      act(() => {
        result.current.refetch()
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe('Failed to fetch data')
    })
  })

  describe('refetch functionality', () => {
    it('should refetch data when called', async () => {
      const initialData = { count: 1 }
      const refetchedData = { count: 2 }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(initialData)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(refetchedData)
        })

      const { result } = renderHook(() => useDataFetch('/api/counter'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toEqual(initialData)

      act(() => {
        result.current.refetch()
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toEqual(refetchedData)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('should clear previous error on refetch', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true })
        })

      const { result } = renderHook(() => useDataFetch('/api/retry'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe('First error')

      act(() => {
        result.current.refetch()
      })

      expect(result.current.error).toBe(null) // Error should be cleared immediately

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toEqual({ success: true })
      expect(result.current.error).toBe(null)
    })
  })

  describe('setData functionality', () => {
    it('should allow manual data updates', async () => {
      const { result } = renderHook(() =>
        useDataFetch('/api/test', { autoFetch: false })
      )

      const newData = { manually: 'set' }

      act(() => {
        result.current.setData(newData)
      })

      expect(result.current.data).toEqual(newData)
    })

    it('should preserve manually set data during loading states', async () => {
      mockFetch.mockImplementation(() =>
        new Promise(resolve =>
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ fetched: true })
          }), 100)
        )
      )

      const { result } = renderHook(() =>
        useDataFetch('/api/slow', { autoFetch: false })
      )

      const manualData = { manual: true }

      act(() => {
        result.current.setData(manualData)
      })

      expect(result.current.data).toEqual(manualData)

      act(() => {
        result.current.refetch()
      })

      expect(result.current.loading).toBe(true)
      // Data should be preserved during loading
      expect(result.current.data).toEqual(manualData)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      }, { timeout: 200 })

      expect(result.current.data).toEqual({ fetched: true })
    })
  })

  describe('URL changes', () => {
    it('should refetch when URL changes and autoFetch is enabled', async () => {
      const firstData = { endpoint: 'first' }
      const secondData = { endpoint: 'second' }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(firstData)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(secondData)
        })

      let url = '/api/first'
      const { result, rerender } = renderHook(() => useDataFetch(url))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toEqual(firstData)

      // Change URL
      url = '/api/second'
      rerender()

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toEqual(secondData)
      expect(mockFetch).toHaveBeenNthCalledWith(1, '/api/first')
      expect(mockFetch).toHaveBeenNthCalledWith(2, '/api/second')
    })
  })

  describe('callback stability', () => {
    it('should have stable refetch and setData callbacks', () => {
      const { result, rerender } = renderHook(() =>
        useDataFetch('/api/test', { autoFetch: false })
      )

      const initialRefetch = result.current.refetch
      const initialSetData = result.current.setData

      rerender()

      expect(result.current.refetch).toBe(initialRefetch)
      expect(result.current.setData).toBe(initialSetData)
    })
  })

  describe('loading state management', () => {
    it('should manage loading state correctly during concurrent requests', async () => {
      let resolveFirst: (value: any) => void
      let resolveSecond: (value: any) => void

      const firstPromise = new Promise(resolve => { resolveFirst = resolve })
      const secondPromise = new Promise(resolve => { resolveSecond = resolve })

      mockFetch
        .mockReturnValueOnce(firstPromise)
        .mockReturnValueOnce(secondPromise)

      const { result } = renderHook(() =>
        useDataFetch('/api/concurrent', { autoFetch: false })
      )

      // Start first request
      act(() => {
        result.current.refetch()
      })

      expect(result.current.loading).toBe(true)

      // Start second request before first completes
      act(() => {
        result.current.refetch()
      })

      expect(result.current.loading).toBe(true)

      // Resolve second request first
      act(() => {
        resolveSecond({
          ok: true,
          json: () => Promise.resolve({ second: true })
        })
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toEqual({ second: true })

      // Resolve first request (should not override second)
      act(() => {
        resolveFirst({
          ok: true,
          json: () => Promise.resolve({ first: true })
        })
      })

      // Wait a bit to ensure first request doesn't override
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(result.current.data).toEqual({ second: true })
    })
  })
})