'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { OPMMainPanel } from '@/components/valuation/opm/OPMMainPanel'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calculator } from 'lucide-react'

export default function OPMBacksolvePage() {
  const params = useParams()
  const valuationId = params?.id as string
  const [assumptions, setAssumptions] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAssumptions() {
      try {
        const response = await fetch(`/api/valuations/${valuationId}`)
        if (response.ok) {
          const data = await response.json()
          setAssumptions(data.assumptions)
        }
      } catch (error) {
        console.error('Failed to fetch assumptions:', error)
      } finally {
        setLoading(false)
      }
    }

    if (valuationId) {
      fetchAssumptions()
    }
  }, [valuationId])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center p-6">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-6 w-6" />
            OPM Backsolve - Option Pricing Model
          </CardTitle>
          <CardDescription>
            Calculate enterprise value using Black-Scholes option pricing methodology with single
            scenario or hybrid PWERM analysis
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Main OPM Panel with Single/Hybrid Tabs */}
      <OPMMainPanel valuationId={valuationId} assumptions={assumptions} />
    </div>
  )
}
