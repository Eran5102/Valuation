import { TableState, TableAction } from './types'

export function tableReducer(state: TableState, action: TableAction): TableState {
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