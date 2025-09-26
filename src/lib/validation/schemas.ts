import { z } from 'zod'

// Base validation schemas
const requiredString = z.string().min(1, 'This field is required')
const optionalString = z.string().optional()
const positiveNumber = z.number().positive('Must be a positive number')
const nonNegativeNumber = z.number().min(0, 'Must be non-negative')
const percentage = z
  .number()
  .min(0, 'Must be between 0 and 100')
  .max(100, 'Must be between 0 and 100')
const email = z.string().email('Invalid email format')
const date = z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date format')

// Status enums
export const StatusEnum = z.enum(['draft', 'in_progress', 'under_review', 'completed', 'on_hold'])
export const ShareClassTypeEnum = z.enum(['common', 'preferred'])
export const PreferenceTypeEnum = z.enum([
  'non-participating',
  'participating',
  'participating-with-cap',
])
export const OptionsTypeEnum = z.enum(['Options', 'Warrants', 'RSUs'])
export const DividendsTypeEnum = z.enum(['cumulative', 'non-cumulative'])

// Company validation schema
export const CompanySchema = z.object({
  id: z.number().optional(),
  name: requiredString,
  legal_name: optionalString,
  industry: optionalString,
  stage: optionalString,
  location: optionalString,
  created_at: date.optional(),
  updated_at: date.optional(),
})

export const CreateCompanySchema = CompanySchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})
export const UpdateCompanySchema = CreateCompanySchema.partial()

// Valuation Project validation schema
export const ValuationProjectSchema = z.object({
  id: z.string().optional(),
  title: requiredString,
  clientName: requiredString,
  valuationDate: date,
  projectType: requiredString,
  status: StatusEnum,
  currency: z.string().length(3, 'Currency must be 3 characters (e.g., USD)'),
  maxProjectedYears: z.number().int().min(1).max(20),
  discountingConvention: requiredString,
  taxRate: percentage,
  description: optionalString,
  company_id: z.number().optional(),
  created_at: date.optional(),
  updated_at: date.optional(),
  assumptions: z.any().optional(),
})

export const CreateValuationProjectSchema = ValuationProjectSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export const UpdateValuationProjectSchema = CreateValuationProjectSchema.partial()

// Share Class validation schema
export const ShareClassSchema = z.object({
  id: z.string().optional(),
  companyId: z.number(),
  shareType: ShareClassTypeEnum,
  name: requiredString,
  roundDate: date,
  sharesOutstanding: positiveNumber,
  pricePerShare: nonNegativeNumber,
  amountInvested: nonNegativeNumber.optional(),
  preferenceType: PreferenceTypeEnum,
  lpMultiple: z.number().min(0),
  totalLP: nonNegativeNumber.optional(),
  seniority: z.number().int().min(0),
  participationCap: z.number().nullable().optional(),
  conversionRatio: positiveNumber,
  asConvertedShares: nonNegativeNumber.optional(),
  dividendsDeclared: z.boolean(),
  dividendsRate: z.number().nullable().optional(),
  dividendsType: DividendsTypeEnum.nullable().optional(),
  pik: z.boolean(),
  totalDividends: nonNegativeNumber.optional(),
  shares: nonNegativeNumber.optional(),
})

export const CreateShareClassSchema = ShareClassSchema.omit({ id: true })
export const UpdateShareClassSchema = CreateShareClassSchema.partial()

// Options/Warrants validation schema
export const OptionsWarrantsSchema = z.object({
  id: z.string().optional(),
  numOptions: positiveNumber,
  exercisePrice: nonNegativeNumber,
  type: OptionsTypeEnum,
  isEditing: z.boolean().optional(),
})

export const CreateOptionsWarrantsSchema = OptionsWarrantsSchema.omit({ id: true })

// Cap Table validation schema
export const CapTableDataSchema = z.object({
  shareClasses: z.array(ShareClassSchema),
  options: z.array(OptionsWarrantsSchema),
})

// DLOM validation schemas
export const DLOMInputsSchema = z.object({
  stockPrice: positiveNumber,
  strikePrice: nonNegativeNumber,
  volatility: z
    .number()
    .min(0.01, 'Volatility must be greater than 0')
    .max(5, 'Volatility seems unreasonably high'),
  riskFreeRate: z
    .number()
    .min(0, 'Risk-free rate must be non-negative')
    .max(0.3, 'Risk-free rate seems unreasonably high'),
  timeToExpiration: z
    .number()
    .min(0.01, 'Time to expiration must be positive')
    .max(30, 'Time to expiration seems unreasonably long'),
  dividendYield: nonNegativeNumber,
})

