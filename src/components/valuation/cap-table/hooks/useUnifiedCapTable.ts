import { useState, useEffect, useCallback, useRef } from 'react'
import { ShareClass, OptionsWarrants } from '../types'
import { enhanceShareClassesWithCalculations } from '@/lib/capTableCalculations'

interface UseUnifiedCapTableReturn {
  // Share Classes
  shareClasses: ShareClass[]
  updateShareClass: (id: string, field: keyof ShareClass, value: any) => void
  addShareClass: () => void
  deleteShareClass: (id: string) => void
  handleShareClassReorder: (fromIndex: number, toIndex: number) => void

  // Options
  options: OptionsWarrants[]
  updateOption: (id: string, field: keyof OptionsWarrants, value: any) => void
  addOption: () => void
  deleteOption: (id: string) => void

  // Editing state
  editingShareRows: Set<string>
  toggleShareRowEdit: (id: string) => void
  editingOptionRows: Set<string>
  toggleOptionRowEdit: (id: string) => void

  // Save state
  hasChanges: boolean
  isLoading: boolean
  isSaving: boolean
  saveError: string | null
  lastSaveTime: Date | null
}

export function useUnifiedCapTable(
  valuationId: string,
  onSave?: (data: { shareClasses: ShareClass[]; options: OptionsWarrants[] }) => void
): UseUnifiedCapTableReturn {
  // Data state
  const [shareClasses, setShareClasses] = useState<ShareClass[]>([])
  const [options, setOptions] = useState<OptionsWarrants[]>([])

  // Editing state
  const [editingShareRows, setEditingShareRows] = useState<Set<string>>(new Set())
  const [editingOptionRows, setEditingOptionRows] = useState<Set<string>>(new Set())

  // Save state
  const [hasChanges, setHasChanges] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null)

  // Refs for debouncing
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load cap table data on mount
  useEffect(() => {
    const loadCapTableData = async () => {
      setIsLoading(true)
      setSaveError(null)

      try {
        const response = await fetch(`/api/valuations/${valuationId}/cap-table`, {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
          },
        })

        // Handle authentication errors
        if (response.status === 401) {
          setSaveError('Session expired. Please refresh the page.')
          return
        }

        if (response.ok) {
          const data = await response.json()

          setShareClasses(data.shareClasses || [])
          setOptions(data.options || [])
          setHasChanges(false)
        } else {
          setSaveError('Failed to load cap table data')
        }
      } catch (error) {
        console.error('Failed to load cap table data:', error)
        setSaveError('Failed to load cap table data')
      } finally {
        setIsLoading(false)
      }
    }

    loadCapTableData()
  }, [valuationId])

  // Save cap table data - unified save for both tables
  const saveCapTable = useCallback(async () => {
    if (isSaving) return

    setIsSaving(true)
    setSaveError(null)

    try {
      // No need to clean - API handles transformation
      const dataToSave = shareClasses

      const response = await fetch(`/api/valuations/${valuationId}/cap-table`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        credentials: 'include',
        body: JSON.stringify({
          shareClasses: dataToSave,
          options,
        }),
      })

      // Handle authentication errors
      if (response.status === 401) {
        setSaveError('Session expired. Please refresh the page.')
        setHasChanges(false)
        return
      }

      if (response.ok) {
        setHasChanges(false)
        setLastSaveTime(new Date())
        onSave?.({ shareClasses, options })
      } else {
        const errorText = await response.text()
        let error
        try {
          error = JSON.parse(errorText)
        } catch (e) {
          error = { message: 'Failed to save cap table' }
        }

        const errorMessage = error.message || error.error || 'Failed to save cap table'
        setSaveError(errorMessage)
      }
    } catch (error) {
      console.error('Network error:', error)
      setSaveError('Network error: Failed to save cap table')
    } finally {
      setIsSaving(false)
    }
  }, [valuationId, shareClasses, options, onSave, isSaving])

  // Debounced auto-save
  useEffect(() => {
    if (!hasChanges || isLoading) return

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Set new timeout for auto-save
    saveTimeoutRef.current = setTimeout(() => {
      saveCapTable()
    }, 2000) // 2 seconds delay

    // Cleanup
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [hasChanges, saveCapTable, isLoading])

  // Share Class Management
  const updateShareClass = useCallback(
    (id: string, field: keyof ShareClass, value: any) => {
      setHasChanges(true)
      // Validation
      if (field === 'shareType' && value === 'common') {
        const hasOtherCommon = shareClasses.some((sc) => sc.shareType === 'common' && sc.id !== id)
        if (hasOtherCommon) {
          alert('Only one common share class is allowed')
          return
        }
      }

      // Numeric field validation
      if (field === 'sharesOutstanding' && value < 0) {
        alert('Shares outstanding cannot be negative')
        return
      }
      if (field === 'pricePerShare' && value < 0) {
        alert('Price per share cannot be negative')
        return
      }
      if (field === 'lpMultiple' && value <= 0) {
        alert('Liquidation preference multiple must be greater than 0')
        return
      }
      if (field === 'conversionRatio' && value <= 0) {
        alert('Conversion ratio must be greater than 0')
        return
      }

      setShareClasses((prev) => {
        const updated = prev.map((sc) => (sc.id === id ? { ...sc, [field]: value } : sc))
        return enhanceShareClassesWithCalculations(updated)
      })
    },
    [shareClasses]
  )

  const addShareClass = useCallback(() => {
    setHasChanges(true)
    const commonClassExists = shareClasses.some((sc) => sc.shareType === 'common')
    const preferredCount = shareClasses.filter((sc) => sc.shareType === 'preferred').length

    const newShareClass: ShareClass = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      shareType: !commonClassExists ? 'common' : 'preferred',
      name: !commonClassExists
        ? 'Common Stock'
        : `Preferred Series ${String.fromCharCode(65 + preferredCount)}`,
      roundDate: new Date().toISOString().split('T')[0],
      sharesOutstanding: 0,
      pricePerShare: 0,
      preferenceType: 'non-participating',
      lpMultiple: 1.0,
      seniority: preferredCount + 1,
      participationCap: 0,
      conversionRatio: 1.0,
      dividendsDeclared: false,
      dividendsRate: 0,
      dividendsType: 'non-cumulative',
      pik: false,
    }

    const enhancedShareClasses = enhanceShareClassesWithCalculations([
      ...shareClasses,
      newShareClass,
    ])
    setShareClasses(enhancedShareClasses)

    // Auto-enter edit mode for new row
    setEditingShareRows((prev) => new Set(prev).add(newShareClass.id))
  }, [shareClasses])

  const deleteShareClass = useCallback((id: string) => {
    if (confirm('Are you sure you want to delete this share class?')) {
      setHasChanges(true)
      setShareClasses((prev) => {
        const filtered = prev.filter((sc) => sc.id !== id)
        return enhanceShareClassesWithCalculations(filtered)
      })
      setEditingShareRows((prev) => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }, [])

  const handleShareClassReorder = useCallback((fromIndex: number, toIndex: number) => {
    setShareClasses((prev) => {
      const newShareClasses = [...prev]
      const [movedShareClass] = newShareClasses.splice(fromIndex, 1)
      newShareClasses.splice(toIndex, 0, movedShareClass)
      return newShareClasses
    })
  }, [])

  const toggleShareRowEdit = useCallback((id: string) => {
    setEditingShareRows((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
        // Trigger calculations when exiting edit mode
        setShareClasses((prev) => enhanceShareClassesWithCalculations(prev))
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  // Options Management
  const updateOption = useCallback((id: string, field: keyof OptionsWarrants, value: any) => {
    setHasChanges(true)
    // Validation
    if (field === 'numOptions' && value < 0) {
      alert('Number of options cannot be negative')
      return
    }
    if (field === 'exercisePrice' && value < 0) {
      alert('Exercise price cannot be negative')
      return
    }

    setOptions((prev) => prev.map((opt) => (opt.id === id ? { ...opt, [field]: value } : opt)))
  }, [])

  const addOption = useCallback(() => {
    setHasChanges(true)
    const newOption: OptionsWarrants = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      numOptions: 0,
      exercisePrice: 0,
      type: 'Options',
    }

    setOptions((prev) => [...prev, newOption])

    // Auto-enter edit mode for new row
    setEditingOptionRows((prev) => new Set(prev).add(newOption.id))
  }, [])

  const deleteOption = useCallback((id: string) => {
    if (confirm('Are you sure you want to delete this option/warrant?')) {
      setHasChanges(true)
      setOptions((prev) => prev.filter((opt) => opt.id !== id))
      setEditingOptionRows((prev) => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }, [])

  const toggleOptionRowEdit = useCallback((id: string) => {
    setEditingOptionRows((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  return {
    // Share Classes
    shareClasses,
    updateShareClass,
    addShareClass,
    deleteShareClass,
    handleShareClassReorder,

    // Options
    options,
    updateOption,
    addOption,
    deleteOption,

    // Editing state
    editingShareRows,
    toggleShareRowEdit,
    editingOptionRows,
    toggleOptionRowEdit,

    // Save state
    hasChanges,
    isLoading,
    isSaving,
    saveError,
    lastSaveTime,
  }
}
