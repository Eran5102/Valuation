import {
  DCFModelData,
  DCFCoreAssumptions,
  DebtScheduleData,
  WorkingCapitalData,
  CapexDepreciationData,
  WACCData,
  FinancialStatementData,
  DCFValuationResult,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  WorkingCapitalPeriod,
  CapexProjection,
  DebtProjection,
} from '@/types/dcf'

export class DCFIntegrationService {
  private modelCache: Map<string, DCFModelData> = new Map()

  /**
   * Integrate all DCF components into a unified model
   */
  async integrateModel(
    valuationId: string,
    assumptions: DCFCoreAssumptions,
    components: {
      debt?: DebtScheduleData
      workingCapital?: WorkingCapitalData
      capex?: CapexDepreciationData
      wacc?: WACCData
    }
  ): Promise<DCFModelData> {
    // Generate financial statements based on inputs
    const financialStatements = this.generateFinancialStatements(assumptions, components)

    // Calculate DCF valuation
    const dcfValuation = this.calculateDCFValuation(
      financialStatements,
      assumptions,
      components.wacc
    )

    const model: DCFModelData = {
      assumptions,
      debtSchedule: components.debt,
      workingCapital: components.workingCapital,
      capexDepreciation: components.capex,
      wacc: components.wacc,
      financialStatements,
      dcfValuation,
      lastUpdated: new Date().toISOString(),
      version: 1,
    }

    // Cache the model
    this.modelCache.set(valuationId, model)

    return model
  }

  /**
   * Generate integrated financial statements
   */
  private generateFinancialStatements(
    assumptions: DCFCoreAssumptions,
    components: {
      debt?: DebtScheduleData
      workingCapital?: WorkingCapitalData
      capex?: CapexDepreciationData
      wacc?: WACCData
    }
  ): FinancialStatementData[] {
    const statements: FinancialStatementData[] = []
    const currentYear = new Date().getFullYear()
    const baseYear = assumptions.baseYear || currentYear

    // Generate historical + projected years
    const totalYears = assumptions.historicalYears + assumptions.projectionYears
    const startYear = baseYear - assumptions.historicalYears

    for (let i = 0; i < totalYears; i++) {
      const year = startYear + i
      const isHistorical = year <= baseYear
      const isProjected = year > baseYear
      const projectionIndex = year - baseYear - 1

      // Get revenue (simplified - should come from revenue module)
      const revenue = this.getRevenue(year, assumptions, isHistorical)
      const previousRevenue = i > 0 ? statements[i - 1].revenue : revenue * 0.85
      const revenueGrowth =
        previousRevenue > 0 ? ((revenue - previousRevenue) / previousRevenue) * 100 : 0

      // Calculate COGS and OpEx
      const cogs = revenue * 0.4 // Should come from assumptions
      const grossProfit = revenue - cogs
      const grossMargin = (grossProfit / revenue) * 100

      const operatingExpenses = revenue * 0.35 // Should be more detailed
      const ebitda = grossProfit - operatingExpenses
      const ebitdaMargin = (ebitda / revenue) * 100

      // Get depreciation based on method
      const depreciation = this.getDepreciation(
        year,
        revenue,
        assumptions,
        components.capex,
        projectionIndex
      )
      const amortization = revenue * 0.005 // Simplified

      const ebit = ebitda - depreciation - amortization

      // Get interest expense based on method
      const interestExpense = this.getInterestExpense(
        year,
        assumptions,
        components.debt,
        projectionIndex
      )

      const ebt = ebit - interestExpense

      // Calculate taxes using effective rate
      const taxes = Math.max(0, ebt * (assumptions.effectiveTaxRate / 100))
      const netIncome = ebt - taxes

      // Calculate working capital change
      const changeInNWC = this.getWorkingCapitalChange(
        year,
        revenue,
        assumptions,
        components.workingCapital,
        projectionIndex,
        i > 0 ? statements[i - 1].revenue : 0
      )

      // Get capex
      const capex = this.getCapex(year, revenue, assumptions, components.capex, projectionIndex)

      // Calculate cash flows
      const operatingCashFlow = netIncome + depreciation + amortization - changeInNWC
      const freeCashFlow = operatingCashFlow - capex
      const unleveredFreeCashFlow =
        ebit * (1 - assumptions.effectiveTaxRate / 100) +
        depreciation +
        amortization -
        changeInNWC -
        capex

      // Balance sheet items (simplified)
      const totalAssets = revenue * 1.2 // Simplified
      const totalLiabilities = this.getTotalLiabilities(components.debt, projectionIndex)
      const totalEquity = totalAssets - totalLiabilities
      const netDebt = this.getNetDebt(components.debt, assumptions.cashBalance, projectionIndex)

      statements.push({
        year,
        isHistorical,
        isProjected,
        revenue,
        revenueGrowth,
        cogs,
        grossProfit,
        grossMargin,
        operatingExpenses,
        ebitda,
        ebitdaMargin,
        depreciation,
        amortization,
        ebit,
        interestExpense,
        ebt,
        taxes,
        netIncome,
        totalAssets,
        totalLiabilities,
        totalEquity,
        netDebt,
        operatingCashFlow,
        capex,
        changeInNWC,
        freeCashFlow,
        unleveredFreeCashFlow,
      })
    }

    return statements
  }

