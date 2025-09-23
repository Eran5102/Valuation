import { useState, useCallback, useEffect } from 'react'
import { useScenario } from './useScenario'
import { useValuationData } from '@/contexts/ValuationDataContext'
import { useCompanyFinancialData } from './useCompanyFinancialData'
import { useWorkingCapitalCalculations } from './useWorkingCapitalCalculations'
import { useDepreciationCapexData } from './useDepreciationCapexData'
import { useDebtScheduleData } from './useDebtScheduleData'
import { useProjectSettings } from '@/contexts/ProjectSettingsContext'
import { generateProjectionLabels } from '@/utils/fiscalYearUtils'

// Define interfaces to match the actual structure of the data
interface HistoricalFinancials {
  incomeStatement?: {
    revenue?: number[]
    ebitda?: number[]
    // Add other properties as needed
  }
  balanceSheet?: {
    accountsReceivable?: number[]
    inventory?: number[]
    accountsPayable?: number[]
    ppe?: number[]
    cash?: number[]
    debt?: number[]
    retainedEarnings?: number[]
    // Add other properties as needed
  }
  lastActualRevenue?: number
}

// Helper function to safely perform division and avoid NaN
const safeDivide = (numerator: number, denominator: number): number => {
  return denominator !== 0 ? numerator / denominator : 0
}

// Helper function to ensure a value is a number
const ensureNumber = (value: any): number => {
  return typeof value === 'number' && !isNaN(value) ? value : 0
}

