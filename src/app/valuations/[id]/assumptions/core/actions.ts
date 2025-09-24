'use server'

import { z } from 'zod'

// Type definitions
export interface CoreAssumptions {
  // Project Fundamentals
  valuationDate: string
  mostRecentFiscalYearEnd: string
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD'
  discountingConvention: 'Mid-Year' | 'End-Year'

  // Analysis Periods
  historicalYears: number
  maxProjectionYears: number
  projectionYears: number // Actual years to project (flows to all schedules)
  baseYear: number // Base year for projections

  // Tax Configuration
  taxRate: number // Legacy field for backward compatibility
  corporateTaxRate: number // Federal tax rate
  stateTaxRate: number // State tax rate
  effectiveTaxRate: number // Combined effective rate
  taxCalculationMethod: 'effective' | 'detailed'

  // Core Financial Parameters
  discountRate: number
  terminalGrowthRate: number
  cashBalance: number
  debtBalance: number

  // DCF Calculation Methods
  depreciationMethod: 'schedule' | 'manual' | 'percentage'
  workingCapitalMethod: 'detailed' | 'percentage' | 'days'
  capexMethod: 'schedule' | 'percentage' | 'growth'
  debtMethod: 'schedule' | 'manual'
  interestMethod: 'schedule' | 'average' | 'fixed'

  // Default Percentages (when not using detailed schedules)
  depreciationPercent?: number // As % of revenue or PP&E
  capexPercent?: number // As % of revenue
  workingCapitalPercent?: number // As % of revenue change
  maintenanceCapexPercent?: number // Maintenance capex as % of revenue
  growthCapexPercent?: number // Growth capex as % of revenue

  // Working Capital Days (for 'days' method)
  daysReceivables?: number
  daysInventory?: number
  daysPayables?: number

  // Revenue Growth Assumptions
  revenueGrowthRates?: number[] // Array of growth rates by projection year
  defaultRevenueGrowth?: number // Default growth rate if not specified
}

// Validation schema
const CoreAssumptionsSchema = z.object({
  valuationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mostRecentFiscalYearEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD']),
  discountingConvention: z.enum(['Mid-Year', 'End-Year']),
  historicalYears: z.number().min(1).max(10),
  maxProjectionYears: z.number().min(1).max(30),
  projectionYears: z.number().min(1).max(30),
  baseYear: z.number().min(2000).max(2100),

  // Tax fields
  taxRate: z.number().min(0).max(100),
  corporateTaxRate: z.number().min(0).max(100),
  stateTaxRate: z.number().min(0).max(100),
  effectiveTaxRate: z.number().min(0).max(100),
  taxCalculationMethod: z.enum(['effective', 'detailed']),

  // Financial parameters
  discountRate: z.number().min(0).max(100),
  terminalGrowthRate: z.number().min(-10).max(20),
  cashBalance: z.number().min(0),
  debtBalance: z.number().min(0),

  // Calculation methods
  depreciationMethod: z.enum(['schedule', 'manual', 'percentage']),
  workingCapitalMethod: z.enum(['detailed', 'percentage', 'days']),
  capexMethod: z.enum(['schedule', 'percentage', 'growth']),
  debtMethod: z.enum(['schedule', 'manual']),
  interestMethod: z.enum(['schedule', 'average', 'fixed']),

  // Optional percentages
  depreciationPercent: z.number().min(0).max(100).optional(),
  capexPercent: z.number().min(0).max(100).optional(),
  workingCapitalPercent: z.number().min(0).max(100).optional(),
  maintenanceCapexPercent: z.number().min(0).max(100).optional(),
  growthCapexPercent: z.number().min(0).max(100).optional(),

  // Working capital days
  daysReceivables: z.number().min(0).max(365).optional(),
  daysInventory: z.number().min(0).max(365).optional(),
  daysPayables: z.number().min(0).max(365).optional(),

  // Revenue assumptions
  revenueGrowthRates: z.array(z.number()).optional(),
  defaultRevenueGrowth: z.number().min(-50).max(200).optional(),
})

// Mock data fetching - replace with actual database calls
export async function getValuationById(id: string) {
  // In production, this would fetch from database
  return {
    id,
    company_name: 'Sample Company',
    valuation_date: new Date().toISOString(),
    type: '409a' as const,
    status: 'in_progress' as const,
  }
}

export async function getCoreAssumptions(valuationId: string): Promise<CoreAssumptions> {
  // In production, fetch from database
  // For now, return defaults or stored values

  // Try to get from localStorage (this would be database in production)
  const stored =
    typeof window !== 'undefined' ? localStorage.getItem(`core_assumptions_${valuationId}`) : null

  if (stored) {
    try {
      return JSON.parse(stored)
    } catch (e) {
      console.error('Failed to parse stored assumptions:', e)
    }
  }

  // Return defaults
  return {
    valuationDate: new Date().toISOString().split('T')[0],
    mostRecentFiscalYearEnd: new Date(new Date().getFullYear() - 1, 11, 31)
      .toISOString()
      .split('T')[0],
    currency: 'USD',
    discountingConvention: 'Mid-Year',
    historicalYears: 3,
    maxProjectionYears: 10,
    taxRate: 25,
    discountRate: 12,
    terminalGrowthRate: 3,
    cashBalance: 0,
    debtBalance: 0,
  }
}

export async function saveCoreAssumptions(valuationId: string, data: CoreAssumptions) {
  try {
    // Validate data
    const validated = CoreAssumptionsSchema.parse(data)

    // In production, save to database
    // For now, simulate with delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Create audit log entry
    await createAuditLog(valuationId, 'core_assumptions_updated', validated)

    return { success: true, data: validated }
  } catch (error) {
    console.error('Validation error:', error)
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        details: error.errors,
      }
    }
    return {
      success: false,
      error: 'Failed to save assumptions',
    }
  }
}

async function createAuditLog(valuationId: string, action: string, data: any) {
  // In production, save to audit log table
  console.log('Audit log:', {
    valuationId,
    action,
    data,
    timestamp: new Date().toISOString(),
    userId: 'current-user', // Get from auth
  })
}
