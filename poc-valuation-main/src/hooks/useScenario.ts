import { useState, useEffect } from 'react'
import {
  DEFAULT_ASSUMPTIONS,
  ScenarioAssumptions,
  DEFAULT_TERMINAL_ASSUMPTIONS,
  Scenario,
} from '@/utils/scenarioUtils'
import { useProjectSettings } from '@/contexts/ProjectSettingsContext'

interface HistoricalData {
  incomeStatement: any
  balanceSheet: any
  lastActualRevenue?: number // Make this optional
  lastActualEbit?: number // Add this property
  lastActualDepreciation?: number // Add this property
}

interface ScenarioSettings {
  forecastPeriod: number
  discountRate: number
  taxRate: number
  terminalValueMethod: string
  terminalGrowthRate: number
  exitMultipleValue: number
  exitMultipleMetric: string
  depreciationSource: 'scenario' | 'schedule'
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD'
  cashBalance: number
  debtBalance: number
  mostRecentFiscalYearEnd: string
  fiscalYearEnd: string
  maxProjectionYears: number
  // Terminal year specific fields
  terminalNopatMargin: number
  terminalReinvestmentRate: number
  // Add valuationDate property
  valuationDate?: string
}

export function useScenario(projectId: string) {
  const { settings: projectSettings } = useProjectSettings()

  const [scenario, setScenario] = useState<Partial<Scenario>>({
    id: 'base-case',
    name: 'Base Case',
    terminalAssumptions: DEFAULT_TERMINAL_ASSUMPTIONS,
  })

  const [assumptions, setAssumptions] = useState<ScenarioAssumptions>(DEFAULT_ASSUMPTIONS)

  const [historicals, setHistoricals] = useState<HistoricalData>({
    incomeStatement: {
      revenue: [900, 950, 1000],
      cogs: [585, 618, 650],
      sga: [135, 143, 150],
      depreciation: [27, 29, 30],
      ebit: [153, 161, 170],
    },
    balanceSheet: {
      cash: [100, 120, 150],
      accountsReceivable: [123, 130, 137],
      inventory: [95, 100, 110],
      otherCurrentAssets: [20, 21, 22],
      ppe: [500, 520, 550],
      accountsPayable: [82, 87, 92],
      accruals: [30, 32, 33],
    },
    lastActualRevenue: 1000, // Set this to match the latest revenue from incomeStatement
    lastActualEbit: 153, // Add this property
    lastActualDepreciation: 27, // Add this property
  })

  const [settings, setSettings] = useState<ScenarioSettings>({
    forecastPeriod: projectSettings.forecastPeriod || 5,
    discountRate: projectSettings.discountRate || 10,
    taxRate: projectSettings.taxRate || 25,
    terminalValueMethod: projectSettings.terminalValueMethod || 'PGM',
    terminalGrowthRate:
      projectSettings.terminalGrowthRate || DEFAULT_TERMINAL_ASSUMPTIONS.terminalGrowthRate,
    exitMultipleValue: projectSettings.exitMultipleValue || 8,
    exitMultipleMetric: projectSettings.exitMultipleMetric || 'EBITDA',
    depreciationSource: projectSettings.depreciationSource || 'scenario',
    currency: projectSettings.currency || 'USD',
    cashBalance: projectSettings.cashBalance || 150,
    debtBalance: projectSettings.debtBalance || 400,
    mostRecentFiscalYearEnd: projectSettings.mostRecentFiscalYearEnd || '2024-12-31',
    fiscalYearEnd: projectSettings.fiscalYearEnd || '12-31',
    maxProjectionYears: projectSettings.maxProjectionYears || 10,
    // Terminal year specific fields
    terminalNopatMargin:
      projectSettings.terminalNopatMargin || DEFAULT_TERMINAL_ASSUMPTIONS.terminalNopatMargin,
    terminalReinvestmentRate:
      projectSettings.terminalReinvestmentRate ||
      DEFAULT_TERMINAL_ASSUMPTIONS.terminalReinvestmentRate,
    // Add valuationDate property
    valuationDate: projectSettings.valuationDate || '2025-05-03',
  })

  // Update scenario settings when project settings change
  useEffect(() => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      discountRate: projectSettings.discountRate,
      taxRate: projectSettings.taxRate,
      terminalValueMethod: projectSettings.terminalValueMethod,
      terminalGrowthRate: projectSettings.terminalGrowthRate,
      exitMultipleValue: projectSettings.exitMultipleValue,
      exitMultipleMetric: projectSettings.exitMultipleMetric,
      depreciationSource: projectSettings.depreciationSource,
      currency: projectSettings.currency,
      cashBalance: projectSettings.cashBalance,
      debtBalance: projectSettings.debtBalance,
      mostRecentFiscalYearEnd: projectSettings.mostRecentFiscalYearEnd,
      fiscalYearEnd: projectSettings.fiscalYearEnd,
      maxProjectionYears: projectSettings.maxProjectionYears,
      valuationDate: projectSettings.valuationDate,
      // Terminal year specific fields (only update if defined)
      terminalNopatMargin: projectSettings.terminalNopatMargin || prevSettings.terminalNopatMargin,
      terminalReinvestmentRate:
        projectSettings.terminalReinvestmentRate || prevSettings.terminalReinvestmentRate,
    }))
  }, [projectSettings])

  // Listen for project updated event (when updated from edit project modal)
  useEffect(() => {
    const handleProjectUpdated = (event: CustomEvent) => {
      const { projectId: updatedProjectId, data } = event.detail

      // Only update if this event is for our current project
      if (projectId && updatedProjectId === projectId) {
        setSettings((prev) => ({
          ...prev,
          maxProjectionYears: data.maxProjectionYears || prev.maxProjectionYears,
          currency: data.currency || prev.currency,
          taxRate: data.taxRate || prev.taxRate,
          valuationDate: data.valuationDate || prev.valuationDate,
        }))

        console.log('Scenario settings updated from project edit:', data)
      }
    }

    window.addEventListener('projectUpdated', handleProjectUpdated as EventListener)

    return () => {
      window.removeEventListener('projectUpdated', handleProjectUpdated as EventListener)
    }
  }, [projectId])

  // Listen for specific setting changes
  useEffect(() => {
    const handleTaxRateChanged = (event: CustomEvent) => {
      setSettings((prev) => ({
        ...prev,
        taxRate: event.detail.value,
      }))
    }

    const handleDiscountRateChanged = (event: CustomEvent) => {
      setSettings((prev) => ({
        ...prev,
        discountRate: event.detail.value,
      }))
    }

    const handleTerminalGrowthRateChanged = (event: CustomEvent) => {
      setSettings((prev) => ({
        ...prev,
        terminalGrowthRate: event.detail.value,
      }))
    }

    const handleDepreciationSourceChanged = (event: CustomEvent) => {
      setSettings((prev) => ({
        ...prev,
        depreciationSource: event.detail.value,
      }))
    }

    const handleValuationDateChanged = (event: CustomEvent) => {
      setSettings((prev) => ({
        ...prev,
        valuationDate: event.detail.value,
      }))
    }

    // Add event listeners
    window.addEventListener('taxRateChanged', handleTaxRateChanged as EventListener)
    window.addEventListener('discountRateChanged', handleDiscountRateChanged as EventListener)
    window.addEventListener(
      'terminalGrowthRateChanged',
      handleTerminalGrowthRateChanged as EventListener
    )
    window.addEventListener(
      'depreciationSourceChanged',
      handleDepreciationSourceChanged as EventListener
    )
    window.addEventListener('valuationDateChanged', handleValuationDateChanged as EventListener)

    // Add listeners for new terminal assumption events
    const handleTerminalAssumptionsChanged = (event: CustomEvent) => {
      const { terminalAssumptions } = event.detail

      if (terminalAssumptions) {
        setSettings((prev) => ({
          ...prev,
          terminalGrowthRate: terminalAssumptions.terminalGrowthRate,
          terminalNopatMargin: terminalAssumptions.terminalNopatMargin,
          terminalReinvestmentRate: terminalAssumptions.terminalReinvestmentRate,
        }))
      }
    }

    // Add event listeners
    window.addEventListener(
      'terminalAssumptionsChanged',
      handleTerminalAssumptionsChanged as EventListener
    )

    // Remove event listeners on cleanup
    return () => {
      window.removeEventListener('taxRateChanged', handleTaxRateChanged as EventListener)
      window.removeEventListener('discountRateChanged', handleDiscountRateChanged as EventListener)
      window.removeEventListener(
        'terminalGrowthRateChanged',
        handleTerminalGrowthRateChanged as EventListener
      )
      window.removeEventListener(
        'depreciationSourceChanged',
        handleDepreciationSourceChanged as EventListener
      )
      window.removeEventListener(
        'terminalAssumptionsChanged',
        handleTerminalAssumptionsChanged as EventListener
      )
      window.removeEventListener(
        'valuationDateChanged',
        handleValuationDateChanged as EventListener
      )
    }
  }, [])

  // Load data from local storage if available
  useEffect(() => {
    if (projectId === 'new') return

    try {
      // Load scenario data from localStorage
      const savedScenario = localStorage.getItem(`scenario_${projectId}`)
      const savedAssumptions = localStorage.getItem(`assumptions_${projectId}`)
      const savedHistoricals = localStorage.getItem(`historicals_${projectId}`)
      const savedSettings = localStorage.getItem(`settings_${projectId}`)

      if (savedScenario) {
        setScenario(JSON.parse(savedScenario))
      }

      if (savedAssumptions) {
        setAssumptions(JSON.parse(savedAssumptions))
      }

      if (savedHistoricals) {
        setHistoricals(JSON.parse(savedHistoricals))
      }

      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings)
        // Merge loaded settings with current project settings for consistency
        setSettings({
          ...parsedSettings,
          discountRate: projectSettings.discountRate || parsedSettings.discountRate,
          taxRate: projectSettings.taxRate || parsedSettings.taxRate,
          terminalGrowthRate:
            projectSettings.terminalGrowthRate || parsedSettings.terminalGrowthRate,
          cashBalance: projectSettings.cashBalance || parsedSettings.cashBalance,
          debtBalance: projectSettings.debtBalance || parsedSettings.debtBalance,
          valuationDate: projectSettings.valuationDate || parsedSettings.valuationDate,
        })
      }

      console.log('Loaded scenario data for project:', projectId)
    } catch (error) {
      console.error('Error loading scenario data:', error)
    }
  }, [projectId, projectSettings])

  // Save data to local storage when it changes
  useEffect(() => {
    if (projectId === 'new') return

    try {
      localStorage.setItem(`scenario_${projectId}`, JSON.stringify(scenario))
      localStorage.setItem(`assumptions_${projectId}`, JSON.stringify(assumptions))
      localStorage.setItem(`historicals_${projectId}`, JSON.stringify(historicals))
      localStorage.setItem(`settings_${projectId}`, JSON.stringify(settings))
    } catch (error) {
      console.error('Error saving scenario data:', error)
    }
  }, [projectId, scenario, assumptions, historicals, settings])

  return {
    scenario,
    setScenario,
    assumptions,
    setAssumptions,
    historicals,
    setHistoricals,
    settings,
    setSettings,
  }
}
