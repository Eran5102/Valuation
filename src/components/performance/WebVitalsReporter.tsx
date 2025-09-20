'use client'

import { useEffect } from 'react'
import { reportWebVitals } from '@/lib/performance-utils'

export function WebVitalsReporter() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Dynamically import web-vitals to avoid SSR issues
      import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
        onCLS(reportWebVitals)
        onINP(reportWebVitals)
        onFCP(reportWebVitals)
        onLCP(reportWebVitals)
        onTTFB(reportWebVitals)
      })
    }
  }, [])

  return null
}