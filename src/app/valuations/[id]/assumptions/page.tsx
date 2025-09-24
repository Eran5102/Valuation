'use client'

import { useParams } from 'next/navigation'
import ValuationAssumptionsConsolidated from '@/components/valuation/ValuationAssumptionsConsolidated'

export default function AssumptionsPage() {
  const params = useParams()
  const valuationId = params?.id as string

  return (
    <div className="h-full p-6">
      <ValuationAssumptionsConsolidated valuationId={valuationId} />
    </div>
  )
}