export function useIntegratedFinancialModel(projectId: string) {
  const [isCalculating, setIsCalculating] = useState(false)
  const [calculationError, setCalculationError] = useState<string | null>(null)
  const { assumptions, historicals } = useScenario(projectId)
  const { financialData } = useCompanyFinancialData()
  const { settings } = useProjectSettings()

  // Get working capital calculations with proper parameters
  const workingCapitalResults = useWorkingCapitalCalculations(
    assumptions || {},
    historicals || {},
    settings.forecastPeriod || 5
  )

  // Get debt schedule with proper parameter
  const { debtSchedule } = useDebtScheduleData(settings.forecastPeriod || 5)

  // Get depreciation capex data
  const { depreciationCapexData } = useDepreciationCapexData(settings.forecastPeriod || 5)

  const { setFinancialProjections, financialProjections } = useValuationData()

  // Listen for active scenario changes
  useEffect(() => {
    const handleScenarioChange = (event: Event) => {
      // Clear existing projections when scenario changes
      setFinancialProjections(null)
      // Recalculate with a slight delay to ensure all data is loaded
      setTimeout(() => {
        calculateFinancialProjections()
      }, 200)
    }

    window.addEventListener('activeScenarioChanged', handleScenarioChange)
    return () => {
      window.removeEventListener('activeScenarioChanged', handleScenarioChange)
    }
  }, [setFinancialProjections])

  // Function to calculate the integrated financial projections
  const calculateFinancialProjections = useCallback(() => {
    setIsCalculating(true)
    setCalculationError(null)

    try {
      // Check for required data
      if (!assumptions || !historicals) {
        throw new Error('Missing scenario data. Please set up an active scenario first.')
      }

      // Define forecast period and generate year labels
      const forecastPeriod = settings.forecastPeriod || 5
      const baseYear = new Date().getFullYear()
      const fiscalYearEnd = settings.fiscalYearEnd || '12-31'
      // Convert to string for fiscalYearUtils function
      const years = generateProjectionLabels(baseYear.toString(), fiscalYearEnd, forecastPeriod)

      // Extract drivers from assumptions with safeguards
      const revenueGrowth =
        assumptions.incomeCf?.['Sales Growth (%)']?.map(
          (rate: number) => ensureNumber(rate) / 100
        ) || Array(forecastPeriod).fill(0.05)
      const ebitdaMargin =
        assumptions.incomeCf?.['EBITDA Margin (%)']?.map(
          (rate: number) => ensureNumber(rate) / 100
        ) || Array(forecastPeriod).fill(0.15)
      const taxRate = ensureNumber(settings.taxRate) / 100

      // Get data from supporting schedules - properly access depreciation data
      const depreciationMethod = depreciationCapexData?.depreciationMethod || 'straight_line'
      const depreciationRate = ensureNumber(depreciationCapexData?.depreciationRate) || 0.1

      // Create default depreciation and capex rates if not available in data
      const depreciationRates = Array(forecastPeriod).fill(0.03)
      const capexRates = Array(forecastPeriod).fill(0.05)

      // Extract working capital assumptions with safeguards
      const arDays =
        assumptions.balanceSheet?.['A/R Days']?.map(ensureNumber) || Array(forecastPeriod).fill(45)
      const inventoryDays =
        assumptions.balanceSheet?.['Inventory Days']?.map(ensureNumber) ||
        Array(forecastPeriod).fill(60)
      const apDays =
        assumptions.balanceSheet?.['A/P Days']?.map(ensureNumber) || Array(forecastPeriod).fill(30)

      // Get last year's financials from historicals - safely access with type checks and defaults
      // Cast historicals to our defined type for better type safety
      const histData = historicals as unknown as HistoricalFinancials

      const lastRevenue =
        histData.incomeStatement?.revenue && histData.incomeStatement.revenue.length > 0
          ? ensureNumber(
              histData.incomeStatement.revenue[histData.incomeStatement.revenue.length - 1]
            )
          : 1000

      const lastEbitda =
        histData.incomeStatement?.ebitda && histData.incomeStatement.ebitda.length > 0
          ? ensureNumber(
              histData.incomeStatement.ebitda[histData.incomeStatement.ebitda.length - 1]
            )
          : 150

      const lastAr =
        histData.balanceSheet?.accountsReceivable &&
        histData.balanceSheet.accountsReceivable.length > 0
          ? ensureNumber(
              histData.balanceSheet.accountsReceivable[
                histData.balanceSheet.accountsReceivable.length - 1
              ]
            )
          : 123

      const lastInventory =
        histData.balanceSheet?.inventory && histData.balanceSheet.inventory.length > 0
          ? ensureNumber(
              histData.balanceSheet.inventory[histData.balanceSheet.inventory.length - 1]
            )
          : 185

      const lastAp =
        histData.balanceSheet?.accountsPayable && histData.balanceSheet.accountsPayable.length > 0
          ? ensureNumber(
              histData.balanceSheet.accountsPayable[
                histData.balanceSheet.accountsPayable.length - 1
              ]
            )
          : 78

      const lastPpe =
        histData.balanceSheet?.ppe && histData.balanceSheet.ppe.length > 0
          ? ensureNumber(histData.balanceSheet.ppe[histData.balanceSheet.ppe.length - 1])
          : 500

      const lastCash =
        histData.balanceSheet?.cash && histData.balanceSheet.cash.length > 0
          ? ensureNumber(histData.balanceSheet.cash[histData.balanceSheet.cash.length - 1])
          : 200

      const lastDebt =
        histData.balanceSheet?.debt && histData.balanceSheet.debt.length > 0
          ? ensureNumber(histData.balanceSheet.debt[histData.balanceSheet.debt.length - 1])
          : 300

      const lastRetainedEarnings =
        histData.balanceSheet?.retainedEarnings && histData.balanceSheet.retainedEarnings.length > 0
          ? ensureNumber(
              histData.balanceSheet.retainedEarnings[
                histData.balanceSheet.retainedEarnings.length - 1
              ]
            )
          : 500

      // Initialize projected financial statements
      const revenue: number[] = []
      const cogs: number[] = []
      const grossProfit: number[] = []
      const sgaExpense: number[] = []
      const ebitda: number[] = []
      const depreciation: number[] = []
      const ebit: number[] = []
      const interestExpense: number[] = []
      const ebt: number[] = []
      const taxes: number[] = []
      const netIncome: number[] = []

      // Balance Sheet items
      const cashAndEquivalents: number[] = [lastCash]
      const accountsReceivable: number[] = []
      const inventory: number[] = []
      const otherCurrentAssets: number[] = Array(forecastPeriod).fill(50) // Placeholder
      const propertyPlantEquipment: number[] = [lastPpe]
      const accumulatedDepreciation: number[] = [0] // Starting from 0 for simplicity
      const netPpe: number[] = []
      const goodwillAndIntangibles: number[] = Array(forecastPeriod).fill(100) // Placeholder
      const otherNonCurrentAssets: number[] = Array(forecastPeriod).fill(75) // Placeholder

      const accountsPayable: number[] = []
      const shortTermDebt: number[] = Array(forecastPeriod).fill(50) // Placeholder
      const otherCurrentLiabilities: number[] = Array(forecastPeriod).fill(40) // Placeholder
      const longTermDebt: number[] = [lastDebt]
      const otherNonCurrentLiabilities: number[] = Array(forecastPeriod).fill(20) // Placeholder

      const commonStock: number[] = Array(forecastPeriod).fill(200) // Constant
      const retainedEarnings: number[] = [lastRetainedEarnings]

      // Cash Flow items
      const changeInAccountsReceivable: number[] = []
      const changeInInventory: number[] = []
      const changeInAccountsPayable: number[] = []
      const changeInOtherWorkingCapital: number[] = []
      const capitalExpenditures: number[] = []
      const netChangeInDebt: number[] = []
      const dividendsPaid: number[] = Array(forecastPeriod).fill(0) // Assume no dividends initially
      const netChangeInCash: number[] = []
      const beginningCashBalance: number[] = [lastCash]
      const endingCashBalance: number[] = []

      // Calculate Income Statement projections
      for (let i = 0; i < forecastPeriod; i++) {
        // Revenue
        const currentRevenue =
          i === 0
            ? lastRevenue * (1 + ensureNumber(revenueGrowth[i]))
            : revenue[i - 1] * (1 + ensureNumber(revenueGrowth[i]))
        revenue.push(currentRevenue)

        // EBITDA based on margin
        const currentEbitda = currentRevenue * ensureNumber(ebitdaMargin[i])
        ebitda.push(currentEbitda)

        // Depreciation
        const currentDepreciation = currentRevenue * ensureNumber(depreciationRates[i])
        depreciation.push(currentDepreciation)

        // EBIT
        const currentEbit = currentEbitda - currentDepreciation
        ebit.push(currentEbit)

        // Interest Expense (from debt schedule or simplified)
        // Use long-term debt from previous step to avoid undefined values
        const debtValue = i === 0 ? longTermDebt[0] : longTermDebt[i]
        const currentInterest = ensureNumber(debtValue) * 0.05 // Simplified - 5% interest rate
        interestExpense.push(currentInterest)

        // EBT
        const currentEbt = currentEbit - currentInterest
        ebt.push(currentEbt)

        // Taxes
        const currentTaxes = currentEbt > 0 ? currentEbt * taxRate : 0
        taxes.push(currentTaxes)

        // Net Income
        const currentNetIncome = currentEbt - currentTaxes
        netIncome.push(currentNetIncome)

        // COGS (reverse calculated from EBITDA and assumed SG&A)
        const currentSga = currentRevenue * 0.2 // Assumed 20% of revenue for SG&A
        sgaExpense.push(currentSga)
        const currentCogs = currentRevenue - currentEbitda - currentSga
        cogs.push(currentCogs)

        // Gross Profit
        const currentGrossProfit = currentRevenue - currentCogs
        grossProfit.push(currentGrossProfit)
      }

      // Calculate Balance Sheet projections
      for (let i = 0; i < forecastPeriod; i++) {
        // Working capital items based on days outstanding
        const currentAr = revenue[i] * (ensureNumber(arDays[i]) / 365)
        accountsReceivable.push(currentAr)

        const currentInventory = cogs[i] * (ensureNumber(inventoryDays[i]) / 365)
        inventory.push(currentInventory)

        const currentAp = cogs[i] * (ensureNumber(apDays[i]) / 365)
        accountsPayable.push(currentAp)

        // PP&E and accumulated depreciation
        const currentCapex = revenue[i] * ensureNumber(capexRates[i])
        capitalExpenditures.push(currentCapex)

        const newPpe =
          i === 0
            ? propertyPlantEquipment[i] + currentCapex
            : propertyPlantEquipment[i] + currentCapex
        propertyPlantEquipment.push(newPpe)

        const newAccumDepr =
          i === 0
            ? accumulatedDepreciation[i] + depreciation[i]
            : accumulatedDepreciation[i] + depreciation[i]
        accumulatedDepreciation.push(newAccumDepr)

        netPpe.push(propertyPlantEquipment[i + 1] - accumulatedDepreciation[i + 1])

        // Long-term debt (simplified, assuming constant for now but ensuring it's populated)
        if (i > 0) {
          longTermDebt.push(longTermDebt[0]) // Placeholder, should integrate with debt schedule
        }

        // Retained Earnings
        const newRetainedEarnings =
          ensureNumber(retainedEarnings[i]) +
          ensureNumber(netIncome[i]) -
          ensureNumber(dividendsPaid[i])
        retainedEarnings.push(newRetainedEarnings)
      }

      // Calculate Cash Flow projections
      for (let i = 0; i < forecastPeriod; i++) {
        // Changes in working capital
        const arChange =
          i === 0
            ? accountsReceivable[i] - lastAr
            : accountsReceivable[i] - accountsReceivable[i - 1]
        changeInAccountsReceivable.push(arChange)

        const invChange = i === 0 ? inventory[i] - lastInventory : inventory[i] - inventory[i - 1]
        changeInInventory.push(invChange)

        const apChange =
          i === 0 ? accountsPayable[i] - lastAp : accountsPayable[i] - accountsPayable[i - 1]
        changeInAccountsPayable.push(apChange)

        // Other working capital changes (placeholder)
        changeInOtherWorkingCapital.push(0)

        // Change in debt (placeholder, should integrate with debt schedule)
        netChangeInDebt.push(0)

        // Net change in cash
        const operatingCashFlow =
          netIncome[i] +
          depreciation[i] -
          arChange -
          invChange +
          apChange -
          changeInOtherWorkingCapital[i]
        const investingCashFlow = -capitalExpenditures[i]
        const financingCashFlow = netChangeInDebt[i] - dividendsPaid[i]

        const cashChange = operatingCashFlow + investingCashFlow + financingCashFlow
        netChangeInCash.push(cashChange)

        // Update cash balances
        const newCashBalance =
          i === 0 ? beginningCashBalance[i] + cashChange : endingCashBalance[i - 1] + cashChange
        endingCashBalance.push(ensureNumber(newCashBalance))

        if (i < forecastPeriod - 1) {
          beginningCashBalance.push(endingCashBalance[i])
        }
      }

      // Calculate totals and subtotals
      const totalCurrentAssets = []
      const totalNonCurrentAssets = []
      const totalAssets = []
      const totalCurrentLiabilities = []
      const totalNonCurrentLiabilities = []
      const totalLiabilities = []
      const totalEquity = []
      const balanceCheck = []

      for (let i = 0; i < forecastPeriod; i++) {
        // Total current assets
        const curAssets =
          ensureNumber(endingCashBalance[i]) +
          ensureNumber(accountsReceivable[i]) +
          ensureNumber(inventory[i]) +
          ensureNumber(otherCurrentAssets[i])
        totalCurrentAssets.push(curAssets)

        // Total non-current assets
        const nonCurAssets =
          ensureNumber(netPpe[i]) +
          ensureNumber(goodwillAndIntangibles[i]) +
          ensureNumber(otherNonCurrentAssets[i])
        totalNonCurrentAssets.push(nonCurAssets)

        // Total assets
        const assets = curAssets + nonCurAssets
        totalAssets.push(assets)

        // Total current liabilities
        const curLiab =
          ensureNumber(accountsPayable[i]) +
          ensureNumber(shortTermDebt[i]) +
          ensureNumber(otherCurrentLiabilities[i])
        totalCurrentLiabilities.push(curLiab)

        // Total non-current liabilities
        // Ensure we access the correct index for long-term debt
        const ltDebtForPeriod =
          i + 1 < longTermDebt.length ? longTermDebt[i + 1] : longTermDebt[longTermDebt.length - 1]
        const nonCurLiab =
          ensureNumber(ltDebtForPeriod) + ensureNumber(otherNonCurrentLiabilities[i])
        totalNonCurrentLiabilities.push(nonCurLiab)

        // Total liabilities
        const liab = curLiab + nonCurLiab
        totalLiabilities.push(liab)

        // Total equity
        // Ensure we access the correct index for retained earnings
        const retainedForPeriod =
          i + 1 < retainedEarnings.length
            ? retainedEarnings[i + 1]
            : retainedEarnings[retainedEarnings.length - 1]
        const equity = ensureNumber(commonStock[i]) + ensureNumber(retainedForPeriod)
        totalEquity.push(equity)

        // Balance check
        const check = assets - liab - equity
        balanceCheck.push(check)
      }

      // Calculate net cash from operations, investing, and financing
      const netCashFromOperations = []
      const netCashFromInvesting = []
      const netCashFromFinancing = []

      for (let i = 0; i < forecastPeriod; i++) {
        // Net cash from operations
        const opCash =
          ensureNumber(netIncome[i]) +
          ensureNumber(depreciation[i]) -
          ensureNumber(changeInAccountsReceivable[i]) -
          ensureNumber(changeInInventory[i]) +
          ensureNumber(changeInAccountsPayable[i]) -
          ensureNumber(changeInOtherWorkingCapital[i])
        netCashFromOperations.push(opCash)

        // Net cash from investing
        netCashFromInvesting.push(-ensureNumber(capitalExpenditures[i]))

        // Net cash from financing
        netCashFromFinancing.push(ensureNumber(netChangeInDebt[i]) - ensureNumber(dividendsPaid[i]))
      }

      // Create the final integrated projection object
      const projections = {
        years: years,
        incomeStatement: {
          revenue,
          cogs,
          grossProfit,
          sgaExpense,
          ebitda,
          depreciation,
          ebit,
          interestExpense,
          ebt,
          taxes,
          netIncome,
        },
        balanceSheet: {
          cashAndEquivalents: endingCashBalance,
          accountsReceivable,
          inventory,
          otherCurrentAssets,
          totalCurrentAssets,
          propertyPlantEquipment: propertyPlantEquipment.slice(1), // Remove first element (initial value)
          accumulatedDepreciation: accumulatedDepreciation.slice(1), // Remove first element (initial value)
          netPpe,
          goodwillAndIntangibles,
          otherNonCurrentAssets,
          totalNonCurrentAssets,
          totalAssets,
          accountsPayable,
          shortTermDebt,
          otherCurrentLiabilities,
          totalCurrentLiabilities,
          longTermDebt: longTermDebt.slice(1), // Remove first element (initial value)
          otherNonCurrentLiabilities,
          totalNonCurrentLiabilities,
          totalLiabilities,
          commonStock,
          retainedEarnings: retainedEarnings.slice(1), // Remove first element (initial value)
          totalEquity,
          balanceCheck,
        },
        cashFlow: {
          netIncome,
          depreciation,
          changeInAccountsReceivable,
          changeInInventory,
          changeInAccountsPayable,
          changeInOtherWorkingCapital,
          netCashFromOperations,
          capitalExpenditures,
          netCashFromInvesting,
          netChangeInDebt,
          dividendsPaid,
          netCashFromFinancing,
          netChangeInCash,
          beginningCashBalance,
          endingCashBalance,
        },
      }

      // Save the projections to the context
      setFinancialProjections(projections)

      setIsCalculating(false)
      return projections
    } catch (error) {
      console.error('Error calculating financial projections:', error)
      setCalculationError(
        error instanceof Error
          ? error.message
          : 'Unknown error in financial projections calculation'
      )
      setIsCalculating(false)
      return null
    }
  }, [
    assumptions,
    historicals,
    settings,
    setFinancialProjections,
    depreciationCapexData,
    debtSchedule,
  ])

  return {
    calculateFinancialProjections,
    isCalculating,
    calculationError,
  }
}
