'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { OPMMainPanel } from '@/components/valuation/opm/OPMMainPanel'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calculator } from 'lucide-react'
import { getOPMAssumptions } from '../../allocation/opm/actions'

export default function OPMBacksolvePage() {
  const params = useParams()
  const valuationId = params?.id as string
  const [assumptions, setAssumptions] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAssumptions() {
      try {
        const result = await getOPMAssumptions(valuationId)
        if (result.success) {
          console.log('[OPMBacksolvePage] Loaded assumptions from:', result.source)
          console.log('[OPMBacksolvePage] Assumptions data:', result.data)
          setAssumptions(result.data)
        } else {
          console.error('[OPMBacksolvePage] Failed to load assumptions:', result.error)
        }
      } catch (error) {
        console.error('[OPMBacksolvePage] Exception fetching assumptions:', error)
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
