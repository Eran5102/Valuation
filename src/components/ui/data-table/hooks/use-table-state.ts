import { useReducer, useMemo, useCallback } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { tableReducer } from '../table-reducer'
import { TableState, OptimizedDataTableProps } from '../types'
import { ensureColumnIds, calculateOrderedColumns } from '../utils'

export function useTableState<TData, TValue>({
  columns,
  initialState,
  enableSorting,
  enableColumnFilters,
  enableColumnReordering,
  enableRowReordering,
}: {
  columns: ColumnDef<TData, TValue>[]
  initialState?: OptimizedDataTableProps<TData, TValue>['initialState']
  enableSorting: boolean
  enableColumnFilters: boolean
  enableColumnReordering: boolean
  enableRowReordering: boolean
}) {
  // Ensure all columns have IDs
  const columnsWithIds = useMemo(() => ensureColumnIds(columns), [columns])

  // Initialize state with useReducer for better performance
  const [state, dispatch] = useReducer(tableReducer, {
    sorting: initialState?.sorting || [],
    columnFilters: initialState?.columnFilters || [],
    columnVisibility: initialState?.columnVisibility || {},
    rowSelection: {},
    columnOrder: initialState?.columnOrder || columnsWithIds.map((col) => col.id || ''),
    pinnedColumns: initialState?.pinnedColumns || { left: [], right: [] },
    globalFilter: '',
    views: [],
    currentView: null,
    showCreateView: false,
    newViewName: '',
    localEnableSorting: enableSorting,
    localEnableFilters: enableColumnFilters,
    localEnableReordering: enableColumnReordering,
    localEnableRowReordering: enableRowReordering,
    rowOrder: [],
  })

  // Memoized column ordering calculation
  const orderedColumns = useMemo(() => {
    return calculateOrderedColumns(columnsWithIds, state.columnOrder, state.pinnedColumns)
  }, [columnsWithIds, state.columnOrder, state.pinnedColumns])

  const isPinnedColumn = useCallback(
    (columnId: string) => {
      const leftPinned = state.pinnedColumns?.left || []
      const rightPinned = state.pinnedColumns?.right || []
      return leftPinned.includes(columnId) || rightPinned.includes(columnId)
    },
    [state.pinnedColumns]
  )

  return {
    state,
    dispatch,
    columnsWithIds,
    orderedColumns,
    isPinnedColumn,
  }
}