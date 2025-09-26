import { useState, useCallback } from 'react'

/**
 * Custom hook for managing modal/dialog state
 */
export function useModal(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState)
  const [data, setData] = useState<any>(null)

  const open = useCallback((modalData?: any) => {
    setData(modalData)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    // Clear data after animation completes
    setTimeout(() => setData(null), 200)
  }, [])

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  return {
    isOpen,
    open,
    close,
    toggle,
    data,
    setData
  }
}