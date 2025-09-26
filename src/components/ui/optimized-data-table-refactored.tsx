import React, { useState, useCallback, useEffect, useMemo } from 'react'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  RowSelectionState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  DndContext,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  ChevronDown,
  Search,
  Settings,
  Eye,
  EyeOff,
  Pin,
  PinOff,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
  Download,
  Save,
  Plus,
  Trash2,
  BookmarkPlus,
} from 'lucide-react'

import { Button } from './button'
import { Input } from './input'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table'
import { Badge } from './badge'
import { cn } from '@/lib/utils'

// Import our extracted components and hooks
import { OptimizedDataTableProps } from './data-table/types'
import { useTableState } from './data-table/hooks/use-table-state'
import { useViewManagement } from './data-table/hooks/use-view-management'
import { useDragAndDrop } from './data-table/hooks/use-drag-and-drop'
import { useColumnPinning } from './data-table/hooks/use-column-pinning'
import { useDebounce } from './data-table/utils'
import { DraggableColumnHeader, DraggableTableRow } from './data-table/draggable-components'

export function OptimizedDataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Search...',
  onRowEdit,
  onRowDelete,
  onRowReorder,
  enableColumnFilters = true,
  enableSorting = true,
  enableColumnVisibility = true,
  enableColumnReordering = true,
  enableColumnPinning = true,
  enableRowReordering = false,
  enablePagination = true,
  enableRowSelection = false,
  selectedRows,
  onRowSelectionChange,
  getRowId,
  pageSize = 10,
  className,
  tableId = 'default',
  onStateChange,
  initialState,
}: OptimizedDataTableProps<TData, TValue>) {
  // Use our extracted hooks
  const { state, dispatch, columnsWithIds, orderedColumns, isPinnedColumn } = useTableState({
    columns,
    initialState,
    enableSorting,
    enableColumnFilters,
    enableColumnReordering,
    enableRowReordering,
  })

  const { sensors, handleColumnDragEnd, handleRowDragEnd } = useDragAndDrop(
    state,
    dispatch,
    onRowReorder
  )

  const { toggleColumnPin } = useColumnPinning(state, dispatch)

  // Debounce global filter for better performance
  const debouncedGlobalFilter = useDebounce(state.globalFilter, 300)

  // Initialize row order when data changes
  useEffect(() => {
    if (data.length > 0) {
      dispatch({ type: 'SET_ROW_ORDER', payload: data.map((_, index) => index.toString()) })
    }
  }, [data, dispatch])

  // Notify parent of state changes (debounced)
  const debouncedStateChange = useCallback(
    useDebounce((newState: any) => {
      if (onStateChange) {
        onStateChange(newState)
      }
    }, 300),
    [onStateChange]
  )

  useEffect(() => {
    if (onStateChange && debouncedStateChange) {
      debouncedStateChange({
        sorting: state.sorting,
        columnFilters: state.columnFilters,
        columnVisibility: state.columnVisibility,
        columnOrder: state.columnOrder,
        pinnedColumns: state.pinnedColumns,
        pageSize: table?.getState().pagination.pageSize || pageSize,
      })
    }
  }, [
    state.sorting,
    state.columnFilters,
    state.columnVisibility,
    state.columnOrder,
    state.pinnedColumns,
    onStateChange,
    debouncedStateChange,
  ])

  // Memoized table instance
  const table = useReactTable({
    data,
    columns: orderedColumns,
    onSortingChange: useCallback(
      (sorting: SortingState | ((old: SortingState) => SortingState)) =>
        dispatch({
          type: 'SET_SORTING',
          payload: typeof sorting === 'function' ? sorting(state.sorting) : sorting,
        }),
      [state.sorting, dispatch]
    ),
    onColumnFiltersChange: useCallback(
      (filters: ColumnFiltersState | ((old: ColumnFiltersState) => ColumnFiltersState)) =>
        dispatch({
          type: 'SET_COLUMN_FILTERS',
          payload: typeof filters === 'function' ? filters(state.columnFilters) : filters,
        }),
      [state.columnFilters, dispatch]
    ),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: state.localEnableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: state.localEnableFilters ? getFilteredRowModel() : undefined,
    onColumnVisibilityChange: useCallback(
      (visibility: VisibilityState | ((old: VisibilityState) => VisibilityState)) =>
        dispatch({
          type: 'SET_COLUMN_VISIBILITY',
          payload:
            typeof visibility === 'function' ? visibility(state.columnVisibility) : visibility,
        }),
      [state.columnVisibility, dispatch]
    ),
    onRowSelectionChange: useCallback(
      (selection: RowSelectionState | ((old: RowSelectionState) => RowSelectionState)) =>
        dispatch({
          type: 'SET_ROW_SELECTION',
          payload: typeof selection === 'function' ? selection(state.rowSelection) : selection,
        }),
      [state.rowSelection, dispatch]
    ),
    onGlobalFilterChange: useCallback(
      (filter: string | ((old: string) => string)) =>
        dispatch({
          type: 'SET_GLOBAL_FILTER',
          payload: typeof filter === 'function' ? filter(state.globalFilter) : filter,
        }),
      [state.globalFilter, dispatch]
    ),
    globalFilterFn: 'includesString',
    state: {
      sorting: state.sorting,
      columnFilters: state.columnFilters,
      columnVisibility: state.columnVisibility,
      rowSelection: state.rowSelection,
      globalFilter: debouncedGlobalFilter,
    },
    initialState: {
      pagination: {
        pageSize: initialState?.pageSize || pageSize,
      },
    },
  })

  const { saveCurrentAsView, loadView, deleteView, createNewView } = useViewManagement(
    tableId,
    state,
    dispatch,
    table
  )

  // Lazy-loaded export function
  const exportToExcel = useCallback(async () => {
    try {
      const { exportTableToExcel } = await import('./excel-exporter')
      exportTableToExcel(table, tableId)
    } catch (error) {
      console.warn('Excel export failed:', error)
    }
  }, [table, tableId])

  return (
    <div className={cn('space-y-4', className)}>
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* View Management */}
          <div className="flex items-center space-x-1">
            {/* Current View Indicator */}
            {state.currentView && (
              <Badge variant="outline" className="gap-1">
                <BookmarkPlus className="h-3 w-3" />
                {state.currentView.name}
                {state.currentView.isDefault && ' (Default)'}
              </Badge>
            )}

            {/* View Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <BookmarkPlus className="mr-2 h-4 w-4" />
                  Views
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[250px]">
                <DropdownMenuLabel>Saved Views</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {state.views.length > 0 ? (
                  state.views.map((view) => (
                    <div key={view.id} className="flex items-center justify-between px-2 py-1">
                      <DropdownMenuItem
                        className="flex-1 cursor-pointer"
                        onClick={() => loadView(view)}
                      >
                        <div className="flex items-center space-x-2">
                          <span className={state.currentView?.id === view.id ? 'font-medium' : ''}>
                            {view.name}
                          </span>
                          {view.isDefault && (
                            <Badge variant="secondary" className="text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
                      </DropdownMenuItem>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteView(view.id)
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="px-2 py-1 text-sm text-muted-foreground">No saved views</div>
                )}
                <DropdownMenuSeparator />
                <div className="p-2">
                  {state.showCreateView ? (
                    <div className="space-y-2">
                      <Input
                        placeholder="View name"
                        value={state.newViewName}
                        onChange={(e) =>
                          dispatch({ type: 'SET_NEW_VIEW_NAME', payload: e.target.value })
                        }
                        onKeyPress={(e) => e.key === 'Enter' && createNewView()}
                        className="h-8"
                      />
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          className="h-6 text-xs"
                          onClick={createNewView}
                          disabled={!state.newViewName.trim()}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-xs"
                          onClick={() => {
                            dispatch({ type: 'SET_SHOW_CREATE_VIEW', payload: false })
                            dispatch({ type: 'SET_NEW_VIEW_NAME', payload: '' })
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-full"
                      onClick={() => dispatch({ type: 'SET_SHOW_CREATE_VIEW', payload: true })}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Create View
                    </Button>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Global Search */}
          {state.localEnableFilters && (
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={state.globalFilter ?? ''}
                onChange={(event) =>
                  dispatch({ type: 'SET_GLOBAL_FILTER', payload: event.target.value })
                }
                className="max-w-sm pl-8"
              />
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Export */}
          <Button variant="outline" size="sm" onClick={exportToExcel}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>

          {/* Column Visibility */}
          {enableColumnVisibility && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="mr-2 h-4 w-4" />
                  Columns
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        <div className="flex w-full items-center justify-between">
                          <span>{column.id}</span>
                          {isPinnedColumn(column.id) && (
                            <Pin className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Table Settings */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Table Settings</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={state.localEnableSorting}
                onCheckedChange={(checked) =>
                  dispatch({ type: 'SET_LOCAL_ENABLE_SORTING', payload: !!checked })
                }
              >
                Sorting
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={state.localEnableFilters}
                onCheckedChange={(checked) =>
                  dispatch({ type: 'SET_LOCAL_ENABLE_FILTERS', payload: !!checked })
                }
              >
                Filtering
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={state.localEnableReordering}
                onCheckedChange={(checked) =>
                  dispatch({ type: 'SET_LOCAL_ENABLE_REORDERING', payload: !!checked })
                }
              >
                Column Reordering
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={state.localEnableRowReordering}
                onCheckedChange={(checked) =>
                  dispatch({ type: 'SET_LOCAL_ENABLE_ROW_REORDERING', payload: !!checked })
                }
                disabled={!onRowReorder}
              >
                Row Reordering
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => saveCurrentAsView('Default View', true)}>
                <Save className="mr-2 h-3 w-3" />
                Save as Default
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Active Filters */}
      {state.columnFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {state.columnFilters.map((filter) => (
            <Badge key={filter.id} variant="secondary" className="gap-1">
              {filter.id}: {filter.value as string}
              <button
                onClick={() => {
                  dispatch({
                    type: 'SET_COLUMN_FILTERS',
                    payload: state.columnFilters.filter((f) => f.id !== filter.id),
                  })
                }}
                className="ml-1 rounded-full p-0.5 hover:bg-secondary-foreground/20"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(event) => {
            if (state.localEnableReordering) {
              handleColumnDragEnd(event)
            }
            if (state.localEnableRowReordering && onRowReorder) {
              handleRowDragEnd(event)
            }
          }}
        >
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {state.localEnableReordering ? (
                    <SortableContext
                      items={state.columnOrder}
                      strategy={horizontalListSortingStrategy}
                    >
                      {state.localEnableRowReordering && onRowReorder && (
                        <TableHead className="w-8 p-2">
                          <div className="flex h-6 w-6 items-center justify-center">
                            {/* Drag handle column header */}
                          </div>
                        </TableHead>
                      )}
                      {headerGroup.headers.map((header) => {
                        const isPinned = isPinnedColumn(header.column.id)
                        return (
                          <DraggableColumnHeader
                            key={header.id}
                            column={header.column}
                            isPinned={isPinned}
                          >
                            <div className="flex min-w-0 flex-1 items-center space-x-1">
                              {header.isPlaceholder ? null : (
                                <>
                                  {/* Column Header Content */}
                                  <div className="min-w-0 flex-1">
                                    {state.localEnableSorting && header.column.getCanSort() ? (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-auto p-0 hover:bg-transparent"
                                        onClick={() => header.column.toggleSorting()}
                                      >
                                        <div className="flex items-center space-x-1">
                                          <span className="truncate">
                                            {flexRender(
                                              header.column.columnDef.header,
                                              header.getContext()
                                            )}
                                          </span>
                                          {header.column.getIsSorted() === 'desc' ? (
                                            <ArrowDown className="h-3 w-3" />
                                          ) : header.column.getIsSorted() === 'asc' ? (
                                            <ArrowUp className="h-3 w-3" />
                                          ) : (
                                            <ArrowUpDown className="h-3 w-3 opacity-50" />
                                          )}
                                        </div>
                                      </Button>
                                    ) : (
                                      <span className="truncate">
                                        {flexRender(
                                          header.column.columnDef.header,
                                          header.getContext()
                                        )}
                                      </span>
                                    )}
                                  </div>

                                  {/* Column Actions */}
                                  {enableColumnPinning && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                          <MoreHorizontal className="h-3 w-3" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Column Actions</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {!isPinned ? (
                                          <>
                                            <DropdownMenuItem
                                              onClick={() =>
                                                toggleColumnPin(header.column.id, 'left')
                                              }
                                            >
                                              <Pin className="mr-2 h-3 w-3" />
                                              Pin Left
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={() =>
                                                toggleColumnPin(header.column.id, 'right')
                                              }
                                            >
                                              <Pin className="mr-2 h-3 w-3" />
                                              Pin Right
                                            </DropdownMenuItem>
                                          </>
                                        ) : (
                                          <DropdownMenuItem
                                            onClick={() =>
                                              toggleColumnPin(header.column.id, 'left')
                                            }
                                          >
                                            <PinOff className="mr-2 h-3 w-3" />
                                            Unpin
                                          </DropdownMenuItem>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={() => header.column.toggleVisibility()}
                                        >
                                          <EyeOff className="mr-2 h-3 w-3" />
                                          Hide Column
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </>
                              )}
                            </div>
                          </DraggableColumnHeader>
                        )
                      })}
                    </SortableContext>
                  ) : (
                    <>
                      {state.localEnableRowReordering && onRowReorder && (
                        <TableHead className="w-8 p-2">
                          <div className="flex h-6 w-6 items-center justify-center">
                            {/* Drag handle column header */}
                          </div>
                        </TableHead>
                      )}
                      {headerGroup.headers.map((header) => {
                        const isPinned = isPinnedColumn(header.column.id)
                        return (
                          <TableHead
                            key={header.id}
                            className={cn('relative', isPinned ? 'bg-muted/50' : '')}
                          >
                            <div className="flex min-w-0 flex-1 items-center space-x-1">
                              {header.isPlaceholder ? null : (
                                <>
                                  {/* Column Header Content */}
                                  <div className="min-w-0 flex-1">
                                    {state.localEnableSorting && header.column.getCanSort() ? (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-auto p-0 hover:bg-transparent"
                                        onClick={() => header.column.toggleSorting()}
                                      >
                                        <div className="flex items-center space-x-1">
                                          <span className="truncate">
                                            {flexRender(
                                              header.column.columnDef.header,
                                              header.getContext()
                                            )}
                                          </span>
                                          {header.column.getIsSorted() === 'desc' ? (
                                            <ArrowDown className="h-3 w-3" />
                                          ) : header.column.getIsSorted() === 'asc' ? (
                                            <ArrowUp className="h-3 w-3" />
                                          ) : (
                                            <ArrowUpDown className="h-3 w-3 opacity-50" />
                                          )}
                                        </div>
                                      </Button>
                                    ) : (
                                      <span className="truncate">
                                        {flexRender(
                                          header.column.columnDef.header,
                                          header.getContext()
                                        )}
                                      </span>
                                    )}
                                  </div>

                                  {/* Column Actions */}
                                  {enableColumnPinning && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                          <MoreHorizontal className="h-3 w-3" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Column Actions</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {!isPinned ? (
                                          <>
                                            <DropdownMenuItem
                                              onClick={() =>
                                                toggleColumnPin(header.column.id, 'left')
                                              }
                                            >
                                              <Pin className="mr-2 h-3 w-3" />
                                              Pin Left
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={() =>
                                                toggleColumnPin(header.column.id, 'right')
                                              }
                                            >
                                              <Pin className="mr-2 h-3 w-3" />
                                              Pin Right
                                            </DropdownMenuItem>
                                          </>
                                        ) : (
                                          <DropdownMenuItem
                                            onClick={() =>
                                              toggleColumnPin(header.column.id, 'left')
                                            }
                                          >
                                            <PinOff className="mr-2 h-3 w-3" />
                                            Unpin
                                          </DropdownMenuItem>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={() => header.column.toggleVisibility()}
                                        >
                                          <EyeOff className="mr-2 h-3 w-3" />
                                          Hide Column
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </>
                              )}
                            </div>
                          </TableHead>
                        )
                      })}
                    </>
                  )}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                state.localEnableRowReordering && onRowReorder ? (
                  <SortableContext
                    items={table.getRowModel().rows.map((_, index) => index.toString())}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.map((row, index) => (
                      <DraggableTableRow
                        key={row.id}
                        row={row}
                        index={index}
                        data-state={row.getIsSelected() && 'selected'}
                        className="hover:bg-muted/50"
                      >
                        {row.getVisibleCells().map((cell) => {
                          const isPinned = isPinnedColumn(cell.column.id)
                          return (
                            <TableCell key={cell.id} className={isPinned ? 'bg-muted/30' : ''}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          )
                        })}
                      </DraggableTableRow>
                    ))}
                  </SortableContext>
                ) : (
                  table.getRowModel().rows.map((row, index) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                      className="hover:bg-muted/50"
                    >
                      {state.localEnableRowReordering && onRowReorder && (
                        <TableCell className="w-8 p-2">
                          <div className="flex h-6 w-6 items-center justify-center">
                            {/* Placeholder for alignment */}
                          </div>
                        </TableCell>
                      )}
                      {row.getVisibleCells().map((cell) => {
                        const isPinned = isPinnedColumn(cell.column.id)
                        return (
                          <TableCell key={cell.id} className={isPinned ? 'bg-muted/30' : ''}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))
                )
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={
                      orderedColumns.length +
                      (state.localEnableRowReordering && onRowReorder ? 1 : 0)
                    }
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>

      {/* Pagination */}
      {enablePagination && (
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{' '}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Rows per page</p>
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => {
                  table.setPageSize(Number(e.target.value))
                }}
                className="h-8 w-[70px] rounded border border-input bg-background px-3 py-1 text-sm"
              >
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    {pageSize}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OptimizedDataTable