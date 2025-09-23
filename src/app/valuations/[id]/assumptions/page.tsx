'use client'

import { useParams } from 'next/navigation'
import ValuationAssumptions from '@/components/valuation/ValuationAssumptions'

export default function AssumptionsPage() {
  const params = useParams()
  const valuationId = params?.id as string

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Valuation Assumptions</h1>
        <p className="mt-1 text-muted-foreground">
          Configure key assumptions for valuation calculations
        </p>
      </div>
      <ValuationAssumptions valuationId={valuationId} />
    </div>
  )
}