  /**
   * Get depreciation based on selected method
   */
  private getDepreciation(
    year: number,
    revenue: number,
    assumptions: DCFCoreAssumptions,
    capexData?: CapexDepreciationData,
    projectionIndex?: number
  ): number {
    switch (assumptions.depreciationMethod) {
      case 'schedule':
        // Use detailed schedule if available
        if (capexData?.projections && projectionIndex !== undefined && projectionIndex >= 0) {
          return capexData.projections[projectionIndex]?.depreciation || 0
        }
        // Fallback to percentage
        return revenue * ((assumptions.depreciationPercent || 3) / 100)

      case 'percentage':
        return revenue * ((assumptions.depreciationPercent || 3) / 100)

      case 'manual':
        // Would need manual input array
        return revenue * 0.03 // Fallback

      default:
        return revenue * 0.03
    }
  }

  /**
   * Get interest expense based on selected method
   */
  private getInterestExpense(
    year: number,
    assumptions: DCFCoreAssumptions,
    debtData?: DebtScheduleData,
    projectionIndex?: number
  ): number {
    switch (assumptions.interestMethod) {
      case 'schedule':
        // Use detailed debt schedule
        if (debtData?.projections && projectionIndex !== undefined && projectionIndex >= 0) {
          return debtData.projections[projectionIndex]?.interestExpense || 0
        }
        // Fallback to summary
        return debtData?.summary?.annualInterestExpense || 0

      case 'average':
        // Use weighted average rate
        if (debtData?.summary) {
          const avgDebt = assumptions.debtBalance || 0
          const avgRate = debtData.summary.weightedAverageRate / 100
          return avgDebt * avgRate
        }
        return 0

      case 'fixed':
        // Use fixed rate on debt balance
        const fixedRate = 0.05 // Should come from assumptions
        return (assumptions.debtBalance || 0) * fixedRate

      default:
        return 0
    }
  }

  /**
   * Get working capital change based on selected method
   */
  private getWorkingCapitalChange(
    year: number,
    revenue: number,
    assumptions: DCFCoreAssumptions,
    wcData?: WorkingCapitalData,
    projectionIndex?: number,
    previousRevenue?: number
  ): number {
    switch (assumptions.workingCapitalMethod) {
      case 'detailed':
        // Use detailed working capital schedule
        if (wcData?.projected && projectionIndex !== undefined && projectionIndex >= 0) {
          return wcData.projected[projectionIndex]?.changeInNWC || 0
        }
        // Fallback to percentage
        const revenueChange = revenue - (previousRevenue || 0)
        return revenueChange * ((assumptions.workingCapitalPercent || 10) / 100)

      case 'percentage':
        // Simple percentage of revenue change
        const revChange = revenue - (previousRevenue || 0)
        return revChange * ((assumptions.workingCapitalPercent || 10) / 100)

      case 'days':
        // Calculate based on days outstanding
        if (wcData?.assumptions) {
          const dso = wcData.assumptions.daysReceivables
          const dio = wcData.assumptions.daysInventory
          const dpo = wcData.assumptions.daysPayables

          const ar = (revenue * dso) / 365
          const inv = (revenue * 0.4 * dio) / 365 // COGS * DIO
          const ap = (revenue * 0.4 * dpo) / 365 // COGS * DPO

          const currentNWC = ar + inv - ap
          const prevNWC = previousRevenue
            ? (previousRevenue * dso) / 365 +
              (previousRevenue * 0.4 * dio) / 365 -
              (previousRevenue * 0.4 * dpo) / 365
            : 0

          return currentNWC - prevNWC
        }
        return 0

      default:
        return 0
    }
  }

