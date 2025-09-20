import {
  calculateAmountInvested,
  calculateTotalLP,
  calculateAsConvertedShares,
  calculateTotalDividends,
  enhanceShareClassWithCalculations,
  enhanceShareClassesWithCalculations,
  formatCurrency,
  formatNumber,
  formatPercentage,
  validateShareClass,
} from '../capTableCalculations'
import { ShareClass } from '@/types'

describe('Cap Table Calculations', () => {
  const baseShareClass: ShareClass = {
    id: 'share_1',
    companyId: 1,
    shareType: 'preferred',
    name: 'Series A',
    roundDate: '2023-01-01',
    sharesOutstanding: 1000000,
    pricePerShare: 1.5,
    preferenceType: 'non-participating',
    lpMultiple: 1.0,
    seniority: 1,
    conversionRatio: 1.0,
    dividendsDeclared: false,
    pik: false,
  }

  describe('calculateAmountInvested', () => {
    it('should calculate amount invested correctly', () => {
      const result = calculateAmountInvested(baseShareClass)
      expect(result).toBe(1500000) // 1,000,000 * 1.50
    })

    it('should handle zero price per share', () => {
      const freeShares = { ...baseShareClass, pricePerShare: 0 }
      const result = calculateAmountInvested(freeShares)
      expect(result).toBe(0)
    })

    it('should handle fractional shares', () => {
      const fractionalShares = {
        ...baseShareClass,
        sharesOutstanding: 1000000.5,
        pricePerShare: 1.25,
      }
      const result = calculateAmountInvested(fractionalShares)
      expect(result).toBeCloseTo(1250000.625)
    })

    it('should handle very large numbers', () => {
      const largeShares = {
        ...baseShareClass,
        sharesOutstanding: 100000000,
        pricePerShare: 10,
      }
      const result = calculateAmountInvested(largeShares)
      expect(result).toBe(1000000000)
    })
  })

  describe('calculateTotalLP', () => {
    it('should calculate total liquidation preference correctly', () => {
      const result = calculateTotalLP(baseShareClass)
      expect(result).toBe(1500000) // 1,500,000 * 1.0
    })

    it('should handle 2x liquidation preference', () => {
      const doubleLP = { ...baseShareClass, lpMultiple: 2.0 }
      const result = calculateTotalLP(doubleLP)
      expect(result).toBe(3000000) // 1,500,000 * 2.0
    })

    it('should handle fractional liquidation preference', () => {
      const fractionalLP = { ...baseShareClass, lpMultiple: 1.5 }
      const result = calculateTotalLP(fractionalLP)
      expect(result).toBe(2250000) // 1,500,000 * 1.5
    })

    it('should work with zero price per share', () => {
      const freeShares = { ...baseShareClass, pricePerShare: 0, lpMultiple: 2.0 }
      const result = calculateTotalLP(freeShares)
      expect(result).toBe(0)
    })
  })

  describe('calculateAsConvertedShares', () => {
    it('should calculate as-converted shares with 1:1 ratio', () => {
      const result = calculateAsConvertedShares(baseShareClass)
      expect(result).toBe(1000000) // 1,000,000 * 1.0
    })

    it('should handle anti-dilution adjustment', () => {
      const antiDilutionShares = { ...baseShareClass, conversionRatio: 1.5 }
      const result = calculateAsConvertedShares(antiDilutionShares)
      expect(result).toBe(1500000) // 1,000,000 * 1.5
    })

    it('should handle fractional conversion ratios', () => {
      const fractionalConversion = { ...baseShareClass, conversionRatio: 0.8 }
      const result = calculateAsConvertedShares(fractionalConversion)
      expect(result).toBe(800000) // 1,000,000 * 0.8
    })

    it('should handle very small conversion ratios', () => {
      const smallConversion = { ...baseShareClass, conversionRatio: 0.001 }
      const result = calculateAsConvertedShares(smallConversion)
      expect(result).toBe(1000) // 1,000,000 * 0.001
    })
  })

  describe('calculateTotalDividends', () => {
    beforeEach(() => {
      // Mock Date.now to ensure consistent test results
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2024-01-01T00:00:00.000Z'))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should return 0 when dividends are not declared', () => {
      const result = calculateTotalDividends(baseShareClass)
      expect(result).toBe(0)
    })

    it('should calculate cumulative dividends correctly', () => {
      const dividendShares: ShareClass = {
        ...baseShareClass,
        roundDate: '2023-01-01', // 1 year ago
        dividendsDeclared: true,
        dividendsRate: 0.08, // 8%
        dividendsType: 'cumulative',
      }

      const result = calculateTotalDividends(dividendShares)
      expect(result).toBeCloseTo(120000) // 1,500,000 * 0.08 * 1 year
    })

    it('should calculate non-cumulative dividends correctly', () => {
      const dividendShares: ShareClass = {
        ...baseShareClass,
        roundDate: '2023-01-01', // 1 year ago
        dividendsDeclared: true,
        dividendsRate: 0.08, // 8%
        dividendsType: 'non-cumulative',
      }

      const result = calculateTotalDividends(dividendShares)
      expect(result).toBeCloseTo(120000) // 1,500,000 * 0.08 * 1 year
    })

    it('should handle partial years correctly', () => {
      const dividendShares: ShareClass = {
        ...baseShareClass,
        roundDate: '2023-07-01', // 6 months ago
        dividendsDeclared: true,
        dividendsRate: 0.08, // 8%
        dividendsType: 'cumulative',
      }

      const result = calculateTotalDividends(dividendShares)
      expect(result).toBeCloseTo(60000) // 1,500,000 * 0.08 * 0.5 years
    })

    it('should return 0 when dividend rate is not provided', () => {
      const dividendShares: ShareClass = {
        ...baseShareClass,
        dividendsDeclared: true,
        dividendsType: 'cumulative',
        // Missing dividendsRate
      }

      const result = calculateTotalDividends(dividendShares)
      expect(result).toBe(0)
    })

    it('should return 0 when round date is not provided', () => {
      const dividendShares: ShareClass = {
        ...baseShareClass,
        roundDate: '',
        dividendsDeclared: true,
        dividendsRate: 0.08,
        dividendsType: 'cumulative',
      }

      const result = calculateTotalDividends(dividendShares)
      expect(result).toBe(0)
    })

    it('should handle future round dates', () => {
      const futureShares: ShareClass = {
        ...baseShareClass,
        roundDate: '2025-01-01', // 1 year in the future
        dividendsDeclared: true,
        dividendsRate: 0.08,
        dividendsType: 'cumulative',
      }

      const result = calculateTotalDividends(futureShares)
      expect(result).toBeCloseTo(-120000) // Negative because it's in the future
    })
  })

  describe('enhanceShareClassWithCalculations', () => {
    it('should enhance share class with all calculated fields', () => {
      const enhanced = enhanceShareClassWithCalculations(baseShareClass)

      expect(enhanced.amountInvested).toBe(1500000)
      expect(enhanced.totalLP).toBe(1500000)
      expect(enhanced.asConvertedShares).toBe(1000000)
      expect(enhanced.totalDividends).toBe(0)

      // Original fields should remain unchanged
      expect(enhanced.name).toBe(baseShareClass.name)
      expect(enhanced.sharesOutstanding).toBe(baseShareClass.sharesOutstanding)
    })

    it('should handle share class with dividends', () => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2024-01-01T00:00:00.000Z'))

      const dividendShares: ShareClass = {
        ...baseShareClass,
        roundDate: '2023-01-01',
        dividendsDeclared: true,
        dividendsRate: 0.08,
        dividendsType: 'cumulative',
      }

      const enhanced = enhanceShareClassWithCalculations(dividendShares)

      expect(enhanced.totalDividends).toBeCloseTo(120000)

      jest.useRealTimers()
    })

    it('should not mutate original share class', () => {
      const original = { ...baseShareClass }
      const enhanced = enhanceShareClassWithCalculations(baseShareClass)

      expect(baseShareClass).toEqual(original)
      expect(enhanced).not.toBe(baseShareClass)
    })
  })

  describe('enhanceShareClassesWithCalculations', () => {
    it('should enhance multiple share classes', () => {
      const shareClasses: ShareClass[] = [
        baseShareClass,
        {
          ...baseShareClass,
          id: 'share_2',
          name: 'Series B',
          pricePerShare: 2.0,
        },
      ]

      const enhanced = enhanceShareClassesWithCalculations(shareClasses)

      expect(enhanced).toHaveLength(2)
      expect(enhanced[0].amountInvested).toBe(1500000)
      expect(enhanced[1].amountInvested).toBe(2000000)
    })

    it('should handle empty array', () => {
      const enhanced = enhanceShareClassesWithCalculations([])
      expect(enhanced).toEqual([])
    })

    it('should not mutate original array', () => {
      const original = [baseShareClass]
      const enhanced = enhanceShareClassesWithCalculations(original)

      expect(original).toHaveLength(1)
      expect(enhanced).not.toBe(original)
      expect(enhanced[0]).not.toBe(original[0])
    })
  })

  describe('validateShareClass', () => {
    it('should return no errors for valid share class', () => {
      const errors = validateShareClass(baseShareClass)
      expect(errors).toEqual([])
    })

    it('should validate required name', () => {
      const invalidShareClass = { ...baseShareClass, name: '' }
      const errors = validateShareClass(invalidShareClass)
      expect(errors).toContain('Class name is required')
    })

    it('should validate shares outstanding', () => {
      const invalidShareClass1 = { ...baseShareClass, sharesOutstanding: 0 }
      const invalidShareClass2 = { ...baseShareClass, sharesOutstanding: -100 }

      expect(validateShareClass(invalidShareClass1)).toContain(
        'Shares outstanding must be greater than 0'
      )
      expect(validateShareClass(invalidShareClass2)).toContain(
        'Shares outstanding must be greater than 0'
      )
    })

    it('should validate price per share', () => {
      const invalidShareClass = { ...baseShareClass, pricePerShare: -1 }
      const errors = validateShareClass(invalidShareClass)
      expect(errors).toContain('Price per share must be 0 or greater')
    })

    it('should allow zero price per share', () => {
      const validShareClass = { ...baseShareClass, pricePerShare: 0 }
      const errors = validateShareClass(validShareClass)
      expect(errors.filter((e) => e.includes('price per share'))).toHaveLength(0)
    })

    it('should validate LP multiple', () => {
      const invalidShareClass1 = { ...baseShareClass, lpMultiple: 0 }
      const invalidShareClass2 = { ...baseShareClass, lpMultiple: -1 }

      expect(validateShareClass(invalidShareClass1)).toContain('LP Multiple must be greater than 0')
      expect(validateShareClass(invalidShareClass2)).toContain('LP Multiple must be greater than 0')
    })

    it('should validate participation cap for participating-with-cap', () => {
      const invalidShareClass: Partial<ShareClass> = {
        ...baseShareClass,
        preferenceType: 'participating-with-cap',
        // Missing participationCap
      }

      const errors = validateShareClass(invalidShareClass)
      expect(errors).toContain(
        'Participation cap is required for participating-with-cap preference type'
      )
    })

    it('should validate dividends rate when declared', () => {
      const invalidShareClass: Partial<ShareClass> = {
        ...baseShareClass,
        dividendsDeclared: true,
        // Missing dividendsRate
      }

      const errors = validateShareClass(invalidShareClass)
      expect(errors).toContain('Dividends rate is required when dividends are declared')
    })

    it('should validate dividends type when declared', () => {
      const invalidShareClass: Partial<ShareClass> = {
        ...baseShareClass,
        dividendsDeclared: true,
        dividendsRate: 0.08,
        // Missing dividendsType
      }

      const errors = validateShareClass(invalidShareClass)
      expect(errors).toContain('Dividends type is required when dividends are declared')
    })

    it('should return multiple errors for multiple issues', () => {
      const invalidShareClass: Partial<ShareClass> = {
        name: '',
        sharesOutstanding: 0,
        pricePerShare: -1,
        lpMultiple: 0,
      }

      const errors = validateShareClass(invalidShareClass)
      expect(errors.length).toBeGreaterThanOrEqual(4)
    })
  })

  describe('Formatting functions', () => {
    describe('formatCurrency', () => {
      it('should format currency with 2 decimal places', () => {
        expect(formatCurrency(1500000)).toBe('$1,500,000.00')
        expect(formatCurrency(1500000.5)).toBe('$1,500,000.50')
      })

      it('should handle zero and negative values', () => {
        expect(formatCurrency(0)).toBe('$0.00')
        expect(formatCurrency(-1500000)).toBe('-$1,500,000.00')
      })

      it('should handle small values', () => {
        expect(formatCurrency(0.01)).toBe('$0.01')
        expect(formatCurrency(0.999)).toBe('$1.00')
      })
    })

    describe('formatNumber', () => {
      it('should format numbers with commas', () => {
        expect(formatNumber(1000000)).toBe('1,000,000')
        expect(formatNumber(1500000.5)).toBe('1,500,000.5')
      })

      it('should handle zero and negative numbers', () => {
        expect(formatNumber(0)).toBe('0')
        expect(formatNumber(-1000000)).toBe('-1,000,000')
      })
    })

    describe('formatPercentage', () => {
      it('should format percentage with 1 decimal place', () => {
        expect(formatPercentage(0.08)).toBe('8.0%')
        expect(formatPercentage(0.125)).toBe('12.5%')
        expect(formatPercentage(1)).toBe('100.0%')
      })

      it('should handle zero and negative percentages', () => {
        expect(formatPercentage(0)).toBe('0.0%')
        expect(formatPercentage(-0.05)).toBe('-5.0%')
      })

      it('should handle very small percentages', () => {
        expect(formatPercentage(0.001)).toBe('0.1%')
      })
    })
  })

  describe('Edge cases and error handling', () => {
    it('should handle undefined/null values gracefully', () => {
      const shareClassWithUndefined = {
        ...baseShareClass,
        sharesOutstanding: undefined as any,
        pricePerShare: null as any,
      }

      expect(() => calculateAmountInvested(shareClassWithUndefined)).not.toThrow()
    })

    it('should handle very large numbers', () => {
      const largeShareClass = {
        ...baseShareClass,
        sharesOutstanding: Number.MAX_SAFE_INTEGER,
        pricePerShare: 1,
      }

      expect(() => calculateAmountInvested(largeShareClass)).not.toThrow()
      expect(calculateAmountInvested(largeShareClass)).toBe(Number.MAX_SAFE_INTEGER)
    })

    it('should handle very small numbers', () => {
      const smallShareClass = {
        ...baseShareClass,
        sharesOutstanding: 0.0001,
        pricePerShare: 0.0001,
      }

      const result = calculateAmountInvested(smallShareClass)
      expect(result).toBeCloseTo(0.00000001)
    })

    it('should handle Infinity and NaN', () => {
      const infinityShareClass = {
        ...baseShareClass,
        sharesOutstanding: Infinity,
        pricePerShare: 1,
      }

      expect(calculateAmountInvested(infinityShareClass)).toBe(Infinity)

      const nanShareClass = {
        ...baseShareClass,
        sharesOutstanding: NaN,
        pricePerShare: 1,
      }

      expect(calculateAmountInvested(nanShareClass)).toBeNaN()
    })
  })
})
