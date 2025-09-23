import { useState, useEffect } from 'react'

export type DepreciationMethod = 'percent_net' | 'percent_gross' | 'straight_line'

export interface DepreciationCapexData {
  depreciationMethod: DepreciationMethod
  depreciationRate?: number
  usefulLife?: number
  openingGrossPPE: number
  openingAccumulatedDepreciation: number
  importedFromCompanyData: boolean
  lastModified?: string
  schedule: {
    openingGrossPPE: number[]
    openingAccumulatedDepreciation: number[]
    openingNetPPE: number[]
    projectedCapex: number[]
    averageGrossPPE?: number[]
    depreciation: number[]
    closingGrossPPE: number[]
    closingAccumulatedDepreciation: number[]
    closingNetPPE: number[]
  }
  depreciationSchedule?: Array<{
    assetCategory: string
    initialValue: number
    usefulLife: number
    salvageValue: number
    depreciationMethod?: string
  }>
  capexSchedule?: Array<{
    description: string
    amount: number
    year: number
    assetCategory: string
    usefulLife: number
    depreciationMethod?: string
  }>
}

// Helper function to create empty depreciation and capex data
export const createEmptyDepreciationCapexData = (): DepreciationCapexData => ({
  depreciationMethod: 'straight_line',
  openingGrossPPE: 0,
  openingAccumulatedDepreciation: 0,
  importedFromCompanyData: false,
  depreciationSchedule: [],
  capexSchedule: [],
  schedule: {
    openingGrossPPE: [],
    openingAccumulatedDepreciation: [],
    openingNetPPE: [],
    projectedCapex: [],
    averageGrossPPE: [],
    depreciation: [],
    closingGrossPPE: [],
    closingAccumulatedDepreciation: [],
    closingNetPPE: [],
  },
})

// Helper function to save depreciation and capex data to localStorage
export const saveDepreciationCapexDataToStorage = (
  data: DepreciationCapexData
): DepreciationCapexData => {
  const timestamp = new Date().toISOString()
  const updatedData = {
    ...data,
    lastModified: timestamp,
  }

  localStorage.setItem('depreciationCapexSchedule', JSON.stringify(updatedData))

  // Dispatch a custom event to notify other components
  window.dispatchEvent(
    new CustomEvent('depreciationCapexDataUpdated', {
      detail: { timestamp },
    })
  )

  return updatedData
}