  /**
   * Get capex based on selected method
   */
  private getCapex(
    year: number,
    revenue: number,
    assumptions: DCFCoreAssumptions,
    capexData?: CapexDepreciationData,
    projectionIndex?: number
  ): number {
    switch (assumptions.capexMethod) {
      case 'schedule':
        // Use detailed capex schedule
        if (capexData?.projections && projectionIndex !== undefined && projectionIndex >= 0) {
          return capexData.projections[projectionIndex]?.totalCapex || 0
        }
        // Fallback to percentage
        return revenue * ((assumptions.capexPercent || 5) / 100)

      case 'percentage':
        // Percentage of revenue
        return revenue * ((assumptions.capexPercent || 5) / 100)

      case 'growth':
        // Growth-based capex
        const maintenanceCapex = revenue * ((assumptions.maintenanceCapexPercent || 3) / 100)
        const growthCapex = revenue * ((assumptions.growthCapexPercent || 2) / 100)
        return maintenanceCapex + growthCapex

      default:
        return revenue * 0.05
    }
  }

  /**
   * Calculate DCF valuation
   */
  private calculateDCFValuation(
    statements: FinancialStatementData[],
    assumptions: DCFCoreAssumptions,
    waccData?: WACCData
  ): DCFValuationResult {
    // Get projected cash flows only
    const projectedStatements = statements.filter((s) => s.isProjected)

    // Use WACC if available, otherwise use discount rate from assumptions
    const discountRate = waccData?.calculatedWACC || assumptions.discountRate
    const wacc = discountRate / 100
    const terminalGrowth = assumptions.terminalGrowthRate / 100
    const taxRate = assumptions.effectiveTaxRate

    // Calculate PV of projected cash flows
    const projectedCashFlows = projectedStatements.map((statement, index) => {
      const yearNumber = index + 1
      const discountFactor =
        assumptions.discountingConvention === 'Mid-Year'
          ? Math.pow(1 + wacc, yearNumber - 0.5)
          : Math.pow(1 + wacc, yearNumber)

      const presentValue = statement.unleveredFreeCashFlow / discountFactor

      return {
        year: statement.year,
        unleveredFCF: statement.unleveredFreeCashFlow,
        discountFactor,
        presentValue,
      }
    })

    const sumOfPVCashFlows = projectedCashFlows.reduce((sum, cf) => sum + cf.presentValue, 0)

    // Terminal value calculation
    const lastStatement = projectedStatements[projectedStatements.length - 1]
    const terminalYear = lastStatement.year
    const terminalCashFlow = lastStatement.unleveredFreeCashFlow * (1 + terminalGrowth)
    const terminalValue = terminalCashFlow / (wacc - terminalGrowth)

    const terminalDiscountFactor =
      assumptions.discountingConvention === 'Mid-Year'
        ? Math.pow(1 + wacc, projectedStatements.length - 0.5)
        : Math.pow(1 + wacc, projectedStatements.length)

    const presentValueOfTerminal = terminalValue / terminalDiscountFactor

    // Enterprise value calculation
    const enterpriseValue = sumOfPVCashFlows + presentValueOfTerminal

    // Equity value calculation
    const currentDebt = assumptions.debtBalance || 0
    const cashBalance = assumptions.cashBalance || 0
    const equityValue = enterpriseValue - currentDebt + cashBalance

    // Per share calculation
    const sharesOutstanding = 10000000 // Should come from cap table
    const valuePerShare = equityValue / sharesOutstanding

    // Metrics
    const terminalValuePercent = (presentValueOfTerminal / enterpriseValue) * 100
    const impliedExitMultiple = terminalValue / lastStatement.ebitda

    return {
      wacc: discountRate,
      terminalGrowthRate: assumptions.terminalGrowthRate,
      taxRate,
      projectedCashFlows,
      terminalYear,
      terminalCashFlow,
      terminalValue,
      terminalDiscountFactor,
      presentValueOfTerminal,
      sumOfPVCashFlows,
      enterpriseValue,
      lessDebt: currentDebt,
      plusCash: cashBalance,
      equityValue,
      sharesOutstanding,
      valuePerShare,
      terminalValuePercent,
      impliedExitMultiple,
    }
  }

