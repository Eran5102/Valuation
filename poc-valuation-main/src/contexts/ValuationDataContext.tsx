import React, { createContext, useContext, useState, useEffect } from 'react'
import { useProjectSettings } from './ProjectSettingsContext'
import { useCompanyFinancialData } from '@/hooks/useCompanyFinancialData'

interface ValuationResults {
  enterpriseValue: {
    low: number
    high: number
  }
  equityValue: {
    low: number
    high: number
  }
  impliedMultiples?: {
    evToRevenue?: number
    evToEbitda?: number
    priceToEarnings?: number
  }
}

interface DCFMethodResults extends ValuationResults {
  discountRate: number
  terminalGrowthRate: number
  terminalMultiple?: number
}

interface CompsMethodResults extends ValuationResults {
  appliedMultiples: {
    name: string
    multipleLow: number
    multipleHigh: number
    valueLow: number
    valueHigh: number
    weight: number
  }[]
}

// Define structures for financial statement projections
interface IncomeStatementProjection {
  revenue: number[]
  cogs: number[]
  grossProfit: number[]
  sgaExpense: number[]
  ebitda: number[]
  depreciation: number[]
  ebit: number[]
  interestExpense: number[]
  ebt: number[]
  taxes: number[]
  netIncome: number[]
}

interface BalanceSheetProjection {
  // Assets
  cashAndEquivalents: number[]
  accountsReceivable: number[]
  inventory: number[]
  otherCurrentAssets: number[]
  totalCurrentAssets: number[]
  propertyPlantEquipment: number[]
  accumulatedDepreciation: number[]
  netPpe: number[]
  goodwillAndIntangibles: number[]
  otherNonCurrentAssets: number[]
  totalNonCurrentAssets: number[]
  totalAssets: number[]

  // Liabilities
  accountsPayable: number[]
  shortTermDebt: number[]
  otherCurrentLiabilities: number[]
  totalCurrentLiabilities: number[]
  longTermDebt: number[]
  otherNonCurrentLiabilities: number[]
  totalNonCurrentLiabilities: number[]
  totalLiabilities: number[]

  // Equity
  commonStock: number[]
  retainedEarnings: number[]
  totalEquity: number[]

  // Check
  balanceCheck: number[] // Should be zero if balanced
}

interface CashFlowProjection {
  // Operating Activities
  netIncome: number[]
  depreciation: number[]
  changeInAccountsReceivable: number[]
  changeInInventory: number[]
  changeInAccountsPayable: number[]
  changeInOtherWorkingCapital: number[]
  netCashFromOperations: number[]

  // Investing Activities
  capitalExpenditures: number[]
  netCashFromInvesting: number[]

  // Financing Activities
  netChangeInDebt: number[]
  dividendsPaid: number[]
  netCashFromFinancing: number[]

  // Summary
  netChangeInCash: number[]
  beginningCashBalance: number[]
  endingCashBalance: number[]
}

interface FinancialProjections {
  incomeStatement: IncomeStatementProjection
  balanceSheet: BalanceSheetProjection
  cashFlow: CashFlowProjection
  years: string[]
}

interface ValuationDataContextType {
  // Core financial metrics
  workingCapital: number | null
  nwcChanges: number[] | null
  cashBalance: number | null
  debtBalance: number | null

  // WACC components
  wacc: number | null
  costOfEquity: number | null
  costOfDebt: number | null
  qualitativeRiskPremium: number | null

  // Valuation results
  dcfResults: DCFMethodResults | null
  compsResults: CompsMethodResults | null

  // Financial statement projections
  financialProjections: FinancialProjections | null

  // Active scenario tracking
  activeScenarioId: string
  activeScenarioName: string

  // Methods to update context values
  setWorkingCapital: (value: number) => void
  setNwcChanges: (values: number[]) => void
  setCashBalance: (value: number) => void
  setDebtBalance: (value: number) => void
  setWacc: (value: number) => void
  setCostOfEquity: (value: number) => void
  setCostOfDebt: (value: number) => void
  setQualitativeRiskPremium: (value: number) => void
  setDcfResults: (results: DCFMethodResults) => void
  setCompsResults: (results: CompsMethodResults) => void
  setFinancialProjections: (projections: FinancialProjections) => void
  setActiveScenario: (id: string, name: string) => void
}

const ValuationDataContext = createContext<ValuationDataContextType | undefined>(undefined)

