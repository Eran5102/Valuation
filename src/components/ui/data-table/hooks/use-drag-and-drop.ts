import { useCallback } from 'react'
import { useSensors, useSensor, PointerSensor, KeyboardSensor } from '@dnd-kit/core'
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable'
import { DragEndEvent } from '@dnd-kit/core'
import { TableState, TableAction } from '../types'

export function useDragAndDrop(
  state: TableState,
  dispatch: React.Dispatch<TableAction>,
  onRowReorder?: (fromIndex: number, toIndex: number) => void
) {
  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Handle column reordering
  const handleColumnDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event

      if (active.id !== over?.id) {
        const currentOrder = state.columnOrder
        const oldIndex = currentOrder.indexOf(active.id as string)
        const newIndex = currentOrder.indexOf(over?.id as string)
        const newOrder = arrayMove(currentOrder, oldIndex, newIndex)
        dispatch({
          type: 'SET_COLUMN_ORDER',
          payload: newOrder,
        })
      }
    },
    [state.columnOrder, dispatch]
  )

  // Handle row reordering
  const handleRowDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event

      if (active.id !== over?.id && onRowReorder) {
        const activeIndex = parseInt(active.id as string)
        const overIndex = parseInt(over?.id as string)

        if (!isNaN(activeIndex) && !isNaN(overIndex)) {
          const currentOrder = state.rowOrder
          const oldIndex = currentOrder.indexOf(activeIndex.toString())
          const newIndex = currentOrder.indexOf(overIndex.toString())
          const newOrder = arrayMove(currentOrder, oldIndex, newIndex)
          dispatch({
            type: 'SET_ROW_ORDER',
            payload: newOrder,
          })
          onRowReorder(activeIndex, overIndex)
        }
      }
    },
    [state.rowOrder, onRowReorder, dispatch]
  )

  return {
    sensors,
    handleColumnDragEnd,
    handleRowDragEnd,
  }
}