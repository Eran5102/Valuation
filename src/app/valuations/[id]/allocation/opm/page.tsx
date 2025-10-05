'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { OPMMainPanel } from '@/components/valuation/opm/OPMMainPanel'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { getOPMAssumptions } from './actions'

export default function OPMPage() {
  const params = useParams()
  const valuationId = params?.id as string
  const [assumptions, setAssumptions] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAssumptions() {
      try {
        const result = await getOPMAssumptions(valuationId)
        if (result.success) {
          console.log('[OPMPage] Loaded assumptions from:', result.source)
          setAssumptions(result.data)
        } else {
          console.error('[OPMPage] Failed to load assumptions:', result.error)
        }
      } catch (error) {
        console.error('[OPMPage] Exception fetching assumptions:', error)
      } finally {
        setLoading(false)
      }
    }

    if (valuationId) {
      fetchAssumptions()
    }
  }, [valuationId])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center p-6">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <OPMMainPanel valuationId={valuationId} assumptions={assumptions} />
    </div>
  )
}
