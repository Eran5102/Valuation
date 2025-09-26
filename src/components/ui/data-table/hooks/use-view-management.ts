import { useCallback, useEffect, useState } from 'react'
import { TableView, TableState, TableAction } from '../types'
import { useDebounce } from '../utils'

export function useViewManagement(
  tableId: string,
  state: TableState,
  dispatch: React.Dispatch<TableAction>,
  table: any
) {
  const [pendingViews, setPendingViews] = useState<TableView[] | null>(null)
  const debouncedViews = useDebounce(pendingViews, 500)

  // Save to localStorage function
  const saveToLocalStorage = useCallback(
    (views: TableView[]) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`table-views-${tableId}`, JSON.stringify(views))
      }
    },
    [tableId]
  )

  // Use debounce for localStorage operations
  useEffect(() => {
    if (debouncedViews) {
      saveToLocalStorage(debouncedViews)
    }
  }, [debouncedViews, saveToLocalStorage])

  // Load views from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedViews = localStorage.getItem(`table-views-${tableId}`)
      if (savedViews) {
        try {
          const parsedViews = JSON.parse(savedViews)
          dispatch({ type: 'SET_VIEWS', payload: parsedViews })
          const defaultView = parsedViews.find((v: TableView) => v.isDefault)
          if (defaultView) {
            dispatch({ type: 'LOAD_VIEW', payload: defaultView })
          }
        } catch (error) {
          console.warn('Failed to load saved views:', error)
        }
      }
    }
  }, [tableId, dispatch])

  const saveCurrentAsView = useCallback(
    (name: string, isDefault = false) => {
      const newView: TableView = {
        id: Date.now().toString(),
        name,
        isDefault,
        config: {
          columnVisibility: state.columnVisibility,
          columnOrder: state.columnOrder,
          pinnedColumns: state.pinnedColumns,
          sorting: state.sorting,
          columnFilters: state.columnFilters,
          pageSize: table.getState().pagination.pageSize,
        },
        createdAt: new Date().toISOString(),
      }

      const updatedViews = isDefault
        ? [newView, ...state.views.map((v) => ({ ...v, isDefault: false }))]
        : [...state.views, newView]

      dispatch({ type: 'SET_VIEWS', payload: updatedViews })
      dispatch({ type: 'SET_CURRENT_VIEW', payload: newView })
      setPendingViews(updatedViews)
    },
    [
      state.columnVisibility,
      state.columnOrder,
      state.pinnedColumns,
      state.sorting,
      state.columnFilters,
      table,
      state.views,
    ]
  )

  const loadView = useCallback(
    (view: TableView) => {
      dispatch({ type: 'LOAD_VIEW', payload: view })
      table.setPageSize(view.config.pageSize)
    },
    [table, dispatch]
  )

  const deleteView = useCallback(
    (viewId: string) => {
      const updatedViews = state.views.filter((v) => v.id !== viewId)
      dispatch({ type: 'SET_VIEWS', payload: updatedViews })
      setPendingViews(updatedViews)

      if (state.currentView?.id === viewId) {
        dispatch({ type: 'SET_CURRENT_VIEW', payload: null })
      }
    },
    [state.views, state.currentView, dispatch]
  )

  const createNewView = useCallback(() => {
    if (state.newViewName.trim()) {
      saveCurrentAsView(state.newViewName.trim())
      dispatch({ type: 'SET_NEW_VIEW_NAME', payload: '' })
      dispatch({ type: 'SET_SHOW_CREATE_VIEW', payload: false })
    }
  }, [state.newViewName, saveCurrentAsView, dispatch])

  return {
    saveCurrentAsView,
    loadView,
    deleteView,
    createNewView,
  }
}