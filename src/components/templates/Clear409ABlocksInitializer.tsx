'use client'

import { useEffect } from 'react'
import { clear409ASavedBlocks } from '@/lib/templates/clear-409a-blocks'

export function Clear409ABlocksInitializer() {
  useEffect(() => {
    // Clear 409A blocks on mount
    const clearBlocks = () => {
      try {
        console.log('Clearing 409A saved blocks...')
        clear409ASavedBlocks()
      } catch (error) {
        console.error('Error clearing 409A blocks:', error)
      }
    }

    // Run immediately
    clearBlocks()

    // Also clear when visibility changes (tab focus)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        clearBlocks()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return null
}
