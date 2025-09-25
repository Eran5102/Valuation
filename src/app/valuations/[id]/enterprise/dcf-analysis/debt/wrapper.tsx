'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

const DebtScheduleClient = dynamic(
  () => import('./client').then((mod) => ({ default: mod.DebtScheduleClient })),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[600px] w-full" />,
  }
)

interface DebtScheduleWrapperProps {
  valuationId: string
}

export function DebtScheduleWrapper({ valuationId }: DebtScheduleWrapperProps) {
  return (
    <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
      <DebtScheduleClient valuationId={valuationId} />
    </Suspense>
  )
}
