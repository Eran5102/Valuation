import { z } from 'zod'

// Common schemas
export const IdParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
})

export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
})

// Company schemas
export const CreateCompanySchema = z.object({
  name: z.string().min(1).max(255),
  industry: z.string().optional(),
  ticker: z.string().optional(),
  website: z.string().url().optional(),
  description: z.string().optional(),
  founded_date: z.string().datetime().optional(),
  employee_count: z.number().min(0).optional(),
  revenue: z.number().min(0).optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  team_members: z.array(z.string().uuid()).optional(),
})

export const UpdateCompanySchema = CreateCompanySchema.partial()

// Valuation schemas
export const CreateValuationSchema = z.object({
  company_id: z.string().uuid(),
  valuation_name: z.string().min(1).max(255),
  valuation_date: z.string().datetime(),
  purpose: z.enum([
    '409a',
    'purchase_price_allocation',
    'goodwill_impairment',
    'strategic_planning',
    'other',
  ]),
  status: z.enum(['draft', 'in_progress', 'review', 'completed']).default('draft'),
  assigned_appraiser: z.string().uuid().optional(),
  fair_market_value: z.number().min(0).optional(),
  discount_for_lack_of_marketability: z.number().min(0).max(100).optional(),
  discount_for_lack_of_control: z.number().min(0).max(100).optional(),
})

export const UpdateValuationSchema = CreateValuationSchema.partial()

// Cap Table schemas
export const ShareClassSchema = z.object({
  id: z.string(),
  companyId: z.number().optional(), // Made optional - API will add it
  shareType: z.enum(['common', 'preferred']),
  name: z.string(),
  roundDate: z.string(),
  sharesOutstanding: z.number().min(0),
  pricePerShare: z.number().min(0),
  amountInvested: z.number().min(0).optional(),
  preferenceType: z.enum(['non-participating', 'participating', 'participating-with-cap']),
  lpMultiple: z.number().min(0),
  totalLP: z.number().min(0).optional(),
  seniority: z.number().min(0),
  participationCap: z.union([z.number().min(0), z.null()]).optional(),
  conversionRatio: z.number().min(0),
  asConvertedShares: z.number().min(0).optional(),
  dividendsDeclared: z.boolean(),
  dividendsRate: z.union([z.number().min(0), z.null()]).optional(),
  dividendsType: z.union([z.enum(['cumulative', 'non-cumulative']), z.null()]).optional(),
  pik: z.boolean(),
  totalDividends: z.number().min(0).optional(),
  shares: z.number().min(0).optional(),
})

export const OptionGrantSchema = z.object({
  id: z.string(),
  numOptions: z.number().min(0),
  exercisePrice: z.number().min(0),
  type: z.enum(['Options', 'Warrants', 'RSUs']),
  isEditing: z.boolean().optional(),
})

export const UpdateCapTableSchema = z.object({
  shareClasses: z.array(ShareClassSchema),
  options: z.array(OptionGrantSchema),
  totalSharesOutstanding: z.number().min(0).optional(),
  fullyDilutedShares: z.number().min(0).optional(),
})

// Report schemas
export const CreateReportSchema = z.object({
  valuation_id: z.string().uuid(),
  template_id: z.string().uuid().optional(),
  title: z.string().min(1).max(255),
  type: z.enum(['full', 'summary', 'draft', 'custom']),
  status: z.enum(['draft', 'generating', 'review', 'final']).default('draft'),
  content: z.record(z.string(), z.any()).optional(),
  generated_at: z.string().datetime().optional(),
})

export const UpdateReportSchema = CreateReportSchema.partial()

