import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TableViewService } from '@/services/tableViewService'
import type { SavedTableView, SaveViewRequest } from '@/types/reports'

// Query Keys
export const tableViewKeys = {
  all: ['tableViews'] as const,
  byTable: (tableId: string) => [...tableViewKeys.all, 'byTable', tableId] as const,
  byId: (id: string) => [...tableViewKeys.all, 'byId', id] as const,
  default: (tableId: string) => [...tableViewKeys.all, 'default', tableId] as const,
}

// Custom Hooks
export function useTableViewsForTable(
  tableId: string,
  valuationId?: number,
  options?: { page?: number; limit?: number }
) {
  return useQuery({
    queryKey: [...tableViewKeys.byTable(tableId), { valuationId, ...options }],
    queryFn: () => TableViewService.loadViewsForTable(tableId, valuationId, options),
    enabled: !!tableId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useTableView(viewId: string) {
  return useQuery({
    queryKey: tableViewKeys.byId(viewId),
    queryFn: () => TableViewService.loadView(viewId),
    enabled: !!viewId,
    staleTime: 10 * 60 * 1000, // 10 minutes (views don't change often)
  })
}

export function useDefaultTableView(tableId: string) {
  return useQuery({
    queryKey: tableViewKeys.default(tableId),
    queryFn: () => TableViewService.getDefaultView(tableId),
    enabled: !!tableId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Mutations
export function useSaveTableView() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: SaveViewRequest) => TableViewService.saveView(request),
    onSuccess: (data, variables) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: tableViewKeys.byTable(variables.tableId) })
      if (variables.isDefault) {
        queryClient.invalidateQueries({ queryKey: tableViewKeys.default(variables.tableId) })
      }
      // Update the specific view in cache if we have its ID
      if (data?.id) {
        queryClient.setQueryData(tableViewKeys.byId(data.id), data)
      }
    },
  })
}

export function useUpdateTableView() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ viewId, updates }: { viewId: string; updates: Partial<SaveViewRequest> }) =>
      TableViewService.updateView(viewId, updates),
    onSuccess: (data, variables) => {
      if (data) {
        // Update the specific view in cache
        queryClient.setQueryData(tableViewKeys.byId(variables.viewId), data)
        // Invalidate table views list to reflect changes
        const tableId = data.tableId || (data as any).table_id || ''
        if (tableId) {
          queryClient.invalidateQueries({ queryKey: tableViewKeys.byTable(tableId) })
        }
      }
    },
  })
}

export function useDeleteTableView() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (viewId: string) => TableViewService.deleteView(viewId),
    onSuccess: (_data, viewId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: tableViewKeys.byId(viewId) })
      // Invalidate all table view lists (we don't know which table it belonged to)
      queryClient.invalidateQueries({ queryKey: tableViewKeys.all })
    },
  })
}
