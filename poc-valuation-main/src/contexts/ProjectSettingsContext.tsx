import React, { createContext, useContext, useState, useEffect } from 'react'

export interface ProjectSettings {
  // Core financial parameters
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD'
  taxRate: number
  discountingConvention: 'Mid-Year' | 'End-Year'
  mostRecentFiscalYearEnd: string
  fiscalYearEnd: string
  maxProjectionYears: number
  cashBalance: number
  debtBalance: number
  valuationDate: string
  historicalYears: number
  forecastPeriod: number
  discountRate: number
  terminalGrowthRate: number
  terminalValueMethod: string
  exitMultipleMetric: string
  exitMultipleValue: number
  depreciationSource: 'scenario' | 'schedule'

  // Terminal year assumptions for PGM
  terminalNopatMargin?: number
  terminalReinvestmentRate?: number

  // Project metadata (new fields)
  projectName?: string
  projectDescription?: string
  clientName?: string
  industry?: string
  projectType?: string
  tags?: string[]

  // Visualization preferences
  chartColorTheme?: string
  defaultChartType?: string
  showWaterfall?: boolean
  showTornado?: boolean
  showComparison?: boolean
}

const defaultSettings: ProjectSettings = {
  currency: 'USD',
  taxRate: 0.25,
  discountingConvention: 'Mid-Year',
  mostRecentFiscalYearEnd: '2024-12-31',
  fiscalYearEnd: '12-31',
  maxProjectionYears: 10,
  cashBalance: 5000000,
  debtBalance: 10000000,
  valuationDate: '2025-01-01',
  historicalYears: 3,
  forecastPeriod: 5,
  discountRate: 10,
  terminalGrowthRate: 2,
  terminalValueMethod: 'PGM',
  exitMultipleMetric: 'EBITDA',
  exitMultipleValue: 8,
  depreciationSource: 'scenario',

  // Default terminal year assumptions
  terminalNopatMargin: 15,
  terminalReinvestmentRate: 40,

  // Default project metadata
  projectName: 'New Valuation Project',
  projectDescription: '',
  clientName: '',
  industry: '',
  projectType: 'Valuation',
  tags: [],

  // Default visualization preferences
  chartColorTheme: 'default',
  defaultChartType: 'bar',
  showWaterfall: true,
  showTornado: true,
  showComparison: true,
}

const STORAGE_KEY = 'project_settings'

interface ProjectSettingsContextType {
  settings: ProjectSettings
  updateSettings: (settings: Partial<ProjectSettings>) => void
}

const ProjectSettingsContext = createContext<ProjectSettingsContextType>({
  settings: defaultSettings,
  updateSettings: () => {},
})

export const ProjectSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state from localStorage if available
  const [settings, setSettings] = useState<ProjectSettings>(() => {
    const savedSettings = localStorage.getItem(STORAGE_KEY)
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings
  })

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))

    // Dispatch an event when settings are updated
    window.dispatchEvent(
      new CustomEvent('projectSettingsUpdated', {
        detail: { settings },
      })
    )
  }, [settings])

  const updateSettings = (newSettings: Partial<ProjectSettings>) => {
    setSettings((prevSettings) => {
      const updatedSettings = { ...prevSettings, ...newSettings }

      // Dispatch specific events for certain settings changes
      if (
        newSettings.depreciationSource &&
        newSettings.depreciationSource !== prevSettings.depreciationSource
      ) {
        window.dispatchEvent(
          new CustomEvent('depreciationSourceChanged', {
            detail: { value: newSettings.depreciationSource },
          })
        )
      }

      if (newSettings.taxRate && newSettings.taxRate !== prevSettings.taxRate) {
        window.dispatchEvent(
          new CustomEvent('taxRateChanged', {
            detail: { value: newSettings.taxRate, type: 'taxRate' },
          })
        )
      }

      if (newSettings.discountRate && newSettings.discountRate !== prevSettings.discountRate) {
        window.dispatchEvent(
          new CustomEvent('discountRateChanged', {
            detail: { value: newSettings.discountRate },
          })
        )
      }

      if (
        newSettings.terminalGrowthRate &&
        newSettings.terminalGrowthRate !== prevSettings.terminalGrowthRate
      ) {
        window.dispatchEvent(
          new CustomEvent('terminalGrowthRateChanged', {
            detail: { value: newSettings.terminalGrowthRate },
          })
        )
      }

      if (newSettings.valuationDate && newSettings.valuationDate !== prevSettings.valuationDate) {
        window.dispatchEvent(
          new CustomEvent('valuationDateChanged', {
            detail: { value: newSettings.valuationDate },
          })
        )
      }

      // New events for project metadata changes
      if (newSettings.projectName && newSettings.projectName !== prevSettings.projectName) {
        window.dispatchEvent(
          new CustomEvent('projectNameChanged', {
            detail: { value: newSettings.projectName },
          })
        )
      }

      return updatedSettings
    })
  }

  return (
    <ProjectSettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </ProjectSettingsContext.Provider>
  )
}

export const useProjectSettings = () => useContext(ProjectSettingsContext)
