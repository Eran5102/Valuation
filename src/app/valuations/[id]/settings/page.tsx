'use client'

import { useParams } from 'next/navigation'
import ValuationAssumptions from '@/components/valuation/ValuationAssumptions'

export default function SettingsPage() {
  const params = useParams()
  const valuationId = params?.id as string

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Valuation Settings</h1>
        <p className="mt-1 text-muted-foreground">Configure valuation parameters and assumptions</p>
      </div>
      <ValuationAssumptions valuationId={valuationId} />
    </div>
  )
}
