'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { DCFModelProvider } from '@/contexts/DCFModelOptimized'
import { Skeleton } from '@/components/ui/skeleton'

const WorkingCapitalClient = dynamic(
  () => import('./client').then((mod) => ({ default: mod.WorkingCapitalClient })),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[600px] w-full" />,
  }
)

interface WorkingCapitalWrapperProps {
  valuationId: string
}

export function WorkingCapitalWrapper({ valuationId }: WorkingCapitalWrapperProps) {
  return (
    <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
      <DCFModelProvider valuationId={valuationId}>
        <WorkingCapitalClient valuationId={valuationId} />
      </DCFModelProvider>
    </Suspense>
  )
}
