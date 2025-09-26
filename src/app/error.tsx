'use client'

import { useEffect } from 'react'
import { ErrorPage } from '@/components/ui/error-patterns'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
  }, [error])

  return (
    <ErrorPage
      title="Something went wrong"
      description={error.message || "An unexpected error occurred. Please try again later."}
      onReset={reset}
      showHomeButton={true}
    />
  )
}