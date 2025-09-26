import { useCallback } from 'react'
import { TableState, TableAction } from '../types'

export function useColumnPinning(state: TableState, dispatch: React.Dispatch<TableAction>) {
  // Pin/unpin column
  const toggleColumnPin = useCallback(
    (columnId: string, side: 'left' | 'right') => {
      const currentPinned = state.pinnedColumns
      const isCurrentlyPinned =
        currentPinned.left.includes(columnId) || currentPinned.right.includes(columnId)

      let newPinnedColumns: { left: string[]; right: string[] }

      if (isCurrentlyPinned) {
        newPinnedColumns = {
          left: currentPinned.left.filter((id) => id !== columnId),
          right: currentPinned.right.filter((id) => id !== columnId),
        }
      } else {
        if (side === 'left') {
          newPinnedColumns = {
            ...currentPinned,
            left: [...currentPinned.left, columnId],
          }
        } else {
          newPinnedColumns = {
            ...currentPinned,
            right: [...currentPinned.right, columnId],
          }
        }
      }

      dispatch({
        type: 'SET_PINNED_COLUMNS',
        payload: newPinnedColumns,
      })
    },
    [state.pinnedColumns, dispatch]
  )

  return {
    toggleColumnPin,
  }
}