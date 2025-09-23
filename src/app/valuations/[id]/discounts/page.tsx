'use client'

import { useParams } from 'next/navigation'
import DLOMModels from '@/components/valuation/DLOMModels'

export default function DiscountsPage() {
  const params = useParams()
  const valuationId = params?.id as string

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Valuation Discounts</h1>
        <p className="mt-1 text-muted-foreground">
          Apply marketability and minority interest discounts
        </p>
      </div>
      <DLOMModels valuationId={valuationId} />
    </div>
  )
}
