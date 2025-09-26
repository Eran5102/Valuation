import { useState, useEffect, useCallback } from 'react'
import { TableViewService } from '@/services/tableViewService'
import type { SavedTableView, SaveViewRequest } from '@/types/reports'

interface UseTableViewsOptions {
  tableId: string
  valuationId?: number
  autoMigrate?: boolean // Migrate from localStorage automatically
}

export function useTableViews({ tableId, valuationId, autoMigrate = true }: UseTableViewsOptions) {
  const [views, setViews] = useState<SavedTableView[]>([])
  const [currentView, setCurrentView] = useState<SavedTableView | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load views on mount
  useEffect(() => {
    loadViews()
  }, [tableId, valuationId])

  // Auto-migrate from localStorage
  useEffect(() => {
    if (autoMigrate && tableId) {
      TableViewService.migrateLocalViews(tableId)
    }
  }, [tableId, autoMigrate])

  const loadViews = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await TableViewService.loadViewsForTable(tableId, valuationId)
      setViews(response.data)

      // Load default view if exists
      const defaultView = response.data.find((v) => v.isDefault)
      if (defaultView) {
        setCurrentView(defaultView)
      }
    } catch (err) {
      setError('Failed to load table views')
    } finally {
      setIsLoading(false)
    }
  }, [tableId, valuationId])

  const saveView = useCallback(
    async (request: Omit<SaveViewRequest, 'tableId'>) => {
      try {
        const savedView = await TableViewService.saveView({
          ...request,
          tableId,
        })

        if (savedView) {
          await loadViews() // Reload views
          return savedView
        }
        return null
      } catch (err) {
        setError('Failed to save view')
        return null
      }
    },
    [tableId, loadViews]
  )

  const loadView = useCallback(async (viewId: string) => {
    try {
      const view = await TableViewService.loadView(viewId)
      if (view) {
        setCurrentView(view)
        return view
      }
      return null
    } catch (err) {
      setError('Failed to load view')
      return null
    }
  }, [])

  const deleteView = useCallback(
    async (viewId: string) => {
      try {
        const success = await TableViewService.deleteView(viewId)
        if (success) {
          await loadViews() // Reload views
          if (currentView?.id === viewId) {
            setCurrentView(null)
          }
        }
        return success
      } catch (err) {
        setError('Failed to delete view')
        return false
      }
    },
    [currentView, loadViews]
  )

  const updateView = useCallback(
    async (viewId: string, updates: Partial<SaveViewRequest>) => {
      try {
        const updatedView = await TableViewService.updateView(viewId, updates)
        if (updatedView) {
          await loadViews() // Reload views
          if (currentView?.id === viewId) {
            setCurrentView(updatedView)
          }
          return updatedView
        }
        return null
      } catch (err) {
        setError('Failed to update view')
        return null
      }
    },
    [currentView, loadViews]
  )

  const setAsDefault = useCallback(
    async (viewId: string) => {
      return updateView(viewId, { isDefault: true, tableId })
    },
    [updateView, tableId]
  )

  const exportForReport = useCallback(async (viewId: string) => {
    try {
      return await TableViewService.exportViewForReport(viewId)
    } catch (err) {
      setError('Failed to export view')
      return null
    }
  }, [])

  return {
    views,
    currentView,
    isLoading,
    error,
    saveView,
    loadView,
    deleteView,
    updateView,
    setAsDefault,
    exportForReport,
    refresh: loadViews,
  }
}
