'use client'

import React from 'react'
import { CheckCircle2, AlertCircle, Loader2, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SaveStatusIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error'
  lastSaved?: Date | null
  error?: string | null
  className?: string
}

export function SaveStatusIndicator({
  status,
  lastSaved,
  error,
  className,
}: SaveStatusIndicatorProps) {
  const getStatusDisplay = () => {
    switch (status) {
      case 'saving':
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">Saving changes...</span>
          </div>
        )

      case 'saved':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium">All changes saved</span>
            {lastSaved && (
              <span className="text-xs text-muted-foreground">{formatTimeSince(lastSaved)}</span>
            )}
          </div>
        )

      case 'error':
        return (
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">{error || 'Failed to save changes'}</span>
          </div>
        )

      case 'idle':
      default:
        if (lastSaved) {
          return (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Last saved {formatTimeSince(lastSaved)}</span>
            </div>
          )
        }
        return null
    }
  }

  const formatTimeSince = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)

    if (diffSecs < 10) {
      return 'just now'
    } else if (diffSecs < 60) {
      return `${diffSecs} seconds ago`
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    } else {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    }
  }

  const display = getStatusDisplay()

  if (!display) return null

  return (
    <div
      className={cn(
        'flex items-center rounded-md px-3 py-1.5 transition-all duration-300',
        status === 'saving' && 'border border-blue-200 bg-blue-50',
        status === 'saved' && 'border border-green-200 bg-green-50',
        status === 'error' && 'border border-red-200 bg-red-50',
        status === 'idle' && 'border border-gray-200 bg-gray-50',
        className
      )}
    >
      {display}
    </div>
  )
}
