'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import {
  DCFModelData,
  DCFCoreAssumptions,
  DebtScheduleData,
  WorkingCapitalData,
  CapexDepreciationData,
  WACCData,
  FinancialStatementData,
  DCFValuationResult,
  DCFModelUpdateEvent,
  CalculationMethodOptions,
} from '@/types/dcf'
import { toast } from 'sonner'

interface DCFModelContextType {
  // Core Data
  modelData: DCFModelData | null
  assumptions: DCFCoreAssumptions | null

  // Component Data
  debtSchedule: DebtScheduleData | null
  workingCapital: WorkingCapitalData | null
  capexDepreciation: CapexDepreciationData | null
  wacc: WACCData | null
  financialStatements: FinancialStatementData[] | null
  dcfValuation: DCFValuationResult | null

  // State Management
  isLoading: boolean
  isSaving: boolean
  hasChanges: boolean
  errors: string[]
  warnings: string[]

  // Actions
  loadModel: (valuationId: string) => Promise<void>
  saveModel: () => Promise<void>
  updateAssumptions: (assumptions: Partial<DCFCoreAssumptions>) => void
  updateDebtSchedule: (data: DebtScheduleData) => void
  updateWorkingCapital: (data: WorkingCapitalData) => void
  updateCapexDepreciation: (data: CapexDepreciationData) => void
  updateWACC: (data: WACCData) => void

  // Calculation Methods
  setCalculationMethod: (component: string, options: CalculationMethodOptions) => void
  recalculateAll: () => Promise<void>
  recalculateComponent: (component: string) => Promise<void>

  // Utilities
  exportModel: () => void
  importModel: (data: DCFModelData) => void
  resetToDefaults: () => void

  // Real-time Updates
  subscribeToUpdates: (callback: (event: DCFModelUpdateEvent) => void) => () => void
}

const DCFModelContext = createContext<DCFModelContextType | undefined>(undefined)

export function useDCFModel() {
  const context = useContext(DCFModelContext)
  if (!context) {
    throw new Error('useDCFModel must be used within DCFModelProvider')
  }
  return context
}

interface DCFModelProviderProps {
  children: React.ReactNode
  valuationId: string
}

