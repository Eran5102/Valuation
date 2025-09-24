import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getCoreAssumptions, getValuationById } from './actions'
import CoreAssumptionsClient from './client'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function CoreAssumptionsPage({ params }: PageProps) {
  const { id } = await params

  // Fetch data server-side
  const [valuation, assumptions] = await Promise.all([getValuationById(id), getCoreAssumptions(id)])

  if (!valuation) {
    notFound()
  }

  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <CoreAssumptionsClient
        valuationId={id}
        valuation={valuation}
        initialAssumptions={assumptions}
      />
    </Suspense>
  )
}
