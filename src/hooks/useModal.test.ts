import { renderHook, act } from '@testing-library/react'
import { useModal } from './useModal'

describe('useModal', () => {
  describe('initialization', () => {
    it('should initialize with default closed state', () => {
      const { result } = renderHook(() => useModal())

      expect(result.current.isOpen).toBe(false)
      expect(result.current.data).toBe(null)
    })

    it('should initialize with provided initial state', () => {
      const { result } = renderHook(() => useModal(true))

      expect(result.current.isOpen).toBe(true)
      expect(result.current.data).toBe(null)
    })
  })

  describe('open functionality', () => {
    it('should open modal without data', () => {
      const { result } = renderHook(() => useModal())

      act(() => {
        result.current.open()
      })

      expect(result.current.isOpen).toBe(true)
      expect(result.current.data).toBeUndefined()
    })

    it('should open modal with data', () => {
      const { result } = renderHook(() => useModal())
      const testData = { id: 1, name: 'Test' }

      act(() => {
        result.current.open(testData)
      })

      expect(result.current.isOpen).toBe(true)
      expect(result.current.data).toEqual(testData)
    })

    it('should open modal with different data types', () => {
      const { result } = renderHook(() => useModal())

      // Test with string
      act(() => {
        result.current.open('test string')
      })
      expect(result.current.data).toBe('test string')

      // Test with number
      act(() => {
        result.current.open(42)
      })
      expect(result.current.data).toBe(42)

      // Test with boolean
      act(() => {
        result.current.open(true)
      })
      expect(result.current.data).toBe(true)

      // Test with array
      const testArray = [1, 2, 3]
      act(() => {
        result.current.open(testArray)
      })
      expect(result.current.data).toEqual(testArray)
    })
  })

  describe('close functionality', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
    })

    it('should close modal and clear data after timeout', () => {
      const { result } = renderHook(() => useModal())
      const testData = { id: 1, name: 'Test' }

      // Open modal with data
      act(() => {
        result.current.open(testData)
      })

      expect(result.current.isOpen).toBe(true)
      expect(result.current.data).toEqual(testData)

      // Close modal
      act(() => {
        result.current.close()
      })

      expect(result.current.isOpen).toBe(false)
      expect(result.current.data).toEqual(testData) // Data should still be there

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(200)
      })

      expect(result.current.data).toBe(null) // Data should be cleared after timeout
    })

    it('should close modal even when already closed', () => {
      const { result } = renderHook(() => useModal())

      expect(result.current.isOpen).toBe(false)

      act(() => {
        result.current.close()
      })

      expect(result.current.isOpen).toBe(false)
    })
  })

  describe('toggle functionality', () => {
    it('should toggle from closed to open', () => {
      const { result } = renderHook(() => useModal())

      expect(result.current.isOpen).toBe(false)

      act(() => {
        result.current.toggle()
      })

      expect(result.current.isOpen).toBe(true)
    })

    it('should toggle from open to closed', () => {
      const { result } = renderHook(() => useModal(true))

      expect(result.current.isOpen).toBe(true)

      act(() => {
        result.current.toggle()
      })

      expect(result.current.isOpen).toBe(false)
    })

    it('should toggle multiple times', () => {
      const { result } = renderHook(() => useModal())

      expect(result.current.isOpen).toBe(false)

      act(() => {
        result.current.toggle()
      })
      expect(result.current.isOpen).toBe(true)

      act(() => {
        result.current.toggle()
      })
      expect(result.current.isOpen).toBe(false)

      act(() => {
        result.current.toggle()
      })
      expect(result.current.isOpen).toBe(true)
    })
  })

  describe('setData functionality', () => {
    it('should allow direct data manipulation', () => {
      const { result } = renderHook(() => useModal())
      const testData = { message: 'Hello World' }

      act(() => {
        result.current.setData(testData)
      })

      expect(result.current.data).toEqual(testData)
    })

    it('should allow data updates while modal is open', () => {
      const { result } = renderHook(() => useModal())
      const initialData = { step: 1 }
      const updatedData = { step: 2 }

      act(() => {
        result.current.open(initialData)
      })

      expect(result.current.data).toEqual(initialData)

      act(() => {
        result.current.setData(updatedData)
      })

      expect(result.current.data).toEqual(updatedData)
      expect(result.current.isOpen).toBe(true)
    })
  })

  describe('callback stability', () => {
    it('should have stable callback references', () => {
      const { result, rerender } = renderHook(() => useModal())

      const initialOpen = result.current.open
      const initialClose = result.current.close
      const initialToggle = result.current.toggle
      const initialSetData = result.current.setData

      rerender()

      expect(result.current.open).toBe(initialOpen)
      expect(result.current.close).toBe(initialClose)
      expect(result.current.toggle).toBe(initialToggle)
      expect(result.current.setData).toBe(initialSetData)
    })
  })

  describe('edge cases', () => {
    it('should handle undefined data', () => {
      const { result } = renderHook(() => useModal())

      act(() => {
        result.current.open(undefined)
      })

      expect(result.current.isOpen).toBe(true)
      expect(result.current.data).toBeUndefined()
    })

    it('should handle null data explicitly', () => {
      const { result } = renderHook(() => useModal())

      act(() => {
        result.current.open(null)
      })

      expect(result.current.isOpen).toBe(true)
      expect(result.current.data).toBe(null)
    })

    it('should handle complex nested objects', () => {
      const { result } = renderHook(() => useModal())
      const complexData = {
        user: {
          id: 1,
          profile: {
            name: 'John Doe',
            settings: {
              theme: 'dark',
              notifications: true
            }
          }
        },
        metadata: ['tag1', 'tag2']
      }

      act(() => {
        result.current.open(complexData)
      })

      expect(result.current.data).toEqual(complexData)
    })
  })
})