export const ModelWeightsSchema = z
  .object({
    chaffee: percentage,
    finnerty: percentage,
    ghaidarov: percentage,
    longstaff: percentage,
  })
  .refine((data) => {
    const total = data.chaffee + data.finnerty + data.ghaidarov + data.longstaff
    return Math.abs(total - 100) < 0.01 // Allow for small floating point differences
  }, 'Model weights must sum to 100%')

// Financial Assumption validation schema
export const FinancialAssumptionSchema = z.object({
  id: z.string().optional(),
  category: requiredString,
  name: requiredString,
  value: requiredString,
  unit: requiredString,
  description: optionalString,
})

export const CreateFinancialAssumptionSchema = FinancialAssumptionSchema.omit({ id: true })

// OPM Parameters validation schema
export const OPMParametersSchema = z.object({
  companyEquityValue: positiveNumber,
  volatility: z.number().min(0.01).max(5),
  riskFreeRate: z.number().min(0).max(0.3),
  timeToLiquidity: z.number().min(0.01).max(30),
  dividendYield: nonNegativeNumber,
})

// Breakpoint validation schema
export const BreakpointSchema = z.object({
  id: z.number().optional(),
  name: requiredString,
  type: z.enum([
    'Liquidation Preference',
    'Pro Rata',
    'Option Exercise',
    'Cap Reached',
    'Conversion',
  ]),
  fromValue: nonNegativeNumber,
  toValue: z.number().refine((val) => val !== undefined, 'To value must be greater than from value'),
  participatingSecurities: z.array(
    z.object({
      name: requiredString,
      percentage: percentage,
      shares: nonNegativeNumber,
    })
  ),
  shares: nonNegativeNumber,
  sectionRVPS: nonNegativeNumber.optional(),
  cumulativeRVPS: nonNegativeNumber.optional(),
})

// API Request validation schemas
export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
})

export const SortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

export const FilterSchema = z.object({
  status: StatusEnum.optional(),
  company_id: z.number().optional(),
  date_from: date.optional(),
  date_to: date.optional(),
})

