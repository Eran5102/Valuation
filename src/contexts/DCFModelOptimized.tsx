'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { DCFModelData } from '@/types/dcf'
import { toast } from 'sonner'

// Split context for better performance - only core data
interface DCFCoreContextType {
  modelData: DCFModelData | null
  isLoading: boolean
  error: string | null
}

const DCFCoreContext = createContext<DCFCoreContextType | undefined>(undefined)

// Lightweight provider that only fetches data when needed
export function DCFModelProvider({
  children,
  valuationId,
}: {
  children: React.ReactNode
  valuationId: string
}) {
  const [modelData, setModelData] = useState<DCFModelData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Lazy load data only when component mounts
  useEffect(() => {
    let cancelled = false

    const loadData = async () => {
      // Check if we already have data in sessionStorage
      const cachedKey = `dcf-model-${valuationId}`
      const cached = sessionStorage.getItem(cachedKey)

      if (cached) {
        try {
          const parsed = JSON.parse(cached)
          // Check if cache is less than 5 minutes old
          if (Date.now() - parsed.timestamp < 5 * 60 * 1000) {
            setModelData(parsed.data)
            return
          }
        } catch (e) {
          // Invalid cache, continue with fetch
        }
      }

      setIsLoading(true)

      try {
        const response = await fetch(`/api/valuations/${valuationId}/dcf-model`, {
          headers: {
            'Cache-Control': 'max-age=300', // Cache for 5 minutes
          },
        })

        if (!cancelled) {
          if (response.ok) {
            const data = await response.json()
            setModelData(data)
            // Cache the data
            sessionStorage.setItem(
              cachedKey,
              JSON.stringify({
                data,
                timestamp: Date.now(),
              })
            )
          } else {
            setError('Failed to load DCF model')
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError('Error loading DCF model')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [valuationId])

  const value = useMemo(
    () => ({
      modelData,
      isLoading,
      error,
    }),
    [modelData, isLoading, error]
  )

  return <DCFCoreContext.Provider value={value}>{children}</DCFCoreContext.Provider>
}

export function useDCFModel() {
  const context = useContext(DCFCoreContext)
  if (context === undefined) {
    throw new Error('useDCFModel must be used within a DCFModelProvider')
  }
  return context
}

// Separate hook for mutations to avoid re-renders
export function useDCFMutations(valuationId: string) {
  const updateModel = useCallback(
    async (updates: Partial<DCFModelData>) => {
      try {
        const response = await fetch(`/api/valuations/${valuationId}/dcf-model`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })

        if (response.ok) {
          // Clear cache on update
          sessionStorage.removeItem(`dcf-model-${valuationId}`)
          toast.success('Changes saved')
          return true
        } else {
          toast.error('Failed to save changes')
          return false
        }
      } catch (error) {
        toast.error('Error saving changes')
        return false
      }
    },
    [valuationId]
  )

  return { updateModel }
}
