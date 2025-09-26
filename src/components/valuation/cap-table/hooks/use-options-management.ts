import { useCallback } from 'react'
import { OptionsWarrants, OptionsType } from '../types'

export function useOptionsManagement(
  options: OptionsWarrants[],
  setOptions: (options: OptionsWarrants[]) => void,
  setEditingRows: (fn: (prev: Set<string>) => Set<string>) => void,
  setHasChanges: (hasChanges: boolean) => void,
  isLoading: boolean
) {
  // Add new option
  const addOption = useCallback(() => {
    // Prevent adding while loading
    if (isLoading) return

    // Generate unique ID with timestamp and random component
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const newOption: OptionsWarrants = {
      id: uniqueId,
      numOptions: 0,
      exercisePrice: 0,
      type: 'Options',
    }

    setOptions([...options, newOption])
    setHasChanges(true)
  }, [isLoading, options, setOptions, setHasChanges])

  // Update option
  const updateOption = useCallback(
    (id: string, field: keyof OptionsWarrants, value: any) => {
      // Validation for numeric fields
      if (field === 'numOptions' && value < 0) {
        alert('Number of options cannot be negative')
        return
      }
      if (field === 'exercisePrice' && value < 0) {
        alert('Exercise price cannot be negative')
        return
      }

      setHasChanges(true)
      setOptions((prev: any) => prev.map((opt: any) => (opt.id === id ? { ...opt, [field]: value } : opt)))
    },
    [setOptions, setHasChanges]
  )

  // Delete option
  const deleteOption = useCallback(
    (id: string) => {
      setOptions(((prev: OptionsWarrants[]) => prev.filter((opt: OptionsWarrants) => opt.id !== id)) as any)
      setEditingRows((prev) => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
      setHasChanges(true)
    },
    [setOptions, setEditingRows, setHasChanges]
  )

  return {
    addOption,
    updateOption,
    deleteOption,
  }
}