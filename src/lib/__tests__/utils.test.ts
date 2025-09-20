import {
  cn,
  formatCurrency,
  formatCurrencyDetailed,
  formatNumber,
  formatPercentage,
  formatDate,
  getStatusColor,
  calculatePercentage,
  debounce,
  generateId,
} from '../utils'

describe('Utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
    })

    it('should handle conditional classes', () => {
      expect(cn('base', true && 'conditional', false && 'hidden')).toBe('base conditional')
    })

    it('should resolve Tailwind conflicts', () => {
      expect(cn('p-4', 'p-2')).toBe('p-2') // p-2 should override p-4
    })

    it('should handle arrays and objects', () => {
      expect(cn(['class1', 'class2'], { class3: true, class4: false })).toBe('class1 class2 class3')
    })

    it('should handle undefined and null values', () => {
      expect(cn('base', undefined, null, 'end')).toBe('base end')
    })
  })

  describe('formatCurrency', () => {
    it('should format currency with default settings', () => {
      expect(formatCurrency(1000)).toBe('$1,000')
      expect(formatCurrency(1000000)).toBe('$1,000,000')
    })

    it('should format currency with different currencies', () => {
      expect(formatCurrency(1000, 'EUR')).toBe('€1,000')
      expect(formatCurrency(1000, 'GBP')).toBe('£1,000')
    })

    it('should handle zero and negative values', () => {
      expect(formatCurrency(0)).toBe('$0')
      expect(formatCurrency(-1000)).toBe('-$1,000')
    })

    it('should round to nearest dollar', () => {
      expect(formatCurrency(1000.99)).toBe('$1,001')
      expect(formatCurrency(1000.49)).toBe('$1,000')
    })

    it('should handle very large numbers', () => {
      expect(formatCurrency(1000000000)).toBe('$1,000,000,000')
    })
  })

  describe('formatCurrencyDetailed', () => {
    it('should format currency with 2 decimal places', () => {
      expect(formatCurrencyDetailed(1000)).toBe('$1,000.00')
      expect(formatCurrencyDetailed(1000.5)).toBe('$1,000.50')
    })

    it('should format currency with different currencies', () => {
      expect(formatCurrencyDetailed(1000.99, 'EUR')).toBe('€1,000.99')
    })

    it('should handle zero and negative values with decimals', () => {
      expect(formatCurrencyDetailed(0)).toBe('$0.00')
      expect(formatCurrencyDetailed(-1000.5)).toBe('-$1,000.50')
    })
  })

  describe('formatNumber', () => {
    it('should format numbers with commas', () => {
      expect(formatNumber(1000)).toBe('1,000')
      expect(formatNumber(1000000)).toBe('1,000,000')
    })

    it('should handle decimal numbers', () => {
      expect(formatNumber(1000.5)).toBe('1,000.5')
    })

    it('should handle zero and negative numbers', () => {
      expect(formatNumber(0)).toBe('0')
      expect(formatNumber(-1000)).toBe('-1,000')
    })

    it('should handle very large numbers', () => {
      expect(formatNumber(1000000000)).toBe('1,000,000,000')
    })
  })

  describe('formatPercentage', () => {
    it('should format percentage with default 1 decimal place', () => {
      expect(formatPercentage(25.5)).toBe('25.5%')
      expect(formatPercentage(100)).toBe('100.0%')
    })

    it('should format percentage with custom decimal places', () => {
      expect(formatPercentage(25.555, 2)).toBe('25.56%')
      expect(formatPercentage(25.555, 0)).toBe('26%')
    })

    it('should handle zero and negative percentages', () => {
      expect(formatPercentage(0)).toBe('0.0%')
      expect(formatPercentage(-5.5)).toBe('-5.5%')
    })

    it('should handle very small numbers', () => {
      expect(formatPercentage(0.001, 3)).toBe('0.001%')
    })
  })

  describe('formatDate', () => {
    it('should format Date objects', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      const formatted = formatDate(date)

      // The exact format may vary by locale, but should contain the date parts
      expect(formatted).toMatch(/1\/15\/2024|15\/1\/2024/)
    })

    it('should format date strings', () => {
      const formatted = formatDate('2024-01-15')
      expect(formatted).toMatch(/1\/15\/2024|15\/1\/2024/)
    })

    it('should handle ISO date strings', () => {
      const formatted = formatDate('2024-01-15T00:00:00.000Z')
      expect(formatted).toMatch(/1\/15\/2024|15\/1\/2024/)
    })

    it('should handle different date formats', () => {
      const formatted = formatDate('January 15, 2024')
      expect(formatted).toMatch(/1\/15\/2024|15\/1\/2024/)
    })
  })

  describe('getStatusColor', () => {
    it('should return correct colors for standard statuses', () => {
      expect(getStatusColor('draft')).toBe('bg-gray-100 text-gray-800 border-gray-200')
      expect(getStatusColor('in_progress')).toBe('bg-blue-100 text-blue-800 border-blue-200')
      expect(getStatusColor('under_review')).toBe('bg-yellow-100 text-yellow-800 border-yellow-200')
      expect(getStatusColor('completed')).toBe('bg-green-100 text-green-800 border-green-200')
      expect(getStatusColor('on_hold')).toBe('bg-red-100 text-red-800 border-red-200')
    })

    it('should handle share class types', () => {
      expect(getStatusColor('Common')).toBe('bg-blue-100 text-blue-800 border-blue-200')
      expect(getStatusColor('Preferred')).toBe('bg-purple-100 text-purple-800 border-purple-200')
    })

    it('should handle alternative status names', () => {
      expect(getStatusColor('review')).toBe('bg-yellow-100 text-yellow-800 border-yellow-200')
      expect(getStatusColor('delivered')).toBe('bg-green-100 text-green-800 border-green-200')
      expect(getStatusColor('final')).toBe('bg-blue-100 text-blue-800 border-blue-200')
    })

    it('should return default color for unknown statuses', () => {
      expect(getStatusColor('unknown_status')).toBe('bg-gray-100 text-gray-800 border-gray-200')
    })

    it('should handle empty and null status', () => {
      expect(getStatusColor('')).toBe('bg-gray-100 text-gray-800 border-gray-200')
    })
  })

  describe('calculatePercentage', () => {
    it('should calculate percentage correctly', () => {
      expect(calculatePercentage(25, 100)).toBe(25)
      expect(calculatePercentage(1, 4)).toBe(25)
      expect(calculatePercentage(3, 4)).toBe(75)
    })

    it('should handle zero total', () => {
      expect(calculatePercentage(10, 0)).toBe(0)
    })

    it('should handle zero value', () => {
      expect(calculatePercentage(0, 100)).toBe(0)
    })

    it('should handle decimal results', () => {
      expect(calculatePercentage(1, 3)).toBeCloseTo(33.333, 2)
    })

    it('should handle values greater than total', () => {
      expect(calculatePercentage(150, 100)).toBe(150)
    })

    it('should handle negative values', () => {
      expect(calculatePercentage(-10, 100)).toBe(-10)
      expect(calculatePercentage(10, -100)).toBe(-10)
    })
  })

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should delay function execution', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn()
      expect(mockFn).not.toHaveBeenCalled()

      jest.advanceTimersByTime(100)
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should reset timer on subsequent calls', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn()
      jest.advanceTimersByTime(50)

      debouncedFn() // Reset timer
      jest.advanceTimersByTime(50)
      expect(mockFn).not.toHaveBeenCalled()

      jest.advanceTimersByTime(50)
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should pass arguments correctly', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn('arg1', 'arg2')
      jest.advanceTimersByTime(100)

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')
    })

    it('should use last call arguments when called multiple times', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn('first')
      debouncedFn('second')
      debouncedFn('third')

      jest.advanceTimersByTime(100)

      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('third')
    })

    it('should handle different wait times', () => {
      const mockFn = jest.fn()
      const shortDebounce = debounce(mockFn, 50)
      const longDebounce = debounce(mockFn, 200)

      shortDebounce()
      longDebounce()

      jest.advanceTimersByTime(50)
      expect(mockFn).toHaveBeenCalledTimes(1) // Short debounce executed

      jest.advanceTimersByTime(150)
      expect(mockFn).toHaveBeenCalledTimes(2) // Long debounce executed
    })
  })

  describe('generateId', () => {
    it('should generate a string', () => {
      const id = generateId()
      expect(typeof id).toBe('string')
      expect(id.length).toBeGreaterThan(0)
    })

    it('should generate unique IDs', () => {
      const ids = Array.from({ length: 100 }, () => generateId())
      const uniqueIds = new Set(ids)

      expect(uniqueIds.size).toBe(ids.length)
    })

    it('should generate IDs without spaces or special characters', () => {
      const id = generateId()
      expect(id).toMatch(/^[a-z0-9]+$/)
    })

    it('should generate different IDs on subsequent calls', () => {
      const id1 = generateId()
      const id2 = generateId()

      expect(id1).not.toBe(id2)
    })

    it('should generate reasonably short IDs', () => {
      const id = generateId()
      expect(id.length).toBeLessThan(50) // Reasonable upper bound
      expect(id.length).toBeGreaterThan(10) // Reasonable lower bound
    })
  })

  describe('Edge cases and error handling', () => {
    describe('formatCurrency edge cases', () => {
      it('should handle very small numbers', () => {
        expect(formatCurrency(0.01)).toBe('$0')
        expect(formatCurrencyDetailed(0.01)).toBe('$0.01')
      })

      it('should handle very large numbers', () => {
        expect(formatCurrency(Number.MAX_SAFE_INTEGER)).toBeTruthy()
        expect(() => formatCurrency(Number.MAX_SAFE_INTEGER)).not.toThrow()
      })

      it('should handle Infinity and NaN', () => {
        expect(() => formatCurrency(Infinity)).not.toThrow()
        expect(() => formatCurrency(NaN)).not.toThrow()
      })
    })

    describe('formatDate edge cases', () => {
      it('should handle invalid dates gracefully', () => {
        expect(() => formatDate('invalid-date')).not.toThrow()
        const result = formatDate('invalid-date')
        expect(result).toBe('Invalid Date')
      })

      it('should handle edge date values', () => {
        expect(() => formatDate(new Date(0))).not.toThrow()
        expect(() => formatDate('1970-01-01')).not.toThrow()
      })
    })

    describe('calculatePercentage edge cases', () => {
      it('should handle very small numbers', () => {
        expect(calculatePercentage(0.000001, 0.000002)).toBe(50)
      })

      it('should handle very large numbers', () => {
        const large = Number.MAX_SAFE_INTEGER
        expect(calculatePercentage(large / 2, large)).toBe(50)
      })

      it('should handle Infinity', () => {
        expect(calculatePercentage(Infinity, 100)).toBe(Infinity)
        expect(calculatePercentage(100, Infinity)).toBe(0)
      })

      it('should handle NaN', () => {
        expect(calculatePercentage(NaN, 100)).toBeNaN()
        expect(calculatePercentage(100, NaN)).toBeNaN()
      })
    })
  })

  describe('Performance considerations', () => {
    it('should handle large arrays in cn', () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => `class-${i}`)
      expect(() => cn(...largeArray)).not.toThrow()
    })

    it('should handle rapid debounce calls', () => {
      jest.useFakeTimers()

      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      // Rapid fire calls
      for (let i = 0; i < 1000; i++) {
        debouncedFn(i)
      }

      jest.advanceTimersByTime(100)

      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith(999) // Last call

      jest.useRealTimers()
    })
  })
})
