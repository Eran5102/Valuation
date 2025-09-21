import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  memo,
  lazy,
  Suspense,
} from 'react'
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
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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
  GripVertical,
  Download,
  Save,
  Plus,
  Trash2,
  BookmarkPlus,
  Menu,
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

// Excel export functionality will be dynamically imported when needed

// Debounce utility
function useDebounce<T>(value: T, delay: number): T {
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

// View management types
interface TableView {
  id: string
  name: string
  isDefault?: boolean
  config: {
    columnVisibility: VisibilityState
    columnOrder: string[]
    pinnedColumns: { left: string[]; right: string[] }
    sorting: SortingState
    columnFilters: ColumnFiltersState
    pageSize: number
  }
  createdAt: string
}

// Consolidated state management with useReducer
interface TableState {
  sorting: SortingState
  columnFilters: ColumnFiltersState
  columnVisibility: VisibilityState
  rowSelection: Record<string, boolean>
  columnOrder: string[]
  pinnedColumns: { left: string[]; right: string[] }
  globalFilter: string
  views: TableView[]
  currentView: TableView | null
  showCreateView: boolean
  newViewName: string
  localEnableSorting: boolean
  localEnableFilters: boolean
  localEnableReordering: boolean
  localEnableRowReordering: boolean
  rowOrder: string[]
}

type TableAction =
  | { type: 'SET_SORTING'; payload: SortingState }
  | { type: 'SET_COLUMN_FILTERS'; payload: ColumnFiltersState }
  | { type: 'SET_COLUMN_VISIBILITY'; payload: VisibilityState }
  | { type: 'SET_ROW_SELECTION'; payload: Record<string, boolean> }
  | { type: 'SET_COLUMN_ORDER'; payload: string[] }
  | { type: 'SET_PINNED_COLUMNS'; payload: { left: string[]; right: string[] } }
  | { type: 'SET_GLOBAL_FILTER'; payload: string }
  | { type: 'SET_VIEWS'; payload: TableView[] }
  | { type: 'SET_CURRENT_VIEW'; payload: TableView | null }
  | { type: 'SET_SHOW_CREATE_VIEW'; payload: boolean }
  | { type: 'SET_NEW_VIEW_NAME'; payload: string }
  | { type: 'SET_LOCAL_ENABLE_SORTING'; payload: boolean }
  | { type: 'SET_LOCAL_ENABLE_FILTERS'; payload: boolean }
  | { type: 'SET_LOCAL_ENABLE_REORDERING'; payload: boolean }
  | { type: 'SET_LOCAL_ENABLE_ROW_REORDERING'; payload: boolean }
  | { type: 'SET_ROW_ORDER'; payload: string[] }
  | { type: 'LOAD_VIEW'; payload: TableView }
  | { type: 'INITIALIZE'; payload: Partial<TableState> }

function tableReducer(state: TableState, action: TableAction): TableState {
  switch (action.type) {
    case 'SET_SORTING':
      return { ...state, sorting: action.payload }
    case 'SET_COLUMN_FILTERS':
      return { ...state, columnFilters: action.payload }
    case 'SET_COLUMN_VISIBILITY':
      return { ...state, columnVisibility: action.payload }
    case 'SET_ROW_SELECTION':
      return { ...state, rowSelection: action.payload }
    case 'SET_COLUMN_ORDER':
      return { ...state, columnOrder: action.payload }
    case 'SET_PINNED_COLUMNS':
      return { ...state, pinnedColumns: action.payload }
    case 'SET_GLOBAL_FILTER':
      return { ...state, globalFilter: action.payload }
    case 'SET_VIEWS':
      return { ...state, views: action.payload }
    case 'SET_CURRENT_VIEW':
      return { ...state, currentView: action.payload }
    case 'SET_SHOW_CREATE_VIEW':
      return { ...state, showCreateView: action.payload }
    case 'SET_NEW_VIEW_NAME':
      return { ...state, newViewName: action.payload }
    case 'SET_LOCAL_ENABLE_SORTING':
      return { ...state, localEnableSorting: action.payload }
    case 'SET_LOCAL_ENABLE_FILTERS':
      return { ...state, localEnableFilters: action.payload }
    case 'SET_LOCAL_ENABLE_REORDERING':
      return { ...state, localEnableReordering: action.payload }
    case 'SET_LOCAL_ENABLE_ROW_REORDERING':
      return { ...state, localEnableRowReordering: action.payload }
    case 'SET_ROW_ORDER':
      return { ...state, rowOrder: action.payload }
    case 'LOAD_VIEW':
      return {
        ...state,
        columnVisibility: action.payload.config.columnVisibility || {},
        columnOrder: action.payload.config.columnOrder || state.columnOrder || [],
        pinnedColumns: action.payload.config.pinnedColumns || { left: [], right: [] },
        sorting: action.payload.config.sorting || [],
        columnFilters: action.payload.config.columnFilters || [],
        currentView: action.payload,
      }
    case 'INITIALIZE':
      return { ...state, ...action.payload }
    default:
      return state
  }
}

interface OptimizedDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  searchPlaceholder?: string
  onRowEdit?: (row: TData) => void
  onRowDelete?: (row: TData) => void
  onRowReorder?: (fromIndex: number, toIndex: number) => void
  enableColumnFilters?: boolean
  enableSorting?: boolean
  enableColumnVisibility?: boolean
  enableColumnReordering?: boolean
  enableColumnPinning?: boolean
  enableRowReordering?: boolean
  enablePagination?: boolean
  pageSize?: number
  className?: string
  tableId?: string
  onStateChange?: (state: any) => void
  initialState?: Partial<{
    columnVisibility: VisibilityState
    columnOrder: string[]
    pinnedColumns: { left: string[]; right: string[] }
    sorting: SortingState
    columnFilters: ColumnFiltersState
    pageSize: number
  }>
}

