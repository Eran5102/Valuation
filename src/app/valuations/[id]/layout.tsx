'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import ValuationWorkspaceLayout from '@/components/valuation/ValuationWorkspaceLayout'
import { ValuationWorkspaceProvider } from '@/contexts/ValuationWorkspaceContext'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function ValuationLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const valuationId = params?.id as string
  const [valuationData, setValuationData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchValuation = async () => {
      try {
        const response = await fetch(`/api/valuations/${valuationId}`)
        if (response.ok) {
          const data = await response.json()

          // Fetch company name if needed
          const companyId = data.company_id || data.companyId
          if (companyId) {
            const companyResponse = await fetch(`/api/companies/${companyId}`)
            if (companyResponse.ok) {
              const companyData = await companyResponse.json()
              data.company_name = companyData.name
            }
          }

          // Normalize data structure - ensure type is always set
          const normalizedType = data.valuation_type || data.type || '409a'
          setValuationData({
            id: valuationId,
            company_name: data.company_name || data.client_name || 'Unknown Company',
            valuation_date: data.valuation_date || data.valuationDate || new Date().toISOString(),
            type: normalizedType,
            status: data.status || 'draft',
            fair_market_value: data.fair_market_value,
            selected_methodologies: data.selected_methodologies || {},
          })
        }
      } catch (error) {
        console.error('Error fetching valuation:', error)
        // Set default data if fetch fails
        setValuationData({
          id: valuationId,
          company_name: 'Loading...',
          valuation_date: new Date().toISOString(),
          type: '409a',
          status: 'draft',
          fair_market_value: undefined,
          selected_methodologies: {},
        })
      } finally {
        setLoading(false)
      }
    }

    if (valuationId) {
      fetchValuation()
    }
  }, [valuationId])

  if (loading || !valuationData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" label="Loading valuation workspace..." />
      </div>
    )
  }

  return (
    <ValuationWorkspaceProvider>
      <ValuationWorkspaceLayout valuationId={valuationId} valuationData={valuationData}>
        {children}
      </ValuationWorkspaceLayout>
    </ValuationWorkspaceProvider>
  )
}
