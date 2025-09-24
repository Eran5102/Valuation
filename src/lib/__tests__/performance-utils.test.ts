import {
  throttle,
  debounceWithImmediate,
  memoize,
  LRUCache,
  createLazyLoader,
  calculateVirtualItems,
  batchUpdates,
} from '../performance-utils'

describe('performance-utils', () => {
  // Test throttle function
  describe('throttle', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
    })

    it('should throttle function calls', () => {
      const mockFn = jest.fn()
      const throttledFn = throttle(mockFn, 100)

      throttledFn('first')
      throttledFn('second')
      throttledFn('third')

      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('first')

      jest.advanceTimersByTime(100)
      throttledFn('fourth')

      expect(mockFn).toHaveBeenCalledTimes(2)
      expect(mockFn).toHaveBeenCalledWith('fourth')
    })

    it('should preserve context', () => {
      const obj = {
        value: 'test',
        method: jest.fn(function (this: any) {
          return this.value
        }),
      }

      obj.method = throttle(obj.method, 100)
      const result = obj.method()

      expect(result).toBe('test')
    })
  })

  // Test debounceWithImmediate function
  describe('debounceWithImmediate', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
    })

    it('should debounce function calls', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounceWithImmediate(mockFn, 100)

      debouncedFn('first')
      debouncedFn('second')
      debouncedFn('third')

      expect(mockFn).not.toHaveBeenCalled()

      jest.advanceTimersByTime(100)

      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('third')
    })

    it('should handle immediate option', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounceWithImmediate(mockFn, 100, true)

      debouncedFn('first')
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('first')

      debouncedFn('second')
      expect(mockFn).toHaveBeenCalledTimes(1)

      jest.advanceTimersByTime(100)
      debouncedFn('third')
      expect(mockFn).toHaveBeenCalledTimes(2)
    })
  })

  // Test memoize function
  describe('memoize', () => {
    it('should cache function results', () => {
      const expensiveFn = jest.fn((n: number) => n * 2)
      const memoizedFn = memoize(expensiveFn)

      expect(memoizedFn(5)).toBe(10)
      expect(memoizedFn(5)).toBe(10)
      expect(memoizedFn(5)).toBe(10)

      expect(expensiveFn).toHaveBeenCalledTimes(1)

      expect(memoizedFn(3)).toBe(6)
      expect(expensiveFn).toHaveBeenCalledTimes(2)
    })

    it('should handle multiple arguments', () => {
      const fn = jest.fn((a: number, b: number) => a + b)
      const memoizedFn = memoize(fn)

      expect(memoizedFn(2, 3)).toBe(5)
      expect(memoizedFn(2, 3)).toBe(5)
      expect(fn).toHaveBeenCalledTimes(1)

      expect(memoizedFn(2, 4)).toBe(6)
      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('should handle objects as arguments', () => {
      const fn = jest.fn((obj: { x: number }) => obj.x * 2)
      const memoizedFn = memoize(fn)

      const obj1 = { x: 5 }
      const obj2 = { x: 5 }

      expect(memoizedFn(obj1)).toBe(10)
      expect(memoizedFn(obj1)).toBe(10)
      expect(fn).toHaveBeenCalledTimes(1)

      // Different object reference, even with same values
      expect(memoizedFn(obj2)).toBe(10)
      expect(fn).toHaveBeenCalledTimes(2)
    })
  })

  // Test LRUCache class
  describe('LRUCache', () => {
    it('should store and retrieve values', () => {
      const cache = new LRUCache<number>(3)

      cache.set('a', 1)
      cache.set('b', 2)
      cache.set('c', 3)

      expect(cache.get('a')).toBe(1)
      expect(cache.get('b')).toBe(2)
      expect(cache.get('c')).toBe(3)
      expect(cache.get('d')).toBeUndefined()
    })

    it('should evict least recently used item when capacity is reached', () => {
      const cache = new LRUCache<number>(3)

      cache.set('a', 1)
      cache.set('b', 2)
      cache.set('c', 3)
      cache.set('d', 4) // Should evict 'a'

      expect(cache.get('a')).toBeUndefined()
      expect(cache.get('b')).toBe(2)
      expect(cache.get('c')).toBe(3)
      expect(cache.get('d')).toBe(4)
    })

    it('should update LRU order on get', () => {
      const cache = new LRUCache<number>(3)

      cache.set('a', 1)
      cache.set('b', 2)
      cache.set('c', 3)

      // Access 'a', making it most recently used
      cache.get('a')

      cache.set('d', 4) // Should evict 'b', not 'a'

      expect(cache.get('a')).toBe(1)
      expect(cache.get('b')).toBeUndefined()
      expect(cache.get('c')).toBe(3)
      expect(cache.get('d')).toBe(4)
    })

    it('should handle has method', () => {
      const cache = new LRUCache<number>(2)

      cache.set('a', 1)
      expect(cache.has('a')).toBe(true)
      expect(cache.has('b')).toBe(false)
    })

    it('should handle delete method', () => {
      const cache = new LRUCache<number>(2)

      cache.set('a', 1)
      cache.set('b', 2)

      cache.delete('a')
      expect(cache.get('a')).toBeUndefined()
      expect(cache.get('b')).toBe(2)
    })

    it('should handle clear method', () => {
      const cache = new LRUCache<number>(2)

      cache.set('a', 1)
      cache.set('b', 2)

      cache.clear()
      expect(cache.get('a')).toBeUndefined()
      expect(cache.get('b')).toBeUndefined()
    })
  })

  // Test createLazyLoader
  describe('createLazyLoader', () => {
    let observe: jest.Mock
    let disconnect: jest.Mock
    let unobserve: jest.Mock

    beforeEach(() => {
      observe = jest.fn()
      disconnect = jest.fn()
      unobserve = jest.fn()

      // Mock IntersectionObserver
      global.IntersectionObserver = jest.fn().mockImplementation((callback, options) => ({
        observe,
        disconnect,
        unobserve,
        root: null,
        rootMargin: '',
        thresholds: [],
        takeRecords: () => [],
      }))
    })

    it('should create an IntersectionObserver with correct options', () => {
      const callback = jest.fn()
      const options = { rootMargin: '50px', threshold: 0.1 }

      createLazyLoader(callback, options)

      expect(IntersectionObserver).toHaveBeenCalledWith(callback, options)
    })

    it('should return null if IntersectionObserver is not supported', () => {
      const originalIO = global.IntersectionObserver
      // @ts-ignore
      global.IntersectionObserver = undefined

      const result = createLazyLoader(jest.fn())
      expect(result).toBeNull()

      global.IntersectionObserver = originalIO
    })
  })

  // Test calculateVirtualItems
  describe('calculateVirtualItems', () => {
    const createMockItems = (count: number) =>
      Array.from({ length: count }, (_, i) => ({ id: i, value: `item-${i}` }))

    it('should calculate visible items correctly', () => {
      const items = createMockItems(100)
      const result = calculateVirtualItems(items, {
        itemHeight: 50,
        containerHeight: 200,
        buffer: 1,
        getScrollTop: () => 100,
        setScrollHeight: jest.fn(),
      })

      // At scroll position 100 with item height 50:
      // - Item at index 2 starts at position 100
      // - Container height 200 shows 4 items
      // - With buffer of 1, we show 1 extra item on each side
      expect(result.startIndex).toBe(1) // One before visible
      expect(result.endIndex).toBe(6) // Through 4 visible + 1 buffer
      expect(result.visibleItems).toHaveLength(6)
      expect(result.offsetY).toBe(50) // Start offset
    })

    it('should handle scroll at top', () => {
      const items = createMockItems(100)
      const result = calculateVirtualItems(items, {
        itemHeight: 50,
        containerHeight: 200,
        buffer: 1,
        getScrollTop: () => 0,
        setScrollHeight: jest.fn(),
      })

      expect(result.startIndex).toBe(0)
      expect(result.offsetY).toBe(0)
    })

    it('should handle scroll at bottom', () => {
      const items = createMockItems(10)
      const result = calculateVirtualItems(items, {
        itemHeight: 50,
        containerHeight: 200,
        buffer: 1,
        getScrollTop: () => 400, // Near bottom
        setScrollHeight: jest.fn(),
      })

      expect(result.endIndex).toBe(9) // Last item
    })

    it('should handle empty items', () => {
      const result = calculateVirtualItems([], {
        itemHeight: 50,
        containerHeight: 200,
        buffer: 1,
        getScrollTop: () => 0,
        setScrollHeight: jest.fn(),
      })

      expect(result.visibleItems).toHaveLength(0)
      expect(result.startIndex).toBe(0)
      expect(result.endIndex).toBe(-1)
    })
  })

  // Test batchUpdates
  describe('batchUpdates', () => {
    it('should batch multiple updates', () => {
      const update1 = jest.fn()
      const update2 = jest.fn()
      const update3 = jest.fn()

      batchUpdates([update1, update2, update3])

      expect(update1).toHaveBeenCalled()
      expect(update2).toHaveBeenCalled()
      expect(update3).toHaveBeenCalled()
    })

    it('should handle empty array', () => {
      expect(() => batchUpdates([])).not.toThrow()
    })

    it('should handle errors in updates', () => {
      const update1 = jest.fn()
      const update2 = jest.fn(() => {
        throw new Error('Update failed')
      })
      const update3 = jest.fn()

      expect(() => batchUpdates([update1, update2, update3])).toThrow('Update failed')
      expect(update1).toHaveBeenCalled()
      expect(update2).toHaveBeenCalled()
      expect(update3).not.toHaveBeenCalled()
    })
  })
})