  /**
   * Get revenue for a given year
   */
  private getRevenue(year: number, assumptions: DCFCoreAssumptions, isHistorical: boolean): number {
    // This is simplified - should integrate with revenue projections
    const baseRevenue = 10000000
    const yearOffset = year - (assumptions.baseYear || new Date().getFullYear())

    if (isHistorical) {
      return baseRevenue * Math.pow(1.15, yearOffset)
    } else {
      // Projected growth rates
      const growthRates = [0.2, 0.18, 0.15, 0.12, 0.1] // Should come from assumptions
      const growthIndex = Math.min(yearOffset - 1, growthRates.length - 1)
      const growthRate = growthRates[Math.max(0, growthIndex)]
      return baseRevenue * Math.pow(1 + growthRate, Math.max(1, yearOffset))
    }
  }

  /**
   * Get total liabilities
   */
  private getTotalLiabilities(debtData?: DebtScheduleData, projectionIndex?: number): number {
    if (debtData?.projections && projectionIndex !== undefined && projectionIndex >= 0) {
      const debtProj = debtData.projections[projectionIndex]
      return debtProj?.endingBalance || 0
    }
    return debtData?.summary?.totalDebt || 0
  }

  /**
   * Get net debt
   */
  private getNetDebt(
    debtData?: DebtScheduleData,
    cashBalance?: number,
    projectionIndex?: number
  ): number {
    const totalDebt = this.getTotalLiabilities(debtData, projectionIndex)
    return totalDebt - (cashBalance || 0)
  }

  /**
   * Validate the DCF model
   */
  validateModel(model: DCFModelData): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Validate assumptions
    if (model.assumptions.projectionYears > 10) {
      warnings.push({
        field: 'projectionYears',
        message: 'Projection period exceeds 10 years',
        suggestion: 'Consider using 5-7 years for more reliable projections',
      })
    }

    if (model.assumptions.terminalGrowthRate > 5) {
      errors.push({
        field: 'terminalGrowthRate',
        message: 'Terminal growth rate exceeds reasonable bounds',
        severity: 'error',
      })
    }

    if (model.assumptions.effectiveTaxRate > 50) {
      warnings.push({
        field: 'effectiveTaxRate',
        message: 'Tax rate seems high',
        suggestion: 'Verify combined federal and state tax rates',
      })
    }

    // Validate WACC
    if (model.wacc && model.wacc.calculatedWACC < 5) {
      warnings.push({
        field: 'wacc',
        message: 'WACC seems low',
        suggestion: 'Review risk premiums and capital structure',
      })
    }

    // Validate terminal value percentage
    if (model.dcfValuation && model.dcfValuation.terminalValuePercent > 75) {
      warnings.push({
        field: 'terminalValue',
        message: 'Terminal value represents over 75% of enterprise value',
        suggestion: 'Consider extending projection period or reviewing growth assumptions',
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Clear cache for a valuation
   */
  clearCache(valuationId: string): void {
    this.modelCache.delete(valuationId)
  }

  /**
   * Get cached model
   */
  getCachedModel(valuationId: string): DCFModelData | undefined {
    return this.modelCache.get(valuationId)
  }
}

// Export singleton instance
export const dcfIntegrationService = new DCFIntegrationService()
