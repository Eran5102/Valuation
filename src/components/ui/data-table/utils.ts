import { useState, useEffect } from 'react'

// Debounce utility hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Utility function to ensure columns have IDs
export function ensureColumnIds<TData, TValue>(columns: any[]): any[] {
  return columns.map((col, index) => ({
    ...col,
    id: col.id || `column_${index}`,
  }))
}

// Calculate ordered columns based on pinning and ordering
export function calculateOrderedColumns<TData, TValue>(
  columnsWithIds: any[],
  columnOrder: string[],
  pinnedColumns: { left: string[]; right: string[] }
): any[] {
  const columnOrderArray = Array.isArray(columnOrder)
    ? columnOrder
    : columnsWithIds.map((col) => col.id || '')
  const leftPinned = pinnedColumns?.left || []
  const rightPinned = pinnedColumns?.right || []
  const pinned = [...leftPinned, ...rightPinned]
  const unpinned = columnOrderArray.filter((id) => !pinned.includes(id))
  const finalOrder = [...leftPinned, ...unpinned, ...rightPinned]

  return finalOrder
    .map((id) => columnsWithIds.find((col) => col.id === id))
    .filter(Boolean)
}