// Helper function to load depreciation and capex data from localStorage
export const loadDepreciationCapexDataFromStorage = (): DepreciationCapexData | null => {
  const savedSchedule = localStorage.getItem('depreciationCapexSchedule')
  if (savedSchedule) {
    try {
      const parsedSchedule = JSON.parse(savedSchedule)
      console.log(
        `[${new Date().toISOString()}] Loaded depreciation & capex schedule:`,
        parsedSchedule
      )
      return parsedSchedule
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] Error parsing depreciation & capex schedule:`,
        error
      )
      return null
    }
  }
  return null
}

export function useDepreciationCapexData(forecastPeriod: number = 5) {
  const [depreciationCapexData, setDepreciationCapexData] = useState<DepreciationCapexData | null>(
    null
  )
  const [hasDepreciationCapexData, setHasDepreciationCapexData] = useState(false)
  const [cacheKey, setCacheKey] = useState(Date.now())

  const loadFromLocalStorage = () => {
    const loadedData = loadDepreciationCapexDataFromStorage()
    if (loadedData) {
      setDepreciationCapexData(loadedData)
      setHasDepreciationCapexData(true)

      // Dispatch an event to notify components that depend on this data
      window.dispatchEvent(new CustomEvent('depreciationCapexDataUpdated'))
    } else {
      setHasDepreciationCapexData(false)
      // Initialize with empty data instead of null
      setDepreciationCapexData(createEmptyDepreciationCapexData())
    }
  }

  // Load data initially and when forecast period changes
  useEffect(() => {
    loadFromLocalStorage()
    // Set up a storage event listener to keep data in sync across tabs
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'depreciationCapexSchedule') {
        loadFromLocalStorage()
        setCacheKey(Date.now()) // Update cache key to force rerender
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [forecastPeriod, cacheKey])

  const saveDepreciationCapexData = (data: DepreciationCapexData) => {
    const updatedData = saveDepreciationCapexDataToStorage(data)
    setDepreciationCapexData(updatedData)
    setHasDepreciationCapexData(true)
    setCacheKey(Date.now()) // Update cache key to force rerender
  }

  // Return actual schedule arrays or empty arrays if they don't exist
  const depreciationSchedule = depreciationCapexData?.depreciationSchedule || []
  const capexSchedule = depreciationCapexData?.capexSchedule || []

  // Generic function to update an item in an array
  const updateItemInArray = <T extends unknown>(array: T[], index: number, updatedItem: T): T[] => {
    const newArray = [...array]
    newArray[index] = updatedItem
    return newArray
  }

  // Generic function to add an item to an array
  const addItemToArray = <T extends unknown>(array: T[], newItem: T): T[] => {
    return [...array, newItem]
  }

  // Generic function to remove an item from an array
  const removeItemFromArray = <T extends unknown>(array: T[], index: number): T[] => {
    const newArray = [...array]
    newArray.splice(index, 1)
    return newArray
  }

  // Add missing functions using the generic helper functions
  const updateDepreciationLine = (index: number, updatedLine: any) => {
    if (!depreciationCapexData) return

    saveDepreciationCapexData({
      ...depreciationCapexData,
      depreciationSchedule: updateItemInArray(depreciationSchedule, index, updatedLine),
    })
  }

  const updateCapexLine = (index: number, updatedLine: any) => {
    if (!depreciationCapexData) return

    saveDepreciationCapexData({
      ...depreciationCapexData,
      capexSchedule: updateItemInArray(capexSchedule, index, updatedLine),
    })
  }

  const addDepreciationLine = (newLine: any) => {
    if (!depreciationCapexData) return

    saveDepreciationCapexData({
      ...depreciationCapexData,
      depreciationSchedule: addItemToArray(depreciationSchedule, newLine),
    })
  }

  const addCapexLine = (newLine: any) => {
    if (!depreciationCapexData) return

    saveDepreciationCapexData({
      ...depreciationCapexData,
      capexSchedule: addItemToArray(capexSchedule, newLine),
    })
  }

  const removeDepreciationLine = (index: number) => {
    if (!depreciationCapexData) return

    saveDepreciationCapexData({
      ...depreciationCapexData,
      depreciationSchedule: removeItemFromArray(depreciationSchedule, index),
    })
  }

  const removeCapexLine = (index: number) => {
    if (!depreciationCapexData) return

    saveDepreciationCapexData({
      ...depreciationCapexData,
      capexSchedule: removeItemFromArray(capexSchedule, index),
    })
  }

  const calculateTotals = () => {
    if (!depreciationCapexData) {
      return {
        totalCurrentPPE: 0,
        totalAccumulatedDepreciation: 0,
        totalPlannedCapex: 0,
      }
    }

    const totalCurrentPPE = depreciationCapexData.openingGrossPPE || 0
    const totalAccumulatedDepreciation = depreciationCapexData.openingAccumulatedDepreciation || 0
    const totalPlannedCapex = capexSchedule.reduce((sum, item) => sum + (item.amount || 0), 0)

    return {
      totalCurrentPPE,
      totalAccumulatedDepreciation,
      totalPlannedCapex,
    }
  }

  return {
    depreciationCapexData: depreciationCapexData || createEmptyDepreciationCapexData(),
    hasDepreciationCapexData,
    saveDepreciationCapexData,
    loadFromLocalStorage,
    depreciationSchedule,
    capexSchedule,
    updateDepreciationLine,
    updateCapexLine,
    addDepreciationLine,
    addCapexLine,
    removeDepreciationLine,
    removeCapexLine,
    calculateTotals,
  }
}
