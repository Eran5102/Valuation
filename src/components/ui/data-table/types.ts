import { ColumnDef, ColumnFiltersState, SortingState, VisibilityState, RowSelectionState } from '@tanstack/react-table'

// View management types
export interface TableView {
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
export interface TableState {
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

export type TableAction =
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

export interface OptimizedDataTableProps<TData, TValue> {
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
  enableRowSelection?: boolean
  pageSize?: number
  className?: string
  tableId?: string
  selectedRows?: Set<string>
  onRowSelectionChange?: (selection: string[]) => void
  getRowId?: (row: TData) => string
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