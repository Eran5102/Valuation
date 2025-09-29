'use client'

import { useParams } from 'next/navigation'
import { UnifiedCapTable } from '@/components/valuation/UnifiedCapTable'

export default function CapTablePage() {
  const params = useParams()
  const valuationId = params?.id as string

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Capitalization Table</h1>
        <p className="mt-1 text-muted-foreground">
          Manage share classes, options, and ownership structure
        </p>
      </div>
      <UnifiedCapTable valuationId={valuationId} />
    </div>
  )
}