// Memoized draggable header component
const DraggableColumnHeader = memo(function DraggableColumnHeader({
  column,
  children,
  isPinned = false,
}: {
  column: any
  children: React.ReactNode
  isPinned?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
    disabled: isPinned,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      className={cn('relative', isPinned ? 'bg-muted/50' : '', isDragging ? 'z-50' : '')}
      {...attributes}
    >
      <div className="flex w-full items-center space-x-1">
        {!isPinned && (
          <div
            {...listeners}
            className="flex-shrink-0 cursor-grab rounded p-1 hover:cursor-grabbing hover:bg-muted"
          >
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </TableHead>
  )
})

// Memoized draggable row component
const DraggableTableRow = memo(function DraggableTableRow({
  row,
  index,
  children,
  className,
  ...props
}: {
  row: any
  index: number
  children: React.ReactNode
  className?: string
  [key: string]: any
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: index.toString(),
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn(className, isDragging ? 'z-50' : '')}
      {...attributes}
      {...props}
    >
      <TableCell className="w-8 p-2">
        <div
          {...listeners}
          className="flex cursor-grab items-center justify-center rounded p-1 hover:cursor-grabbing hover:bg-muted"
        >
          <Menu className="h-3 w-3 text-muted-foreground" />
        </div>
      </TableCell>
      {children}
    </TableRow>
  )
})

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
  pageSize = 10,
  className,
  tableId = 'default',
  onStateChange,
  initialState,
}: OptimizedDataTableProps<TData, TValue>) {
  // Initialize state with useReducer for better performance
  const [state, dispatch] = useReducer(tableReducer, {
    sorting: initialState?.sorting || [],
    columnFilters: initialState?.columnFilters || [],
    columnVisibility: initialState?.columnVisibility || {},
    rowSelection: {},
    columnOrder: initialState?.columnOrder || columns.map((col) => col.id || ''),
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

  // Debounce global filter for better performance
  const debouncedGlobalFilter = useDebounce(state.globalFilter, 300)

  // Initialize row order when data changes
  useEffect(() => {
    if (data.length > 0) {
      dispatch({ type: 'SET_ROW_ORDER', payload: data.map((_, index) => index.toString()) })
    }
  }, [data])

  // Memoized column ordering calculation
  const orderedColumns = useMemo(() => {
    const columnOrderArray = Array.isArray(state.columnOrder)
      ? state.columnOrder
      : columns.map((col) => col.id || '')
    const leftPinned = state.pinnedColumns?.left || []
    const rightPinned = state.pinnedColumns?.right || []
    const pinned = [...leftPinned, ...rightPinned]
    const unpinned = columnOrderArray.filter((id) => !pinned.includes(id))
    const finalOrder = [...leftPinned, ...unpinned, ...rightPinned]

    return finalOrder
      .map((id) => columns.find((col) => col.id === id))
      .filter(Boolean) as ColumnDef<TData, TValue>[]
  }, [columns, state.columnOrder, state.pinnedColumns])

  // Debounced localStorage operations
  const debouncedSaveToLocalStorage = useCallback(
    useDebounce((views: TableView[]) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`table-views-${tableId}`, JSON.stringify(views))
      }
    }, 500),
    [tableId]
  )

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
  }, [tableId])

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
      [state.sorting]
    ),
    onColumnFiltersChange: useCallback(
      (filters: ColumnFiltersState | ((old: ColumnFiltersState) => ColumnFiltersState)) =>
        dispatch({
          type: 'SET_COLUMN_FILTERS',
          payload: typeof filters === 'function' ? filters(state.columnFilters) : filters,
        }),
      [state.columnFilters]
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
      [state.columnVisibility]
    ),
    onRowSelectionChange: useCallback(
      (selection: RowSelectionState | ((old: RowSelectionState) => RowSelectionState)) =>
        dispatch({
          type: 'SET_ROW_SELECTION',
          payload: typeof selection === 'function' ? selection(state.rowSelection) : selection,
        }),
      [state.rowSelection]
    ),
    onGlobalFilterChange: useCallback(
      (filter: string | ((old: string) => string)) =>
        dispatch({
          type: 'SET_GLOBAL_FILTER',
          payload: typeof filter === 'function' ? filter(state.globalFilter) : filter,
        }),
      [state.globalFilter]
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

  // DnD sensors - cannot be memoized as they are hooks
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
        dispatch({
          type: 'SET_COLUMN_ORDER',
          payload: (items) => {
            const oldIndex = items.indexOf(active.id as string)
            const newIndex = items.indexOf(over?.id as string)
            return arrayMove(items, oldIndex, newIndex)
          },
        })
      }
    },
    [dispatch]
  )

  // Handle row reordering
  const handleRowDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event

      if (active.id !== over?.id && onRowReorder) {
        const activeIndex = parseInt(active.id as string)
        const overIndex = parseInt(over?.id as string)

        if (!isNaN(activeIndex) && !isNaN(overIndex)) {
          dispatch({
            type: 'SET_ROW_ORDER',
            payload: (items) => {
              const oldIndex = items.indexOf(activeIndex.toString())
              const newIndex = items.indexOf(overIndex.toString())
              return arrayMove(items, oldIndex, newIndex)
            },
          })
          onRowReorder(activeIndex, overIndex)
        }
      }
    },
    [dispatch, onRowReorder]
  )

  // Pin/unpin column
  const toggleColumnPin = useCallback((columnId: string, side: 'left' | 'right') => {
    dispatch({
      type: 'SET_PINNED_COLUMNS',
      payload: (prev) => {
        const isCurrentlyPinned = prev.left.includes(columnId) || prev.right.includes(columnId)

        if (isCurrentlyPinned) {
          return {
            left: prev.left.filter((id) => id !== columnId),
            right: prev.right.filter((id) => id !== columnId),
          }
        } else {
          if (side === 'left') {
            return {
              ...prev,
              left: [...prev.left, columnId],
            }
          } else {
            return {
              ...prev,
              right: [...prev.right, columnId],
            }
          }
        }
      },
    })
  }, [])

  const isPinnedColumn = useCallback(
    (columnId: string) => {
      const leftPinned = state.pinnedColumns?.left || []
      const rightPinned = state.pinnedColumns?.right || []
      return leftPinned.includes(columnId) || rightPinned.includes(columnId)
    },
    [state.pinnedColumns]
  )

  // View management functions
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
      debouncedSaveToLocalStorage(updatedViews)
    },
    [
      state.columnVisibility,
      state.columnOrder,
      state.pinnedColumns,
      state.sorting,
      state.columnFilters,
      table,
      state.views,
      debouncedSaveToLocalStorage,
    ]
  )

  const loadView = useCallback(
    (view: TableView) => {
      dispatch({ type: 'LOAD_VIEW', payload: view })
      table.setPageSize(view.config.pageSize)
    },
    [table]
  )

  const deleteView = useCallback(
    (viewId: string) => {
      const updatedViews = state.views.filter((v) => v.id !== viewId)
      dispatch({ type: 'SET_VIEWS', payload: updatedViews })
      debouncedSaveToLocalStorage(updatedViews)

      if (state.currentView?.id === viewId) {
        dispatch({ type: 'SET_CURRENT_VIEW', payload: null })
      }
    },
    [state.views, state.currentView, debouncedSaveToLocalStorage]
  )

  // Lazy-loaded export function
  const exportToExcel = useCallback(async () => {
    try {
      const { exportTableToExcel } = await import('./excel-exporter')
      exportTableToExcel(table, tableId)
    } catch (error) {
      console.error('Failed to export to Excel:', error)
    }
  }, [table, tableId])

  const createNewView = useCallback(() => {
    if (state.newViewName.trim()) {
      saveCurrentAsView(state.newViewName.trim())
      dispatch({ type: 'SET_NEW_VIEW_NAME', payload: '' })
      dispatch({ type: 'SET_SHOW_CREATE_VIEW', payload: false })
    }
  }, [state.newViewName, saveCurrentAsView])

  // Rest of the component remains the same but uses the optimized state and callbacks...
  // [The render JSX would be identical to the original but using the optimized state and callbacks]

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