export function ValuationDataProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useProjectSettings()
  const { financialData } = useCompanyFinancialData()

  // State for core financial metrics
  const [workingCapital, setWorkingCapital] = useState<number | null>(null)
  const [nwcChanges, setNwcChanges] = useState<number[] | null>(null)
  const [cashBalance, setCashBalance] = useState<number | null>(settings.cashBalance || 0)
  const [debtBalance, setDebtBalance] = useState<number | null>(settings.debtBalance || 0)

  // State for WACC components
  const [wacc, setWacc] = useState<number | null>(settings.discountRate || null)
  const [costOfEquity, setCostOfEquity] = useState<number | null>(null)
  const [costOfDebt, setCostOfDebt] = useState<number | null>(null)
  const [qualitativeRiskPremium, setQualitativeRiskPremium] = useState<number | null>(null)

  // State for valuation results
  const [dcfResults, setDcfResults] = useState<DCFMethodResults | null>(null)
  const [compsResults, setCompsResults] = useState<CompsMethodResults | null>(null)

  // State for financial statement projections
  const [financialProjections, setFinancialProjections] = useState<FinancialProjections | null>(
    null
  )

  // State for active scenario
  const [activeScenarioId, setActiveScenarioId] = useState<string>('')
  const [activeScenarioName, setActiveScenarioName] = useState<string>('')

  // Load active scenario from localStorage on mount
  useEffect(() => {
    const savedId = localStorage.getItem('activeScenarioId')
    const savedName = localStorage.getItem('activeScenarioName')

    if (savedId) {
      setActiveScenarioId(savedId)
    }

    if (savedName) {
      setActiveScenarioName(savedName)
    }
  }, [])

  // Update values from settings when they change
  useEffect(() => {
    setCashBalance(settings.cashBalance)
    setDebtBalance(settings.debtBalance)

    // Also update WACC/discount rate if it changes in settings
    if (settings.discountRate && (!wacc || wacc !== settings.discountRate)) {
      setWacc(settings.discountRate)

      // Update DCF results if they exist to reflect the new discount rate
      if (dcfResults) {
        setDcfResults({
          ...dcfResults,
          discountRate: settings.discountRate,
        })
      }
    }
  }, [settings.cashBalance, settings.debtBalance, settings.discountRate])

  // Listen for settings updates
  useEffect(() => {
    const handleSettingsUpdated = (event: CustomEvent) => {
      const updatedSettings = event.detail.settings

      // Update our local state if relevant settings have changed
      if (updatedSettings.cashBalance !== undefined) {
        setCashBalance(updatedSettings.cashBalance)
      }

      if (updatedSettings.debtBalance !== undefined) {
        setDebtBalance(updatedSettings.debtBalance)
      }

      if (updatedSettings.discountRate !== undefined) {
        setWacc(updatedSettings.discountRate)
      }
    }

    window.addEventListener('projectSettingsUpdated', handleSettingsUpdated as EventListener)

    return () => {
      window.removeEventListener('projectSettingsUpdated', handleSettingsUpdated as EventListener)
    }
  }, [])

  // Method to update active scenario
  const setActiveScenario = (id: string, name: string) => {
    setActiveScenarioId(id)
    setActiveScenarioName(name)
    localStorage.setItem('activeScenarioId', id)
    localStorage.setItem('activeScenarioName', name)

    // Dispatch event to notify other components about scenario change
    window.dispatchEvent(
      new CustomEvent('activeScenarioChanged', {
        detail: { id, name },
      })
    )
  }

  const value = {
    // Core financial metrics
    workingCapital,
    nwcChanges,
    cashBalance,
    debtBalance,

    // WACC components
    wacc,
    costOfEquity,
    costOfDebt,
    qualitativeRiskPremium,

    // Valuation results
    dcfResults,
    compsResults,

    // Financial statement projections
    financialProjections,

    // Active scenario tracking
    activeScenarioId,
    activeScenarioName,

    // Methods to update context values
    setWorkingCapital,
    setNwcChanges,
    setCashBalance,
    setDebtBalance,
    setWacc,
    setCostOfEquity,
    setCostOfDebt,
    setQualitativeRiskPremium,
    setDcfResults,
    setCompsResults,
    setFinancialProjections,
    setActiveScenario,
  }

  return <ValuationDataContext.Provider value={value}>{children}</ValuationDataContext.Provider>
}

export function useValuationData() {
  const context = useContext(ValuationDataContext)
  if (context === undefined) {
    throw new Error('useValuationData must be used within a ValuationDataProvider')
  }
  return context
}