// DCF Model schemas
export const DCFAssumptionsSchema = z.object({
  // Project Fundamentals
  valuationDate: z.string(),
  mostRecentFiscalYearEnd: z.string(),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD']).default('USD'),
  discountingConvention: z.enum(['Mid-Year', 'End-Year']),

  // Analysis Periods
  historicalYears: z.number().min(0),
  projectionYears: z.number().min(1).max(10),
  baseYear: z.number(),

  // Tax Configuration
  corporateTaxRate: z.number().min(0).max(1),
  stateTaxRate: z.number().min(0).max(1),
  effectiveTaxRate: z.number().min(0).max(1),
  taxCalculationMethod: z.enum(['effective', 'detailed']).default('effective'),

  // Core Financial Parameters
  discountRate: z.number().min(0).max(1),
  terminalGrowthRate: z.number().min(-0.1).max(0.1),
  cashBalance: z.number().min(0),
  debtBalance: z.number().min(0),

  // Calculation Method Flags
  depreciationMethod: z.enum(['schedule', 'manual', 'percentage']).default('percentage'),
  workingCapitalMethod: z.enum(['detailed', 'percentage', 'days']).default('percentage'),
  capexMethod: z.enum(['schedule', 'percentage', 'growth']).default('percentage'),
  debtMethod: z.enum(['schedule', 'manual']).default('manual'),
  interestMethod: z.enum(['schedule', 'average', 'fixed']).default('average'),

  // Default Percentages (when not using detailed schedules)
  depreciationPercent: z.number().min(0).max(1).optional(),
  capexPercent: z.number().min(0).max(1).optional(),
  workingCapitalPercent: z.number().min(0).max(1).optional(),
  maintenanceCapexPercent: z.number().min(0).max(1).optional(),
  growthCapexPercent: z.number().min(0).max(1).optional(),

  // Working Capital Days (for days-based calculation)
  daysReceivables: z.number().min(0).optional(),
  daysPayables: z.number().min(0).optional(),
  daysInventory: z.number().min(0).optional(),
  inventoryTurnover: z.number().min(0).optional(),
  targetNWCPercent: z.number().min(0).max(1).optional(),

  // Growth Rates
  revenueGrowthRates: z.array(z.number()).optional(),
  revenueGrowthRate: z.number().optional(),
  ebitdaMargin: z.number().min(0).max(1).optional(),

  // Additional Financial Metrics
  grossMargin: z.number().min(0).max(1).optional(),
  operatingMargin: z.number().min(0).max(1).optional(),
  sgaPercent: z.number().min(0).max(1).optional(),
  rdPercent: z.number().min(0).max(1).optional(),
  otherExpensePercent: z.number().min(0).max(1).optional(),
  depreciation: z.number().optional(),
  amortization: z.number().optional(),
  changeInNWC: z.number().optional(),
  otherOperatingExpenses: z.number().optional(),
  priceInflation: z.number().min(0).max(1).optional(),
})

export const DCFCalculateSchema = z.object({
  assumptions: DCFAssumptionsSchema,
  historicalData: z.array(z.record(z.string(), z.number())).optional(),
  useScheduleData: z.boolean().default(false),
})

// Peer Beta schemas
export const PeerBetaRequestSchema = z.object({
  customPeers: z.array(z.string()).optional(),
  refreshData: z.boolean().default(false),
})

// Team/Organization schemas
export const InviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['owner', 'admin', 'member', 'viewer']),
  message: z.string().optional(),
})

export const UpdateMemberRoleSchema = z.object({
  role: z.enum(['owner', 'admin', 'member', 'viewer']),
})

// Jobs schemas
export const CreateJobSchema = z.object({
  type: z.string(),
  data: z.record(z.string(), z.any()),
  priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
  scheduledFor: z.string().datetime().optional(),
})

export const UpdateJobSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']),
  result: z.record(z.string(), z.any()).optional(),
  error: z.string().optional(),
})

// Field Mapping schemas
export const FieldMappingSchema = z.object({
  sourceModule: z.enum([
    'manual',
    'assumptions',
    'valuation',
    'company',
    'capTable',
    'dlom',
    'calculated',
  ]),
  sourcePath: z.string(),
  required: z.boolean().default(false),
  fallback: z.union([z.string(), z.number(), z.boolean()]).optional(),
  transformer: z.any().optional(), // Function validation not supported in Next.js builds
})

export const UpdateFieldMappingsSchema = z.object({
  mappings: z.record(z.string(), FieldMappingSchema),
})

// Valuation Assumptions schemas
export const AssumptionItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.union([z.string(), z.number(), z.boolean()]),
  type: z.enum(['text', 'number', 'date', 'boolean', 'select']),
  required: z.boolean().default(false),
  description: z.string().optional(),
})

export const AssumptionCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  items: z.array(AssumptionItemSchema),
})

export const UpdateAssumptionsSchema = z.object({
  assumptions: z.array(AssumptionCategorySchema),
})

// Export helper function for validation
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new Error(
      `Validation failed: ${result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`
    )
  }
  return result.data
}
