'use client'

import { useParams, redirect } from 'next/navigation'

export default function SettingsPage() {
  const params = useParams()
  const valuationId = params?.id as string

  // Redirect to assumptions page since settings and assumptions are now consolidated
  redirect(`/valuations/${valuationId}/assumptions`)
}
