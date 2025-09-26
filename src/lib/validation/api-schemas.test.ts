import {
  IdParamSchema,
  PaginationSchema,
  CreateCompanySchema,
  UpdateCompanySchema,
  CreateValuationSchema,
  UpdateValuationSchema,
  ShareClassSchema,
  OptionGrantSchema,
  UpdateCapTableSchema,
  CreateReportSchema,
  UpdateReportSchema,
  DCFAssumptionsSchema,
  DCFCalculateSchema,
  PeerBetaRequestSchema,
  InviteMemberSchema,
  UpdateMemberRoleSchema,
  CreateJobSchema,
  UpdateJobSchema,
  FieldMappingSchema,
  UpdateFieldMappingsSchema,
  validateRequest
} from './api-schemas'
import { z } from 'zod'

describe('API Schemas', () => {
  describe('IdParamSchema', () => {
    it('should validate valid UUID', () => {
      const validData = { id: '123e4567-e89b-12d3-a456-426614174000' }
      const result = IdParamSchema.parse(validData)
      expect(result).toEqual(validData)
    })

    it('should reject invalid UUID format', () => {
      expect(() => IdParamSchema.parse({ id: 'invalid-uuid' })).toThrow()
      expect(() => IdParamSchema.parse({ id: '123' })).toThrow()
      expect(() => IdParamSchema.parse({ id: '' })).toThrow()
    })

    it('should reject missing id', () => {
      expect(() => IdParamSchema.parse({})).toThrow()
    })
  })

  describe('PaginationSchema', () => {
    it('should validate with default values', () => {
      const result = PaginationSchema.parse({})
      expect(result).toEqual({
        page: 1,
        limit: 20,
        order: 'desc'
      })
    })

    it('should validate with custom values', () => {
      const data = {
        page: 2,
        limit: 50,
        sort: 'name',
        order: 'asc' as const
      }
      const result = PaginationSchema.parse(data)
      expect(result).toEqual(data)
    })

    it('should coerce string numbers', () => {
      const data = {
        page: '3',
        limit: '25'
      }
      const result = PaginationSchema.parse(data)
      expect(result.page).toBe(3)
      expect(result.limit).toBe(25)
    })

    it('should reject invalid pagination values', () => {
      expect(() => PaginationSchema.parse({ page: 0 })).toThrow()
      expect(() => PaginationSchema.parse({ limit: 0 })).toThrow()
      expect(() => PaginationSchema.parse({ limit: 101 })).toThrow()
      expect(() => PaginationSchema.parse({ order: 'invalid' })).toThrow()
    })
  })

  describe('CreateCompanySchema', () => {
    const validCompany = {
      name: 'Test Company',
      industry: 'Technology',
      ticker: 'TEST',
      website: 'https://example.com',
      description: 'A test company',
      founded_date: '2020-01-01T00:00:00Z',
      employee_count: 50,
      revenue: 1000000
    }

    it('should validate complete company data', () => {
      const result = CreateCompanySchema.parse(validCompany)
      expect(result).toEqual(validCompany)
    })

    it('should validate minimal company data', () => {
      const minimalData = { name: 'Minimal Company' }
      const result = CreateCompanySchema.parse(minimalData)
      expect(result).toEqual(minimalData)
    })

    it('should reject invalid data', () => {
      expect(() => CreateCompanySchema.parse({ name: '' })).toThrow()
      expect(() => CreateCompanySchema.parse({ name: 'A'.repeat(256) })).toThrow()
      expect(() => CreateCompanySchema.parse({ name: 'Test', website: 'invalid-url' })).toThrow()
      expect(() => CreateCompanySchema.parse({ name: 'Test', employee_count: -1 })).toThrow()
      expect(() => CreateCompanySchema.parse({ name: 'Test', revenue: -1000 })).toThrow()
    })

    it('should require name field', () => {
      expect(() => CreateCompanySchema.parse({})).toThrow()
    })
  })

  describe('UpdateCompanySchema', () => {
    it('should accept partial updates', () => {
      const partialData = { name: 'Updated Name' }
      const result = UpdateCompanySchema.parse(partialData)
      expect(result).toEqual(partialData)
    })

    it('should accept empty object', () => {
      const result = UpdateCompanySchema.parse({})
      expect(result).toEqual({})
    })
  })

  describe('CreateValuationSchema', () => {
    const validValuation = {
      company_id: '123e4567-e89b-12d3-a456-426614174000',
      valuation_name: 'Q1 2024 409A',
      valuation_date: '2024-01-01T00:00:00Z',
      purpose: '409a' as const,
      status: 'draft' as const,
      assigned_appraiser: '123e4567-e89b-12d3-a456-426614174001',
      fair_market_value: 10000000,
      discount_for_lack_of_marketability: 25,
      discount_for_lack_of_control: 15
    }

    it('should validate complete valuation data', () => {
      const result = CreateValuationSchema.parse(validValuation)
      expect(result).toEqual(validValuation)
    })

    it('should validate with default status', () => {
      const dataWithoutStatus = { ...validValuation }
      delete (dataWithoutStatus as any).status
      const result = CreateValuationSchema.parse(dataWithoutStatus)
      expect(result.status).toBe('draft')
    })

    it('should validate all purpose types', () => {
      const purposes = ['409a', 'purchase_price_allocation', 'goodwill_impairment', 'strategic_planning', 'other']
      purposes.forEach(purpose => {
        const data = { ...validValuation, purpose }
        expect(() => CreateValuationSchema.parse(data)).not.toThrow()
      })
    })

    it('should validate all status types', () => {
      const statuses = ['draft', 'in_progress', 'review', 'completed']
      statuses.forEach(status => {
        const data = { ...validValuation, status }
        expect(() => CreateValuationSchema.parse(data)).not.toThrow()
      })
    })

    it('should reject invalid data', () => {
      expect(() => CreateValuationSchema.parse({
        ...validValuation,
        company_id: 'invalid-uuid'
      })).toThrow()

      expect(() => CreateValuationSchema.parse({
        ...validValuation,
        valuation_name: ''
      })).toThrow()

      expect(() => CreateValuationSchema.parse({
        ...validValuation,
        fair_market_value: -1000
      })).toThrow()

      expect(() => CreateValuationSchema.parse({
        ...validValuation,
        discount_for_lack_of_marketability: 101
      })).toThrow()
    })
  })

  describe('ShareClassSchema', () => {
    const validShareClass = {
      id: 'common-stock',
      name: 'Common Stock',
      shares_outstanding: 1000000,
      share_price: 10.50,
      liquidation_preference: 1.0,
      participation_rights: false,
      conversion_ratio: 1.0,
      dividends_accrued: 0,
      voting_rights: true
    }

    it('should validate complete share class data', () => {
      const result = ShareClassSchema.parse(validShareClass)
      expect(result).toEqual(validShareClass)
    })

    it('should validate with default values', () => {
      const minimalData = {
        id: 'test',
        name: 'Test Class',
        shares_outstanding: 1000,
        share_price: 1.0
      }
      const result = ShareClassSchema.parse(minimalData)
      expect(result).toEqual({
        ...minimalData,
        participation_rights: false,
        voting_rights: true
      })
    })

    it('should reject negative values', () => {
      expect(() => ShareClassSchema.parse({
        ...validShareClass,
        shares_outstanding: -1
      })).toThrow()

      expect(() => ShareClassSchema.parse({
        ...validShareClass,
        share_price: -1
      })).toThrow()
    })
  })

  describe('OptionGrantSchema', () => {
    const validOption = {
      id: 'option-1',
      grant_date: '2024-01-01T00:00:00Z',
      expiration_date: '2034-01-01T00:00:00Z',
      exercise_price: 1.00,
      shares: 10000,
      vested_shares: 2500,
      status: 'outstanding' as const
    }

    it('should validate complete option grant data', () => {
      const result = OptionGrantSchema.parse(validOption)
      expect(result).toEqual(validOption)
    })

    it('should validate all status types', () => {
      const statuses = ['outstanding', 'exercised', 'cancelled', 'expired']
      statuses.forEach(status => {
        const data = { ...validOption, status }
        expect(() => OptionGrantSchema.parse(data)).not.toThrow()
      })
    })

    it('should reject negative values', () => {
      expect(() => OptionGrantSchema.parse({
        ...validOption,
        exercise_price: -1
      })).toThrow()

      expect(() => OptionGrantSchema.parse({
        ...validOption,
        shares: -1
      })).toThrow()
    })
  })

  describe('DCFAssumptionsSchema', () => {
    const validAssumptions = {
      valuationDate: '2024-01-01T00:00:00Z',
      discountingConvention: 'Mid-Year' as const,
      projectionYears: 5,
      terminalGrowthRate: 0.025,
      discountRate: 0.12,
      taxRate: 0.25,
      capexPercent: 0.05,
      workingCapitalPercent: 0.02,
      depreciationMethod: 'schedule' as const
    }

    it('should validate complete DCF assumptions', () => {
      const result = DCFAssumptionsSchema.parse(validAssumptions)
      expect(result).toEqual(validAssumptions)
    })

    it('should validate discounting conventions', () => {
      ['Mid-Year', 'End-Year'].forEach(convention => {
        const data = { ...validAssumptions, discountingConvention: convention }
        expect(() => DCFAssumptionsSchema.parse(data)).not.toThrow()
      })
    })

    it('should reject invalid ranges', () => {
      expect(() => DCFAssumptionsSchema.parse({
        ...validAssumptions,
        projectionYears: 0
      })).toThrow()

      expect(() => DCFAssumptionsSchema.parse({
        ...validAssumptions,
        projectionYears: 11
      })).toThrow()

      expect(() => DCFAssumptionsSchema.parse({
        ...validAssumptions,
        terminalGrowthRate: 0.15 // Too high
      })).toThrow()

      expect(() => DCFAssumptionsSchema.parse({
        ...validAssumptions,
        discountRate: -0.1 // Negative
      })).toThrow()
    })
  })

  describe('InviteMemberSchema', () => {
    const validInvite = {
      email: 'user@example.com',
      role: 'member' as const,
      message: 'Welcome to the team!'
    }

    it('should validate complete invite data', () => {
      const result = InviteMemberSchema.parse(validInvite)
      expect(result).toEqual(validInvite)
    })

    it('should validate all role types', () => {
      const roles = ['owner', 'admin', 'member', 'viewer']
      roles.forEach(role => {
        const data = { ...validInvite, role }
        expect(() => InviteMemberSchema.parse(data)).not.toThrow()
      })
    })

    it('should reject invalid email', () => {
      expect(() => InviteMemberSchema.parse({
        ...validInvite,
        email: 'invalid-email'
      })).toThrow()
    })

    it('should allow optional message', () => {
      const dataWithoutMessage = { ...validInvite }
      delete (dataWithoutMessage as any).message
      const result = InviteMemberSchema.parse(dataWithoutMessage)
      expect(result.message).toBeUndefined()
    })
  })

  describe('CreateJobSchema', () => {
    const validJob = {
      type: 'data-sync',
      data: { source: 'external', target: 'internal' },
      priority: 'normal' as const,
      scheduledFor: '2024-01-01T00:00:00Z'
    }

    it('should validate complete job data', () => {
      const result = CreateJobSchema.parse(validJob)
      expect(result).toEqual(validJob)
    })

    it('should validate with default priority', () => {
      const dataWithoutPriority = { ...validJob }
      delete (dataWithoutPriority as any).priority
      const result = CreateJobSchema.parse(dataWithoutPriority)
      expect(result.priority).toBe('normal')
    })

    it('should validate all priority types', () => {
      const priorities = ['low', 'normal', 'high', 'critical']
      priorities.forEach(priority => {
        const data = { ...validJob, priority }
        expect(() => CreateJobSchema.parse(data)).not.toThrow()
      })
    })
  })

  describe('FieldMappingSchema', () => {
    const validMapping = {
      sourceModule: 'manual' as const,
      sourcePath: 'company.name',
      required: true,
      fallback: 'Default Name',
      transformer: 'uppercase'
    }

    it('should validate complete field mapping', () => {
      const result = FieldMappingSchema.parse(validMapping)
      expect(result).toEqual(validMapping)
    })

    it('should validate all source modules', () => {
      const modules = ['manual', 'assumptions', 'valuation', 'company', 'capTable', 'dlom', 'calculated']
      modules.forEach(sourceModule => {
        const data = { ...validMapping, sourceModule }
        expect(() => FieldMappingSchema.parse(data)).not.toThrow()
      })
    })

    it('should validate with default required value', () => {
      const dataWithoutRequired = { ...validMapping }
      delete (dataWithoutRequired as any).required
      const result = FieldMappingSchema.parse(dataWithoutRequired)
      expect(result.required).toBe(false)
    })
  })

  describe('validateRequest helper function', () => {
    const testSchema = z.object({
      name: z.string().min(1),
      age: z.number().min(0)
    })

    it('should return parsed data for valid input', () => {
      const validData = { name: 'John', age: 30 }
      const result = validateRequest(testSchema, validData)
      expect(result).toEqual(validData)
    })

    it('should throw detailed error for invalid input', () => {
      const invalidData = { name: '', age: -5 }
      expect(() => validateRequest(testSchema, invalidData)).toThrow(
        expect.stringContaining('Validation failed')
      )
    })

    it('should handle missing fields', () => {
      const incompleteData = { name: 'John' }
      expect(() => validateRequest(testSchema, incompleteData)).toThrow(
        expect.stringContaining('age')
      )
    })

    it('should handle multiple validation errors', () => {
      const invalidData = { name: '', age: -5 }
      let errorMessage = ''
      try {
        validateRequest(testSchema, invalidData)
      } catch (error) {
        errorMessage = (error as Error).message
      }
      expect(errorMessage).toContain('name')
      expect(errorMessage).toContain('age')
    })

    it('should handle unknown data types', () => {
      expect(() => validateRequest(testSchema, null)).toThrow()
      expect(() => validateRequest(testSchema, undefined)).toThrow()
      expect(() => validateRequest(testSchema, 'string')).toThrow()
      expect(() => validateRequest(testSchema, 42)).toThrow()
    })
  })

  describe('Schema combinations and real-world scenarios', () => {
    it('should validate complete cap table update', () => {
      const capTableData = {
        shareClasses: [
          {
            id: 'common',
            name: 'Common Stock',
            shares_outstanding: 1000000,
            share_price: 1.00,
            voting_rights: true
          }
        ],
        options: [
          {
            id: 'option-pool',
            grant_date: '2024-01-01T00:00:00Z',
            expiration_date: '2034-01-01T00:00:00Z',
            exercise_price: 0.10,
            shares: 100000,
            vested_shares: 25000,
            status: 'outstanding' as const
          }
        ],
        totalSharesOutstanding: 1000000,
        fullyDilutedShares: 1100000
      }

      const result = UpdateCapTableSchema.parse(capTableData)
      expect(result).toEqual(capTableData)
    })

    it('should validate complex DCF calculation request', () => {
      const dcfData = {
        assumptions: {
          valuationDate: '2024-01-01T00:00:00Z',
          discountingConvention: 'Mid-Year' as const,
          projectionYears: 5,
          terminalGrowthRate: 0.025,
          discountRate: 0.12,
          taxRate: 0.25
        },
        historicalData: [
          { revenue: 1000000, expenses: 800000 },
          { revenue: 1200000, expenses: 900000 }
        ],
        useScheduleData: true
      }

      const result = DCFCalculateSchema.parse(dcfData)
      expect(result).toEqual(dcfData)
    })

    it('should validate field mappings configuration', () => {
      const mappingsData = {
        mappings: {
          'company_name': {
            sourceModule: 'company' as const,
            sourcePath: 'name',
            required: true,
            fallback: 'Unknown Company'
          },
          'valuation_date': {
            sourceModule: 'valuation' as const,
            sourcePath: 'valuation_date',
            required: true,
            transformer: 'date_format'
          }
        }
      }

      const result = UpdateFieldMappingsSchema.parse(mappingsData)
      expect(result).toEqual(mappingsData)
    })
  })

  describe('Edge cases and error conditions', () => {
    it('should handle empty strings where not allowed', () => {
      expect(() => CreateCompanySchema.parse({ name: '' })).toThrow()
      expect(() => CreateValuationSchema.parse({
        company_id: '123e4567-e89b-12d3-a456-426614174000',
        valuation_name: '',
        valuation_date: '2024-01-01T00:00:00Z',
        purpose: '409a'
      })).toThrow()
    })

    it('should handle boundary values correctly', () => {
      // Test minimum valid values
      expect(() => PaginationSchema.parse({ page: 1, limit: 1 })).not.toThrow()

      // Test maximum valid values
      expect(() => PaginationSchema.parse({ limit: 100 })).not.toThrow()

      // Test boundary violations
      expect(() => PaginationSchema.parse({ page: 0 })).toThrow()
      expect(() => PaginationSchema.parse({ limit: 101 })).toThrow()
    })

    it('should handle special date formats', () => {
      const validDates = [
        '2024-01-01T00:00:00Z',
        '2024-12-31T23:59:59.999Z',
        '2024-01-01T00:00:00.000Z'
      ]

      validDates.forEach(date => {
        expect(() => CreateValuationSchema.parse({
          company_id: '123e4567-e89b-12d3-a456-426614174000',
          valuation_name: 'Test',
          valuation_date: date,
          purpose: '409a'
        })).not.toThrow()
      })
    })
  })
})