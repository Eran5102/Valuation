import { useEffect, useRef, useCallback } from 'react'

interface UseAutoSaveV2Props {
  hasChanges: boolean
  saveFunction: () => Promise<void>
  delay?: number // milliseconds
  enabled?: boolean
}

export function useAutoSaveV2({
  hasChanges,
  saveFunction,
  delay = 5000, // Default 5 seconds
  enabled = true,
}: UseAutoSaveV2Props) {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSaveTimeRef = useRef<number>(0)

  // Clear any pending save on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  // Auto-save logic
  useEffect(() => {
    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }

    // Only set up auto-save if enabled and there are changes
    if (!enabled || !hasChanges) {
      return
    }

    // Set up debounced save
    saveTimeoutRef.current = setTimeout(() => {
      const now = Date.now()
      const timeSinceLastSave = now - lastSaveTimeRef.current

      // Ensure at least 1 second between saves to prevent rapid saves
      if (timeSinceLastSave < 1000) {
        return
      }

      // Execute save
      saveFunction()
        .then(() => {
          lastSaveTimeRef.current = now
          console.log('Auto-save completed successfully')
        })
        .catch((error) => {
          console.error('Auto-save failed:', error)
        })
    }, delay)

    // Cleanup
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = null
      }
    }
  }, [hasChanges, saveFunction, delay, enabled])

  // Manual trigger for immediate save (useful for save button)
  const triggerSave = useCallback(() => {
    // Clear any pending auto-save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }

    // Execute save immediately
    const now = Date.now()
    lastSaveTimeRef.current = now
    return saveFunction()
  }, [saveFunction])

  // Cancel pending save
  const cancelPendingSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }
  }, [])

  return {
    triggerSave,
    cancelPendingSave,
    hasPendingSave: !!saveTimeoutRef.current,
  }
}
