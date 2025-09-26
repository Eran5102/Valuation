import { useState, useEffect, useCallback, useRef } from 'react'
import { ShareClass, OptionsWarrants } from '../types'
import { enhanceShareClassesWithCalculations } from '@/lib/capTableCalculations'

export function useCapTableData(valuationId: string, onSave?: (data: { shareClasses: ShareClass[]; options: OptionsWarrants[] }) => void) {
  const [shareClasses, setShareClasses] = useState<ShareClass[]>([])
  const [options, setOptions] = useState<OptionsWarrants[]>([])
  const [editingRows, setEditingRows] = useState<Set<string>>(new Set())
  const [hasChanges, setHasChanges] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load cap table data
  useEffect(() => {
    const loadCapTableData = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/valuations/${valuationId}/cap-table`)
        if (response.ok) {
          const data = await response.json()
          const enhancedShareClasses = enhanceShareClassesWithCalculations(data.shareClasses || [])
          setShareClasses(enhancedShareClasses)
          setOptions(data.options || [])
        }
      } catch (error) {
        setSaveError('Failed to load cap table data')
      } finally {
        setIsLoading(false)
      }
    }

    loadCapTableData()
  }, [valuationId])

  // Save cap table data
  const saveCapTable = useCallback(async () => {
    if (!hasChanges || isSaving) return

    setIsSaving(true)
    setSaveError(null)

    try {
      const response = await fetch(`/api/valuations/${valuationId}/cap-table`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shareClasses, options }),
      })

      if (response.ok) {
        setHasChanges(false)
        onSave?.({ shareClasses, options })
      } else {
        const error = await response.json()
        setSaveError(error.message || 'Failed to save cap table')
      }
    } catch (error) {
      setSaveError('Network error: Failed to save cap table')
    } finally {
      setIsSaving(false)
    }
  }, [valuationId, shareClasses, options, hasChanges, onSave, isSaving])

  // Auto-save with debouncing
  useEffect(() => {
    if (!hasChanges) return

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Set new timeout for auto-save (2 seconds)
    saveTimeoutRef.current = setTimeout(() => {
      saveCapTable()
    }, 2000)

    // Cleanup
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [hasChanges, saveCapTable])

  return {
    shareClasses,
    setShareClasses,
    options,
    setOptions,
    editingRows,
    setEditingRows,
    hasChanges,
    setHasChanges,
    isLoading,
    isSaving,
    saveError,
    saveCapTable,
  }
}