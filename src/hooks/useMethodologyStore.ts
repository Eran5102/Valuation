'use client'

import { useState, useEffect, useCallback } from 'react'

export interface ValuationMethodology {
  id: string
  name: string
  category: 'income' | 'market' | 'asset' | 'allocation'
  enabled: boolean
  weight: number
  implemented: boolean
  route?: string
  description: string
}

// Storage key for localStorage
const STORAGE_KEY = 'valuation_methodologies'

// Global store for methodologies
let globalMethodologies: ValuationMethodology[] = []
let listeners: Set<() => void> = new Set()

// Initialize methodologies from localStorage or defaults
function initializeMethodologies(): ValuationMethodology[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.warn('Failed to load methodologies from localStorage:', error)
  }

  // Return default methodologies if nothing in storage
  return getDefaultMethodologies()
}

// Get default methodologies
function getDefaultMethodologies(): ValuationMethodology[] {
  return [
    // Income Approach
    {
      id: 'dcf',
      name: 'Discounted Cash Flow (DCF)',
      category: 'income',
      enabled: false,
      weight: 0,
      implemented: true,
      route: 'dcf-analysis',
      description: 'Project and discount future cash flows to present value',
    },
    {
      id: 'cap_earnings',
      name: 'Capitalization of Earnings',
      category: 'income',
      enabled: false,
      weight: 0,
      implemented: false,
      description: 'Single-period capitalization of normalized earnings',
    },
    {
      id: 'dividend_discount',
      name: 'Dividend Discount Model',
      category: 'income',
      enabled: false,
      weight: 0,
      implemented: false,
      description: 'Value based on expected future dividends',
    },
    // Market Approach
    {
      id: 'public_comps',
      name: 'Public Comparables (Trading Comps)',
      category: 'market',
      enabled: false,
      weight: 0,
      implemented: true,
      route: 'public-comps',
      description: 'Multiples from guideline public companies',
    },
    {
      id: 'precedent_transactions',
      name: 'Precedent Transactions',
      category: 'market',
      enabled: false,
      weight: 0,
      implemented: true,
      route: 'precedent-transactions',
      description: 'M&A transaction multiples',
    },
    {
      id: 'opm_backsolve',
      name: 'OPM Backsolve',
      category: 'market',
      enabled: false,
      weight: 0,
      implemented: true,
      route: 'opm-backsolve',
      description: 'Implied valuation from recent transaction',
    },
    {
      id: 'private_comps',
      name: 'Private Company Comparables',
      category: 'market',
      enabled: false,
      weight: 0,
      implemented: false,
      description: 'Valuation multiples from similar private companies',
    },
    // Asset Approach
    {
      id: 'adjusted_book',
      name: 'Adjusted Book Value',
      category: 'asset',
      enabled: false,
      weight: 0,
      implemented: false,
      description: 'Net assets adjusted to fair market value',
    },
    {
      id: 'liquidation',
      name: 'Liquidation Value',
      category: 'asset',
      enabled: false,
      weight: 0,
      implemented: false,
      description: 'Net amount from orderly asset liquidation',
    },
    {
      id: 'replacement_cost',
      name: 'Replacement Cost Method',
      category: 'asset',
      enabled: false,
      weight: 0,
      implemented: false,
      description: 'Cost to replicate the business',
    },
    // Allocation Methods
    {
      id: 'opm',
      name: 'Option Pricing Model (OPM)',
      category: 'allocation',
      enabled: false,
      weight: 0,
      implemented: true,
      route: 'allocation/opm',
      description: 'Black-Scholes based allocation',
    },
    {
      id: 'pwerm',
      name: 'Probability-Weighted Expected Return (PWERM)',
      category: 'allocation',
      enabled: false,
      weight: 0,
      implemented: true,
      route: 'allocation/pwerm',
      description: 'Scenario-based value allocation',
    },
    {
      id: 'cvm',
      name: 'Current Value Method (CVM)',
      category: 'allocation',
      enabled: false,
      weight: 0,
      implemented: false,
      description: 'Immediate liquidation assumption',
    },
    {
      id: 'hybrid',
      name: 'Hybrid Method',
      category: 'allocation',
      enabled: false,
      weight: 0,
      implemented: false,
      description: 'Combination of OPM and PWERM',
    },
  ]
}

// Initialize the store
if (typeof window !== 'undefined') {
  globalMethodologies = initializeMethodologies()
}

// Notify all listeners of changes
function notifyListeners() {
  listeners.forEach((listener) => listener())
}

// Save to localStorage and notify listeners
function saveMethodologies(methodologies: ValuationMethodology[]) {
  globalMethodologies = methodologies
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(methodologies))
    } catch (error) {
      console.warn('Failed to save methodologies to localStorage:', error)
    }
  }
  notifyListeners()
}

// Custom hook to use the methodology store
export function useMethodologyStore() {
  const [methodologies, setMethodologies] = useState<ValuationMethodology[]>(() => {
    // Initialize on first render
    if (typeof window !== 'undefined' && globalMethodologies.length === 0) {
      globalMethodologies = initializeMethodologies()
    }
    return [...globalMethodologies]
  })

  useEffect(() => {
    // Subscribe to changes
    const handleChange = () => {
      setMethodologies([...globalMethodologies])
    }

    listeners.add(handleChange)

    return () => {
      listeners.delete(handleChange)
    }
  }, [])

  const updateMethodologies = useCallback((newMethodologies: ValuationMethodology[]) => {
    saveMethodologies(newMethodologies)
  }, [])

  const toggleMethodology = useCallback((methodId: string) => {
    const updated = globalMethodologies.map((m) => {
      if (m.id === methodId) {
        const newEnabled = !m.enabled
        // Set default weight when enabling
        const newWeight = newEnabled ? m.weight || 25 : 0
        return { ...m, enabled: newEnabled, weight: newWeight }
      }
      return m
    })
    saveMethodologies(updated)
  }, [])

  const updateMethodologyWeight = useCallback((methodId: string, weight: number) => {
    const updated = globalMethodologies.map((m) => (m.id === methodId ? { ...m, weight } : m))
    saveMethodologies(updated)
  }, [])

  const resetMethodologies = useCallback(() => {
    saveMethodologies(getDefaultMethodologies())
  }, [])

  const getEnabledMethodologies = useCallback(() => {
    return globalMethodologies.filter((m) => m.enabled)
  }, [])

  return {
    methodologies,
    updateMethodologies,
    toggleMethodology,
    updateMethodologyWeight,
    resetMethodologies,
    getEnabledMethodologies,
  }
}
