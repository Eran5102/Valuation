import { useCallback } from 'react'
import { ShareClass } from '@/types/models'
import { enhanceShareClassesWithCalculations } from '@/lib/capTableCalculations'

export function useShareClassManagement(
  shareClasses: ShareClass[],
  setShareClasses: (shareClasses: ShareClass[]) => void,
  setEditingRows: (fn: (prev: Set<string>) => Set<string>) => void,
  setHasChanges: (hasChanges: boolean) => void,
  isLoading: boolean
) {
  // Update share class on blur (when user leaves the field)
  const updateShareClass = useCallback(
    (id: string, field: keyof ShareClass, value: any) => {
      // Validation for share type changes
      if (field === 'shareType' && value === 'common') {
        const hasOtherCommon = shareClasses.some((sc) => sc.shareType === 'common' && sc.id !== id)
        if (hasOtherCommon) {
          alert('Only one common share class is allowed')
          return
        }
      }

      // Additional validation for numeric fields
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
      if (field === 'dividendsRate' && (value < 0 || value > 100)) {
        alert('Dividend rate must be between 0 and 100')
        return
      }

      setHasChanges(true)

      // Update state and run calculations immediately on blur
      setShareClasses(((prev: ShareClass[]) => {
        const updated = prev.map((sc: ShareClass) => (sc.id === id ? { ...sc, [field]: value } : sc))
        return enhanceShareClassesWithCalculations(updated)
      }) as any)
    },
    [shareClasses, setShareClasses, setHasChanges]
  )

  // Validation function for seniority
  const validateSeniority = useCallback(
    (newSeniority: number, currentId: string) => {
      // Minimum seniority for preferred shares is 0 (most senior position)
      if (newSeniority < 0) {
        alert('Minimum seniority for preferred shares is 0 (most senior position)')
        return false
      }

      // Allow multiple preferred classes to have the same seniority (pari passu)
      // No additional validation needed - multiple classes can rank equally

      return true
    },
    [shareClasses]
  )

  // Toggle row editing
  const toggleRowEdit = useCallback((id: string) => {
    setEditingRows((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [setEditingRows])

  // Add new share class
  const addShareClass = useCallback(() => {
    // Prevent adding while loading
    if (isLoading) return

    const commonClassExists = shareClasses.some((sc) => sc.shareType === 'common')
    const preferredCount = shareClasses.filter((sc) => sc.shareType === 'preferred').length

    // Generate unique ID with timestamp and random component to prevent collisions
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const newShareClass: ShareClass = {
      id: uniqueId,
      companyId: 1,
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
      participationCap: null,
      conversionRatio: 1.0,
      dividendsDeclared: false,
      dividendsRate: null,
      dividendsType: null,
      pik: false,
    }

    const enhancedShareClasses = enhanceShareClassesWithCalculations([
      ...shareClasses,
      newShareClass,
    ])
    setShareClasses(enhancedShareClasses)
    setHasChanges(true)
  }, [shareClasses, isLoading, setShareClasses, setHasChanges])

  // Delete share class
  const deleteShareClass = useCallback(
    (id: string) => {
      setShareClasses(((prev: ShareClass[]) => {
        const filtered = prev.filter((sc: ShareClass) => sc.id !== id)
        return enhanceShareClassesWithCalculations(filtered)
      }) as any)
      setEditingRows((prev) => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
      setHasChanges(true)
    },
    [setShareClasses, setEditingRows, setHasChanges]
  )

  return {
    updateShareClass,
    validateSeniority,
    toggleRowEdit,
    addShareClass,
    deleteShareClass,
  }
}