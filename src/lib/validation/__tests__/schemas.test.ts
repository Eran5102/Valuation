import {
  CompanySchema,
  CreateCompanySchema,
  UpdateCompanySchema,
  ValuationProjectSchema,
  CreateValuationProjectSchema,
  ShareClassSchema,
  CreateShareClassSchema,
  OptionsWarrantsSchema,
  CapTableDataSchema,
  DLOMInputsSchema,
  ModelWeightsSchema,
  FinancialAssumptionSchema,
  OPMParametersSchema,
  BreakpointSchema,
  WaterfallInputSchema,
  validateSchema,
  validateSchemaAsync,
  customValidators,
  refinedSchemas,
} from '../schemas'

describe('Validation Schemas', () => {
  describe('CompanySchema', () => {
    const validCompany = {
      id: 1,
      name: 'Test Company',
      legal_name: 'Test Company LLC',
      industry: 'Technology',
      stage: 'Series A',
      location: 'San Francisco, CA',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    }

    it('should validate a complete company object', () => {
      const result = validateSchema(CompanySchema, validCompany)
      expect(result.success).toBe(true)
      expect(result.data).toEqual(validCompany)
    })

    it('should require name field', () => {
      const invalidCompany = { ...validCompany }
      delete (invalidCompany as any).name

      const result = validateSchema(CompanySchema, invalidCompany)
      expect(result.success).toBe(false)
      expect(result.errors?.some((error) => error.includes('name'))).toBe(true)
    })

    it('should accept optional fields as undefined', () => {
      const minimalCompany = {
        name: 'Minimal Company',
      }

      const result = validateSchema(CompanySchema, minimalCompany)
      expect(result.success).toBe(true)
      expect(result.data?.name).toBe('Minimal Company')
    })
  })

  describe('CreateCompanySchema', () => {
    it('should omit id, created_at, and updated_at fields', () => {
      const createData = {
        id: 1,
        name: 'New Company',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      }

      const result = validateSchema(CreateCompanySchema, createData)
      expect(result.success).toBe(true)
      expect(result.data).not.toHaveProperty('id')
      expect(result.data).not.toHaveProperty('created_at')
      expect(result.data).not.toHaveProperty('updated_at')
    })
  })

  describe('ValuationProjectSchema', () => {
    const validProject = {
      id: 'proj_123',
      title: 'Test Valuation',
      clientName: 'Test Client',
      valuationDate: '2024-01-01',
      projectType: '409A',
      status: 'draft' as const,
      currency: 'USD',
      maxProjectedYears: 5,
      discountingConvention: 'mid-year',
      taxRate: 25.5,
      description: 'Test description',
      company_id: 1,
    }

    it('should validate a complete valuation project', () => {
      const result = validateSchema(ValuationProjectSchema, validProject)
      expect(result.success).toBe(true)
      expect(result.data).toEqual(validProject)
    })

    it('should validate status enum', () => {
      const invalidProject = {
        ...validProject,
        status: 'invalid_status',
      }

      const result = validateSchema(ValuationProjectSchema, invalidProject)
      expect(result.success).toBe(false)
      expect(result.errors?.some((error) => error.includes('status'))).toBe(true)
    })

    it('should validate currency length', () => {
      const invalidProject = {
        ...validProject,
        currency: 'INVALID',
      }

      const result = validateSchema(ValuationProjectSchema, invalidProject)
      expect(result.success).toBe(false)
      expect(result.errors?.some((error) => error.includes('currency'))).toBe(true)
    })

    it('should validate tax rate range', () => {
      const invalidProject = {
        ...validProject,
        taxRate: 150, // Over 100%
      }

      const result = validateSchema(ValuationProjectSchema, invalidProject)
      expect(result.success).toBe(false)
      expect(result.errors?.some((error) => error.includes('taxRate'))).toBe(true)
    })

    it('should validate maxProjectedYears range', () => {
      const invalidProject = {
        ...validProject,
        maxProjectedYears: 25, // Over 20
      }

      const result = validateSchema(ValuationProjectSchema, invalidProject)
      expect(result.success).toBe(false)
      expect(result.errors?.some((error) => error.includes('maxProjectedYears'))).toBe(true)
    })
  })

  describe('ShareClassSchema', () => {
    const validShareClass = {
      id: 'share_123',
      companyId: 1,
      shareType: 'preferred' as const,
      name: 'Series A',
      roundDate: '2024-01-01',
      sharesOutstanding: 1000000,
      pricePerShare: 1.5,
      preferenceType: 'non-participating' as const,
      lpMultiple: 1.0,
      seniority: 1,
      conversionRatio: 1.0,
      dividendsDeclared: false,
      pik: false,
    }

    it('should validate a complete share class', () => {
      const result = validateSchema(ShareClassSchema, validShareClass)
      expect(result.success).toBe(true)
      expect(result.data).toEqual(validShareClass)
    })

    it('should require positive shares outstanding', () => {
      const invalidShareClass = {
        ...validShareClass,
        sharesOutstanding: 0,
      }

      const result = validateSchema(ShareClassSchema, invalidShareClass)
      expect(result.success).toBe(false)
      expect(result.errors?.some((error) => error.includes('sharesOutstanding'))).toBe(true)
    })

    it('should require non-negative price per share', () => {
      const validFreeShareClass = {
        ...validShareClass,
        pricePerShare: 0,
      }

      const result = validateSchema(ShareClassSchema, validFreeShareClass)
      expect(result.success).toBe(true)
    })

    it('should require positive conversion ratio', () => {
      const invalidShareClass = {
        ...validShareClass,
        conversionRatio: 0,
      }

      const result = validateSchema(ShareClassSchema, invalidShareClass)
      expect(result.success).toBe(false)
      expect(result.errors?.some((error) => error.includes('conversionRatio'))).toBe(true)
    })

    it('should validate preference type enum', () => {
      const invalidShareClass = {
        ...validShareClass,
        preferenceType: 'invalid-type',
      }

      const result = validateSchema(ShareClassSchema, invalidShareClass)
      expect(result.success).toBe(false)
      expect(result.errors?.some((error) => error.includes('preferenceType'))).toBe(true)
    })
  })

  describe('DLOMInputsSchema', () => {
    const validDLOMInputs = {
      stockPrice: 10.0,
      strikePrice: 8.0,
      volatility: 0.3,
      riskFreeRate: 0.05,
      timeToExpiration: 2.0,
      dividendYield: 0.02,
    }

    it('should validate valid DLOM inputs', () => {
      const result = validateSchema(DLOMInputsSchema, validDLOMInputs)
      expect(result.success).toBe(true)
      expect(result.data).toEqual(validDLOMInputs)
    })

    it('should reject negative stock price', () => {
      const invalidInputs = {
        ...validDLOMInputs,
        stockPrice: -10.0,
      }

      const result = validateSchema(DLOMInputsSchema, invalidInputs)
      expect(result.success).toBe(false)
      expect(result.errors?.some((error) => error.includes('stockPrice'))).toBe(true)
    })

    it('should reject extremely high volatility', () => {
      const invalidInputs = {
        ...validDLOMInputs,
        volatility: 10.0, // 1000% volatility
      }

      const result = validateSchema(DLOMInputsSchema, invalidInputs)
      expect(result.success).toBe(false)
      expect(result.errors?.some((error) => error.includes('volatility'))).toBe(true)
    })

    it('should reject unreasonable risk-free rate', () => {
      const invalidInputs = {
        ...validDLOMInputs,
        riskFreeRate: 0.5, // 50% risk-free rate
      }

      const result = validateSchema(DLOMInputsSchema, invalidInputs)
      expect(result.success).toBe(false)
      expect(result.errors?.some((error) => error.includes('riskFreeRate'))).toBe(true)
    })
  })

  describe('ModelWeightsSchema', () => {
    it('should validate weights that sum to 100%', () => {
      const validWeights = {
        chaffee: 25,
        finnerty: 25,
        ghaidarov: 25,
        longstaff: 25,
      }

      const result = validateSchema(ModelWeightsSchema, validWeights)
      expect(result.success).toBe(true)
      expect(result.data).toEqual(validWeights)
    })

    it('should reject weights that do not sum to 100%', () => {
      const invalidWeights = {
        chaffee: 30,
        finnerty: 30,
        ghaidarov: 30,
        longstaff: 30, // Total = 120%
      }

      const result = validateSchema(ModelWeightsSchema, invalidWeights)
      expect(result.success).toBe(false)
      expect(result.errors?.some((error) => error.includes('100%'))).toBe(true)
    })

    it('should allow for small floating point differences', () => {
      const validWeights = {
        chaffee: 25.0,
        finnerty: 25.0,
        ghaidarov: 25.0,
        longstaff: 24.999999, // Close to 25 due to floating point precision
      }

      const result = validateSchema(ModelWeightsSchema, validWeights)
      expect(result.success).toBe(true)
    })
  })

  describe('BreakpointSchema', () => {
    const validBreakpoint = {
      id: 1,
      name: 'LP Payout',
      type: 'Liquidation Preference' as const,
      fromValue: 0,
      toValue: 1000000,
      participatingSecurities: [
        {
          name: 'Series A',
          percentage: 50,
          shares: 500000,
        },
      ],
      shares: 500000,
    }

    it('should validate a complete breakpoint', () => {
      const result = validateSchema(BreakpointSchema, validBreakpoint)
      expect(result.success).toBe(true)
      expect(result.data).toEqual(validBreakpoint)
    })

    it('should require toValue greater than fromValue', () => {
      const invalidBreakpoint = {
        ...validBreakpoint,
        fromValue: 1000000,
        toValue: 500000, // Less than fromValue
      }

      const result = validateSchema(BreakpointSchema, invalidBreakpoint)
      expect(result.success).toBe(false)
      expect(result.errors?.some((error) => error.includes('To value'))).toBe(true)
    })

    it('should allow infinite toValue', () => {
      const validInfiniteBreakpoint = {
        ...validBreakpoint,
        toValue: Infinity,
      }

      const result = validateSchema(BreakpointSchema, validInfiniteBreakpoint)
      expect(result.success).toBe(true)
    })

    it('should validate participating securities', () => {
      const invalidBreakpoint = {
        ...validBreakpoint,
        participatingSecurities: [
          {
            name: '',
            percentage: 150, // Over 100%
            shares: -100, // Negative shares
          },
        ],
      }

      const result = validateSchema(BreakpointSchema, invalidBreakpoint)
      expect(result.success).toBe(false)
      expect(result.errors?.length).toBeGreaterThan(0)
    })
  })

  describe('WaterfallInputSchema', () => {
    const validWaterfallInput = {
      company_equity_value: 10000000,
      cap_table: {
        preferred_series: [
          {
            name: 'Series A',
            shares_outstanding: 1000000,
            original_issue_price: 1.5,
            liquidation_preference: 1500000,
            participation_type: 'non-participating' as const,
            seniority_rank: 1,
          },
        ],
        common_shares: {
          shares_outstanding: 5000000,
        },
        option_pools: [
          {
            name: 'Employee Pool',
            total_options: 1000000,
            exercise_price: 0.1,
            options_outstanding: 800000,
          },
        ],
      },
    }

    it('should validate complete waterfall input', () => {
      const result = validateSchema(WaterfallInputSchema, validWaterfallInput)
      expect(result.success).toBe(true)
      expect(result.data).toEqual(validWaterfallInput)
    })

    it('should require positive company equity value', () => {
      const invalidInput = {
        ...validWaterfallInput,
        company_equity_value: 0,
      }

      const result = validateSchema(WaterfallInputSchema, invalidInput)
      expect(result.success).toBe(false)
      expect(result.errors?.some((error) => error.includes('company_equity_value'))).toBe(true)
    })
  })

  describe('Validation helpers', () => {
    describe('validateSchema', () => {
      const testSchema = CompanySchema

      it('should return success for valid data', () => {
        const validData = { name: 'Test Company' }
        const result = validateSchema(testSchema, validData)

        expect(result.success).toBe(true)
        expect(result.data).toEqual(expect.objectContaining(validData))
        expect(result.errors).toBeUndefined()
      })

      it('should return errors for invalid data', () => {
        const invalidData = { name: '' } // Empty name
        const result = validateSchema(testSchema, invalidData)

        expect(result.success).toBe(false)
        expect(result.data).toBeUndefined()
        expect(result.errors).toBeDefined()
        expect(result.errors?.length).toBeGreaterThan(0)
      })
    })

    describe('validateSchemaAsync', () => {
      const testSchema = CompanySchema

      it('should return success for valid data asynchronously', async () => {
        const validData = { name: 'Test Company' }
        const result = await validateSchemaAsync(testSchema, validData)

        expect(result.success).toBe(true)
        expect(result.data).toEqual(expect.objectContaining(validData))
        expect(result.errors).toBeUndefined()
      })

      it('should return errors for invalid data asynchronously', async () => {
        const invalidData = { name: '' } // Empty name
        const result = await validateSchemaAsync(testSchema, invalidData)

        expect(result.success).toBe(false)
        expect(result.data).toBeUndefined()
        expect(result.errors).toBeDefined()
        expect(result.errors?.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Custom validators', () => {
    describe('isValidDate', () => {
      it('should validate correct date strings', () => {
        expect(customValidators.isValidDate('2024-01-01')).toBe(true)
        expect(customValidators.isValidDate('2024-12-31T23:59:59.999Z')).toBe(true)
      })

      it('should reject invalid date strings', () => {
        expect(customValidators.isValidDate('invalid-date')).toBe(false)
        expect(customValidators.isValidDate('2024-13-01')).toBe(false)
      })
    })

    describe('isBusinessDate', () => {
      it('should validate weekday dates', () => {
        expect(customValidators.isBusinessDate('2024-01-01')).toBe(true) // Monday
        expect(customValidators.isBusinessDate('2024-01-05')).toBe(true) // Friday
      })

      it('should reject weekend dates', () => {
        expect(customValidators.isBusinessDate('2024-01-06')).toBe(false) // Saturday
        expect(customValidators.isBusinessDate('2024-01-07')).toBe(false) // Sunday
      })
    })

    describe('isValidCurrency', () => {
      it('should validate common currencies', () => {
        expect(customValidators.isValidCurrency('USD')).toBe(true)
        expect(customValidators.isValidCurrency('EUR')).toBe(true)
        expect(customValidators.isValidCurrency('GBP')).toBe(true)
      })

      it('should be case insensitive', () => {
        expect(customValidators.isValidCurrency('usd')).toBe(true)
        expect(customValidators.isValidCurrency('eur')).toBe(true)
      })

      it('should reject invalid currencies', () => {
        expect(customValidators.isValidCurrency('INVALID')).toBe(false)
        expect(customValidators.isValidCurrency('XYZ')).toBe(false)
      })
    })

    describe('isValidIndustry', () => {
      it('should validate known industries', () => {
        expect(customValidators.isValidIndustry('Technology')).toBe(true)
        expect(customValidators.isValidIndustry('Healthcare')).toBe(true)
        expect(customValidators.isValidIndustry('Other')).toBe(true)
      })

      it('should reject unknown industries', () => {
        expect(customValidators.isValidIndustry('Unknown Industry')).toBe(false)
      })
    })
  })

  describe('Refined schemas with business rules', () => {
    describe('ShareClassWithBusinessRules', () => {
      const baseShareClass = {
        companyId: 1,
        shareType: 'preferred' as const,
        name: 'Series A',
        roundDate: '2024-01-01',
        sharesOutstanding: 1000000,
        pricePerShare: 1.5,
        preferenceType: 'participating' as const,
        lpMultiple: 1.0,
        seniority: 1,
        conversionRatio: 1.0,
        dividendsDeclared: false,
        pik: false,
      }

      it('should validate participating preferred with valid conversion ratio', () => {
        const validShareClass = {
          ...baseShareClass,
          preferenceType: 'participating' as const,
          conversionRatio: 1.0,
        }

        const result = validateSchema(refinedSchemas.ShareClassWithBusinessRules, validShareClass)
        expect(result.success).toBe(true)
      })

      it('should require participation cap for participating-with-cap', () => {
        const shareClassWithCap = {
          ...baseShareClass,
          preferenceType: 'participating-with-cap' as const,
          participationCap: 3.0,
        }

        const result = validateSchema(refinedSchemas.ShareClassWithBusinessRules, shareClassWithCap)
        expect(result.success).toBe(true)
      })

      it('should reject participating-with-cap without participation cap', () => {
        const invalidShareClass = {
          ...baseShareClass,
          preferenceType: 'participating-with-cap' as const,
          // Missing participationCap
        }

        const result = validateSchema(refinedSchemas.ShareClassWithBusinessRules, invalidShareClass)
        expect(result.success).toBe(false)
      })

      it('should require dividend rate when dividends are declared', () => {
        const shareClassWithDividends = {
          ...baseShareClass,
          dividendsDeclared: true,
          dividendsRate: 8.0,
        }

        const result = validateSchema(
          refinedSchemas.ShareClassWithBusinessRules,
          shareClassWithDividends
        )
        expect(result.success).toBe(true)
      })

      it('should reject declared dividends without rate', () => {
        const invalidShareClass = {
          ...baseShareClass,
          dividendsDeclared: true,
          // Missing dividendsRate
        }

        const result = validateSchema(refinedSchemas.ShareClassWithBusinessRules, invalidShareClass)
        expect(result.success).toBe(false)
      })
    })

    describe('ValuationProjectWithDateValidation', () => {
      const baseProject = {
        title: 'Test Valuation',
        clientName: 'Test Client',
        valuationDate: '2024-06-01',
        projectType: '409A',
        status: 'draft' as const,
        currency: 'USD',
        maxProjectedYears: 5,
        discountingConvention: 'mid-year',
        taxRate: 25.0,
      }

      it('should accept valuation dates within reasonable range', () => {
        const validProject = {
          ...baseProject,
          valuationDate: new Date().toISOString().split('T')[0], // Today's date
        }

        const result = validateSchema(
          refinedSchemas.ValuationProjectWithDateValidation,
          validProject
        )
        expect(result.success).toBe(true)
      })

      it('should reject valuation dates more than 1 year in the future', () => {
        const futureDate = new Date()
        futureDate.setFullYear(futureDate.getFullYear() + 2) // 2 years in future

        const invalidProject = {
          ...baseProject,
          valuationDate: futureDate.toISOString().split('T')[0],
        }

        const result = validateSchema(
          refinedSchemas.ValuationProjectWithDateValidation,
          invalidProject
        )
        expect(result.success).toBe(false)
      })
    })
  })
})