// Form validation schemas (for frontend forms)
export const LoginFormSchema = z.object({
  email: email,
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const ContactFormSchema = z.object({
  name: requiredString,
  email: email,
  company: optionalString,
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

// Comprehensive waterfall input validation
export const WaterfallInputSchema = z.object({
  company_equity_value: positiveNumber,
  cap_table: z.object({
    preferred_series: z.array(
      z.object({
        name: requiredString,
        shares_outstanding: positiveNumber,
        original_issue_price: positiveNumber,
        liquidation_preference: positiveNumber,
        participation_type: z.enum(['non-participating', 'participating', 'participating-capped']),
        participation_cap: z.number().nullable().optional(),
        dividend_rate: nonNegativeNumber.optional(),
        is_cumulative: z.boolean().optional(),
        seniority_rank: z.number().int().min(1),
      })
    ),
    common_shares: z.object({
      shares_outstanding: positiveNumber,
      par_value: nonNegativeNumber.optional(),
    }),
    option_pools: z.array(
      z.object({
        name: requiredString,
        total_options: positiveNumber,
        exercise_price: nonNegativeNumber,
        options_outstanding: positiveNumber,
        vesting_schedule: optionalString,
      })
    ),
  }),
  transaction_expenses: z
    .object({
      investment_banking_fees: nonNegativeNumber.optional(),
      legal_fees: nonNegativeNumber.optional(),
      accounting_fees: nonNegativeNumber.optional(),
      other_fees: nonNegativeNumber.optional(),
    })
    .optional(),
})

// Export type definitions from schemas
export type Company = z.infer<typeof CompanySchema>
export type CreateCompany = z.infer<typeof CreateCompanySchema>
export type UpdateCompany = z.infer<typeof UpdateCompanySchema>

export type ValuationProject = z.infer<typeof ValuationProjectSchema>
export type CreateValuationProject = z.infer<typeof CreateValuationProjectSchema>
export type UpdateValuationProject = z.infer<typeof UpdateValuationProjectSchema>

export type ShareClass = z.infer<typeof ShareClassSchema>
export type CreateShareClass = z.infer<typeof CreateShareClassSchema>
export type UpdateShareClass = z.infer<typeof UpdateShareClassSchema>

export type OptionsWarrants = z.infer<typeof OptionsWarrantsSchema>
export type CreateOptionsWarrants = z.infer<typeof CreateOptionsWarrantsSchema>

export type CapTableData = z.infer<typeof CapTableDataSchema>
export type DLOMInputs = z.infer<typeof DLOMInputsSchema>
export type ModelWeights = z.infer<typeof ModelWeightsSchema>
export type FinancialAssumption = z.infer<typeof FinancialAssumptionSchema>
export type CreateFinancialAssumption = z.infer<typeof CreateFinancialAssumptionSchema>
export type OPMParameters = z.infer<typeof OPMParametersSchema>
export type Breakpoint = z.infer<typeof BreakpointSchema>

export type PaginationParams = z.infer<typeof PaginationSchema>
export type SortParams = z.infer<typeof SortSchema>
export type FilterParams = z.infer<typeof FilterSchema>

export type LoginForm = z.infer<typeof LoginFormSchema>
export type ContactForm = z.infer<typeof ContactFormSchema>
export type WaterfallInput = z.infer<typeof WaterfallInputSchema>

// Validation helper functions
export const validateSchema = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: boolean; data?: T; errors?: string[] } => {
  try {
    const result = schema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.issues.map((err) => `${err.path.join('.')}: ${err.message}`),
      }
    }
    return { success: false, errors: ['Unknown validation error'] }
  }
}

export const validateSchemaAsync = async <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<{ success: boolean; data?: T; errors?: string[] }> => {
  try {
    const result = await schema.parseAsync(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.issues.map((err) => `${err.path.join('.')}: ${err.message}`),
      }
    }
    return { success: false, errors: ['Unknown validation error'] }
  }
}

// Custom validation rules
export const customValidators = {
  isValidDate: (dateString: string): boolean => {
    const date = new Date(dateString)
    return !isNaN(date.getTime())
  },

  isBusinessDate: (dateString: string): boolean => {
    const date = new Date(dateString)
    const day = date.getDay()
    return day !== 0 && day !== 6 // Not Sunday (0) or Saturday (6)
  },

  isFutureDate: (dateString: string): boolean => {
    const date = new Date(dateString)
    return date > new Date()
  },

  isPastDate: (dateString: string): boolean => {
    const date = new Date(dateString)
    return date < new Date()
  },

  isValidCurrency: (currency: string): boolean => {
    const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF']
    return validCurrencies.includes(currency.toUpperCase())
  },

  isValidIndustry: (industry: string): boolean => {
    const validIndustries = [
      'Technology',
      'Healthcare',
      'Financial Services',
      'Consumer Goods',
      'Industrial',
      'Energy',
      'Real Estate',
      'Telecommunications',
      'Media & Entertainment',
      'Transportation',
      'Agriculture',
      'Other',
    ]
    return validIndustries.includes(industry)
  },
}

// Schema refinements for complex business logic
export const refinedSchemas = {
  ShareClassWithBusinessRules: ShareClassSchema.refine(
    (data) => {
      // Participating preferred must have conversion ratio >= 1
      if (data.preferenceType === 'participating' && data.conversionRatio < 1) {
        return false
      }

      // Participating with cap must have participation cap defined
      if (data.preferenceType === 'participating-with-cap' && !data.participationCap) {
        return false
      }

      // If dividends are declared, rate must be specified
      if (data.dividendsDeclared && !data.dividendsRate) {
        return false
      }

      return true
    },
    {
      message: 'Share class business rules validation failed',
    }
  ),

  ValuationProjectWithDateValidation: ValuationProjectSchema.refine(
    (data) => {
      const valuationDate = new Date(data.valuationDate)
      const currentDate = new Date()

      // Valuation date cannot be more than 1 year in the future
      const oneYearFromNow = new Date()
      oneYearFromNow.setFullYear(currentDate.getFullYear() + 1)

      return valuationDate <= oneYearFromNow
    },
    {
      message: 'Valuation date cannot be more than 1 year in the future',
    }
  ),
}
