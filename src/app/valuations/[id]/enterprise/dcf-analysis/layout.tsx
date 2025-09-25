'use client'

import { useEffect, useState } from 'react'
import { DCFModelProvider } from '@/contexts/DCFModelContext'
import { DCFWorkspaceLayout } from '@/components/dcf/DCFWorkspaceLayout'

interface DCFLayoutProps {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export default function DCFLayout({ children, params }: DCFLayoutProps) {
  const [valuationId, setValuationId] = useState<string>('')

  useEffect(() => {
    params.then(({ id }) => setValuationId(id))
  }, [params])

  if (!valuationId) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading DCF workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <DCFModelProvider valuationId={valuationId}>
      <DCFWorkspaceLayout valuationId={valuationId}>{children}</DCFWorkspaceLayout>
    </DCFModelProvider>
  )
}
