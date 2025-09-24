'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { DCFModelProvider } from '@/contexts/DCFModelOptimized'
import { Skeleton } from '@/components/ui/skeleton'

const CapexDepreciationClient = dynamic(
  () => import('./client').then((mod) => ({ default: mod.CapexDepreciationClient })),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[600px] w-full" />,
  }
)

interface CapexDepreciationWrapperProps {
  valuationId: string
}

export function CapexDepreciationWrapper({ valuationId }: CapexDepreciationWrapperProps) {
  return (
    <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
      <DCFModelProvider valuationId={valuationId}>
        <CapexDepreciationClient valuationId={valuationId} />
      </DCFModelProvider>
    </Suspense>
  )
}