export function DCFModelProvider({ children, valuationId }: DCFModelProviderProps) {
  const [modelData, setModelData] = useState<DCFModelData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [warnings, setWarnings] = useState<string[]>([])

  // Event subscribers
  const updateSubscribers = useRef<Set<(event: DCFModelUpdateEvent) => void>>(new Set())

  // Auto-save timer
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Emit update event to all subscribers
  const emitUpdate = useCallback((event: DCFModelUpdateEvent) => {
    updateSubscribers.current.forEach((callback) => callback(event))
  }, [])

  // Load the complete DCF model
  const loadModel = useCallback(
    async (valId: string) => {
      setIsLoading(true)
      setErrors([])

      try {
        const response = await fetch(`/api/valuations/${valId}/dcf-model`)
        if (!response.ok) {
          throw new Error('Failed to load DCF model')
        }

        const data = await response.json()
        setModelData(data)

        emitUpdate({
          type: 'calculation_complete',
          source: 'manual',
          data,
          timestamp: new Date().toISOString(),
        })
      } catch (error) {
        console.error('Error loading DCF model:', error)
        setErrors(['Failed to load DCF model'])
        toast.error('Failed to load DCF model')
      } finally {
        setIsLoading(false)
      }
    },
    [emitUpdate]
  )

  // Save the model
  const saveModel = useCallback(async () => {
    if (!modelData || isSaving) return

    setIsSaving(true)

    try {
      const response = await fetch(`/api/valuations/${valuationId}/dcf-model`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modelData),
      })

      if (!response.ok) {
        throw new Error('Failed to save DCF model')
      }

      setHasChanges(false)
      toast.success('DCF model saved')
    } catch (error) {
      console.error('Error saving DCF model:', error)
      setErrors(['Failed to save DCF model'])
      toast.error('Failed to save DCF model')
    } finally {
      setIsSaving(false)
    }
  }, [modelData, valuationId, isSaving])

  // Auto-save on changes
  const scheduleAutoSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }

    saveTimerRef.current = setTimeout(() => {
      if (hasChanges && !isSaving) {
        saveModel()
      }
    }, 3000) // Auto-save after 3 seconds of inactivity
  }, [hasChanges, isSaving, saveModel])

  // Update assumptions
  const updateAssumptions = useCallback(
    (newAssumptions: Partial<DCFCoreAssumptions>) => {
      setModelData((prev) => {
        if (!prev) return null

        const updated = {
          ...prev,
          assumptions: {
            ...prev.assumptions,
            ...newAssumptions,
          },
          lastUpdated: new Date().toISOString(),
          version: prev.version + 1,
        }

        // Recalculate tax rate if needed
        if (newAssumptions.corporateTaxRate || newAssumptions.stateTaxRate) {
          const federal = newAssumptions.corporateTaxRate || prev.assumptions.corporateTaxRate
          const state = newAssumptions.stateTaxRate || prev.assumptions.stateTaxRate
          updated.assumptions.effectiveTaxRate = federal + state * (1 - federal / 100)
        }

        return updated
      })

      setHasChanges(true)
      scheduleAutoSave()

      emitUpdate({
        type: 'assumption_changed',
        source: 'assumptions',
        data: newAssumptions,
        timestamp: new Date().toISOString(),
      })
    },
    [emitUpdate, scheduleAutoSave]
  )

  // Update debt schedule
  const updateDebtSchedule = useCallback(
    (data: DebtScheduleData) => {
      setModelData((prev) => {
        if (!prev) return null

        return {
          ...prev,
          debtSchedule: data,
          lastUpdated: new Date().toISOString(),
          version: prev.version + 1,
        }
      })

      setHasChanges(true)
      scheduleAutoSave()

      emitUpdate({
        type: 'schedule_updated',
        source: 'debt',
        data,
        timestamp: new Date().toISOString(),
      })
    },
    [emitUpdate, scheduleAutoSave]
  )

  // Update working capital
  const updateWorkingCapital = useCallback(
    (data: WorkingCapitalData) => {
      setModelData((prev) => {
        if (!prev) return null

        return {
          ...prev,
          workingCapital: data,
          lastUpdated: new Date().toISOString(),
          version: prev.version + 1,
        }
      })

      setHasChanges(true)
      scheduleAutoSave()

      emitUpdate({
        type: 'schedule_updated',
        source: 'working_capital',
        data,
        timestamp: new Date().toISOString(),
      })
    },
    [emitUpdate, scheduleAutoSave]
  )

  // Update capex/depreciation
  const updateCapexDepreciation = useCallback(
    (data: CapexDepreciationData) => {
      setModelData((prev) => {
        if (!prev) return null

        return {
          ...prev,
          capexDepreciation: data,
          lastUpdated: new Date().toISOString(),
          version: prev.version + 1,
        }
      })

      setHasChanges(true)
      scheduleAutoSave()

      emitUpdate({
        type: 'schedule_updated',
        source: 'capex',
        data,
        timestamp: new Date().toISOString(),
      })
    },
    [emitUpdate, scheduleAutoSave]
  )

  // Update WACC
  const updateWACC = useCallback(
    (data: WACCData) => {
      setModelData((prev) => {
        if (!prev) return null

        return {
          ...prev,
          wacc: data,
          // Update discount rate in assumptions if WACC is calculated
          assumptions: {
            ...prev.assumptions,
            discountRate: data.calculatedWACC || prev.assumptions.discountRate,
          },
          lastUpdated: new Date().toISOString(),
          version: prev.version + 1,
        }
      })

      setHasChanges(true)
      scheduleAutoSave()

      emitUpdate({
        type: 'schedule_updated',
        source: 'wacc',
        data,
        timestamp: new Date().toISOString(),
      })
    },
    [emitUpdate, scheduleAutoSave]
  )

  // Set calculation method for a component
  const setCalculationMethod = useCallback(
    (component: string, options: CalculationMethodOptions) => {
      setModelData((prev) => {
        if (!prev) return null

        const updated = { ...prev }

        // Update the appropriate calculation method in assumptions
        if (component === 'depreciation' && options.depreciation) {
          updated.assumptions.depreciationMethod = options.depreciation.method
          if (options.depreciation.percentageValue !== undefined) {
            updated.assumptions.depreciationPercent = options.depreciation.percentageValue
          }
        } else if (component === 'workingCapital' && options.workingCapital) {
          updated.assumptions.workingCapitalMethod = options.workingCapital.method
          if (options.workingCapital.percentageValue !== undefined) {
            updated.assumptions.workingCapitalPercent = options.workingCapital.percentageValue
          }
        } else if (component === 'capex' && options.capex) {
          updated.assumptions.capexMethod = options.capex.method
          if (options.capex.percentageValue !== undefined) {
            updated.assumptions.capexPercent = options.capex.percentageValue
          }
        } else if (component === 'interest' && options.interest) {
          updated.assumptions.interestMethod = options.interest.method
        }

        updated.lastUpdated = new Date().toISOString()
        updated.version = prev.version + 1

        return updated
      })

      setHasChanges(true)
      scheduleAutoSave()
    },
    [scheduleAutoSave]
  )

  // Recalculate all components
  const recalculateAll = useCallback(async () => {
    if (!modelData) return

    try {
      const response = await fetch(`/api/valuations/${valuationId}/dcf-model/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assumptions: modelData.assumptions,
          debtSchedule: modelData.debtSchedule,
          workingCapital: modelData.workingCapital,
          capexDepreciation: modelData.capexDepreciation,
          wacc: modelData.wacc,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to recalculate DCF model')
      }

      const result = await response.json()
      setModelData(result.data)

      emitUpdate({
        type: 'calculation_complete',
        source: 'manual',
        data: result.data,
        timestamp: new Date().toISOString(),
      })

      toast.success('DCF model recalculated')
    } catch (error) {
      console.error('Error recalculating DCF model:', error)
      setErrors(['Failed to recalculate DCF model'])
      toast.error('Failed to recalculate DCF model')
    }
  }, [modelData, valuationId, emitUpdate])

  // Recalculate a specific component
  const recalculateComponent = useCallback(
    async (component: string) => {
      // This would trigger recalculation of just one component
      // Implementation depends on backend API structure
      await recalculateAll() // For now, recalculate everything
    },
    [recalculateAll]
  )

  // Export model to JSON
  const exportModel = useCallback(() => {
    if (!modelData) return

    const blob = new Blob([JSON.stringify(modelData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dcf-model-${valuationId}-${new Date().toISOString()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [modelData, valuationId])

  // Import model from JSON
  const importModel = useCallback((data: DCFModelData) => {
    setModelData({
      ...data,
      lastUpdated: new Date().toISOString(),
      version: (data.version || 0) + 1,
    })
    setHasChanges(true)
    toast.success('DCF model imported')
  }, [])

  // Reset to default values
  const resetToDefaults = useCallback(() => {
    loadModel(valuationId)
    toast.info('Reset to default values')
  }, [loadModel, valuationId])

  // Subscribe to updates
  const subscribeToUpdates = useCallback((callback: (event: DCFModelUpdateEvent) => void) => {
    updateSubscribers.current.add(callback)

    return () => {
      updateSubscribers.current.delete(callback)
    }
  }, [])

  // Load model on mount
  useEffect(() => {
    loadModel(valuationId)

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [valuationId, loadModel])

  const contextValue: DCFModelContextType = {
    // Core Data
    modelData,
    assumptions: modelData?.assumptions || null,

    // Component Data
    debtSchedule: modelData?.debtSchedule || null,
    workingCapital: modelData?.workingCapital || null,
    capexDepreciation: modelData?.capexDepreciation || null,
    wacc: modelData?.wacc || null,
    financialStatements: modelData?.financialStatements || null,
    dcfValuation: modelData?.dcfValuation || null,

    // State Management
    isLoading,
    isSaving,
    hasChanges,
    errors,
    warnings,

    // Actions
    loadModel,
    saveModel,
    updateAssumptions,
    updateDebtSchedule,
    updateWorkingCapital,
    updateCapexDepreciation,
    updateWACC,

    // Calculation Methods
    setCalculationMethod,
    recalculateAll,
    recalculateComponent,

    // Utilities
    exportModel,
    importModel,
    resetToDefaults,

    // Real-time Updates
    subscribeToUpdates,
  }

  return <DCFModelContext.Provider value={contextValue}>{children}</DCFModelContext.Provider>
}
