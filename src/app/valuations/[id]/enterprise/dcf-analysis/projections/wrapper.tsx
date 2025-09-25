'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

// Dynamically import the client component for better performance
const ProjectedFinancialsClient = dynamic(
  () => import('./client').then((mod) => ({ default: mod.ProjectedFinancialsClient })),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    ),
  }
)

interface ProjectedFinancialsWrapperProps {
  valuationId: string
}

export function ProjectedFinancialsWrapper({ valuationId }: ProjectedFinancialsWrapperProps) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      }
    >
      <ProjectedFinancialsClient valuationId={valuationId} />
    </Suspense>
  )
}
