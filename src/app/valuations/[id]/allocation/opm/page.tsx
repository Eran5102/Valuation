'use client'

import { useParams } from 'next/navigation'
import OPMBacksolve from '@/components/valuation/OPMBacksolve'

export default function OPMPage() {
  const params = useParams()
  const valuationId = params?.id as string

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Option Pricing Model (OPM)</h1>
        <p className="mt-1 text-muted-foreground">
          Allocate enterprise value using Black-Scholes option pricing
        </p>
      </div>
      <OPMBacksolve valuationId={valuationId} />
    </div>
  )
}
