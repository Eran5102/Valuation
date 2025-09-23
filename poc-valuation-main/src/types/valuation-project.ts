import { z } from 'zod'

export const valuationProjectTypes = [
  'General Business Valuation',
  '409A / ASC 820 Compliance',
  'M&A Analysis (Buy-Side/Sell-Side)',
  'Fairness Opinion',
  'LBO Analysis',
  'Purchase Price Allocation (PPA)',
  'Goodwill Impairment',
  'Transfer Pricing Support',
  'Strategic Planning',
  'Litigation Support',
  'Fundraising / VC Method Support',
  'Other (Specify)',
] as const

export const valuationPurposes = [
  'M&A Transaction',
  'Financial Reporting',
  'Strategic Planning',
  'Tax Purposes',
  'Litigation Support',
  'Other',
] as const

export const projectStatuses = ['Draft', 'In Progress', 'Review', 'Final'] as const

export const valuationProjectSchema = z.object({
  companyId: z.string({
    required_error: 'Please select a company',
  }),
  projectName: z.string().min(1, 'Project name is required'),
  valuationDate: z.date({
    required_error: 'Valuation date is required',
  }),
  projectType: z.enum(valuationProjectTypes, {
    required_error: 'Please select a project type',
  }),
  purpose: z.enum(valuationPurposes, {
    required_error: 'Please select a purpose',
  }),
  description: z.string().optional(),
  status: z.enum(projectStatuses, {
    required_error: 'Please select a status',
  }),
  maxProjectionYears: z.number().min(1).max(30).default(10),
  currency: z
    .enum(['USD', 'EUR', 'GBP', 'CAD'], {
      required_error: 'Please select a currency',
    })
    .default('USD'),
  discountingConvention: z
    .enum(['Mid-Year', 'End-Year'], {
      required_error: 'Please select a discounting convention',
    })
    .default('Mid-Year'),
  taxRate: z.number().min(0).max(100).default(25),
})

export type ValuationProjectFormData = z.infer<typeof valuationProjectSchema>
