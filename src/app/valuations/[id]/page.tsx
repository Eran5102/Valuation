'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function ValuationDetail() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  // Redirect to the overview page in the new workspace layout
  useEffect(() => {
    if (id) {
      router.replace(`/valuations/${id}/overview`)
    }
  }, [id, router])

  // Show loading while redirecting
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 text-lg font-medium">Loading valuation workspace...</div>
        <div className="text-sm text-muted-foreground">Redirecting to overview...</div>
      </div>
    </div>
  )
}
