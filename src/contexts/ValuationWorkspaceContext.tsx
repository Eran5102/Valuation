'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

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

export interface ValuationMethodologies {
  enterprise: {
    market: boolean
    income: boolean
    asset: boolean
  }
  allocation: {
    method: 'opm' | 'pwerm' | 'cvm' | 'hybrid' | null
    hybridComponents?: ('opm' | 'pwerm')[]
  }
  discounts: {
    dlom: boolean
    minority: boolean
  }
  // New: Selected methodologies with weights
  selectedMethodologies?: ValuationMethodology[]
}

export interface ValuationData {
  id: string
  company_id: string
  company_name: string
  valuation_date: string
  type: '409a' | 'purchase_price' | 'tender_offer' | 'ma' | 'litigation'
  status: 'draft' | 'in_progress' | 'review' | 'completed'
  fair_market_value?: number
  common_share_price?: number
  preferred_share_price?: number
  methodologies?: ValuationMethodologies
  assumptions?: Record<string, any>
  created_at: string
  updated_at: string
}

interface ValuationWorkspaceContextType {
  valuation: ValuationData | null
  loading: boolean
  error: string | null
  refreshValuation: () => Promise<void>
  updateMethodologies: (
    methodologies: ValuationMethodology[] | Partial<ValuationMethodologies>
  ) => Promise<void>
  updateAssumptions: (assumptions: Record<string, any>) => Promise<void>
  updateStatus: (status: ValuationData['status']) => Promise<void>
  calculateFairMarketValue: () => Promise<void>
}

const ValuationWorkspaceContext = createContext<ValuationWorkspaceContextType | undefined>(
  undefined
)

export function ValuationWorkspaceProvider({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const valuationId = params?.id as string
  const [valuation, setValuation] = useState<ValuationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (valuationId) {
      fetchValuation()
    }
  }, [valuationId])

  const fetchValuation = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/valuations/${valuationId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch valuation')
      }
      const data = await response.json()
      // Ensure type field is set, default to '409a'
      setValuation({
        ...data,
        type: data.type || data.valuation_type || '409a',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const updateMethodologies = async (
    methodologies: ValuationMethodology[] | Partial<ValuationMethodologies>
  ) => {
    if (!valuation) return

    try {
      let updatedMethodologies: ValuationMethodologies

      // Check if it's an array of methodologies or partial object
      if (Array.isArray(methodologies)) {
        // It's the new methodology selector format
        updatedMethodologies = {
          ...valuation.methodologies,
          selectedMethodologies: methodologies,
        }
      } else {
        // It's the old partial update format
        updatedMethodologies = {
          ...valuation.methodologies,
          ...methodologies,
        }
      }

      const response = await fetch(`/api/valuations/${valuationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ methodologies: updatedMethodologies }),
      })

      if (!response.ok) {
        throw new Error('Failed to update methodologies')
      }

      const updatedValuation = await response.json()
      setValuation(updatedValuation)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update methodologies')
    }
  }

  const updateAssumptions = async (assumptions: Record<string, any>) => {
    if (!valuation) return

    try {
      const updatedAssumptions = {
        ...valuation.assumptions,
        ...assumptions,
      }

      const response = await fetch(`/api/valuations/${valuationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assumptions: updatedAssumptions }),
      })

      if (!response.ok) {
        throw new Error('Failed to update assumptions')
      }

      const updatedValuation = await response.json()
      setValuation(updatedValuation)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update assumptions')
    }
  }

  const updateStatus = async (status: ValuationData['status']) => {
    if (!valuation) return

    try {
      const response = await fetch(`/api/valuations/${valuationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      const updatedValuation = await response.json()
      setValuation(updatedValuation)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
    }
  }

  const calculateFairMarketValue = async () => {
    if (!valuation) return

    try {
      const response = await fetch(`/api/valuations/${valuationId}/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error('Failed to calculate fair market value')
      }

      const updatedValuation = await response.json()
      setValuation(updatedValuation)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate value')
    }
  }

  return (
    <ValuationWorkspaceContext.Provider
      value={{
        valuation,
        loading,
        error,
        refreshValuation: fetchValuation,
        updateMethodologies,
        updateAssumptions,
        updateStatus,
        calculateFairMarketValue,
      }}
    >
      {children}
    </ValuationWorkspaceContext.Provider>
  )
}

export function useValuationWorkspace() {
  const context = useContext(ValuationWorkspaceContext)
  if (context === undefined) {
    throw new Error('useValuationWorkspace must be used within a ValuationWorkspaceProvider')
  }
  return context
}
