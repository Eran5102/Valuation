'use client'

import { useParams } from 'next/navigation'
import BreakpointsAnalysis from '@/components/valuation/BreakpointsAnalysis'

export default function PWERMPage() {
  const params = useParams()
  const valuationId = params?.id as string

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Probability-Weighted Expected Return Method (PWERM)</h1>
        <p className="mt-1 text-muted-foreground">
          Allocate value based on probability-weighted exit scenarios
        </p>
      </div>
      <BreakpointsAnalysis valuationId={valuationId} />
    </div>
  )
}
