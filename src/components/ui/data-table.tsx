import React, { useState, useCallback, useEffect } from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
} from 'lucide-react';
import * as XLSX from 'xlsx';

import { Button } from './button';
import { Input } from './input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table';
import { Badge } from './badge';
import { cn } from '@/lib/utils';

// View management types
interface TableView {
  id: string;
  name: string;
  isDefault?: boolean;
  config: {
    columnVisibility: VisibilityState;
    columnOrder: string[];
    pinnedColumns: { left: string[]; right: string[] };
    sorting: SortingState;
    columnFilters: ColumnFiltersState;
    pageSize: number;
  };
  createdAt: string;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  onRowEdit?: (row: TData) => void;
  onRowDelete?: (row: TData) => void;
  onRowReorder?: (fromIndex: number, toIndex: number) => void;
  enableColumnFilters?: boolean;
  enableSorting?: boolean;
  enableColumnVisibility?: boolean;
  enableColumnReordering?: boolean;
  enableColumnPinning?: boolean;
  enableRowReordering?: boolean;
  enablePagination?: boolean;
  pageSize?: number;
  className?: string;
  tableId?: string; // For view persistence
  onStateChange?: (state: any) => void; // For external state management
  initialState?: Partial<{
    columnVisibility: VisibilityState;
    columnOrder: string[];
    pinnedColumns: { left: string[]; right: string[] };
    sorting: SortingState;
    columnFilters: ColumnFiltersState;
    pageSize: number;
  }>;
}

// Draggable header component
function DraggableColumnHeader({ 
  column, 
  children, 
  isPinned = false 
}: { 
  column: any; 
  children: React.ReactNode; 
  isPinned?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    disabled: isPinned,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      className={cn('relative', isPinned ? 'bg-muted/50' : '', isDragging ? 'z-50' : '')}
      {...attributes}
    >
      <div className="flex items-center space-x-1 w-full">
        {!isPinned && (
          <div
            {...listeners}
            className="cursor-grab hover:cursor-grabbing p-1 hover:bg-muted rounded flex-shrink-0"
          >
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </TableHead>
  );
}

// Draggable row component
function DraggableTableRow({ 
  row, 
  index, 
  children, 
  className,
  ...props 
}: { 
  row: any; 
  index: number; 
  children: React.ReactNode; 
  className?: string;
  [key: string]: any;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: index.toString(),
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

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
          className="cursor-grab hover:cursor-grabbing p-1 hover:bg-muted rounded flex items-center justify-center"
        >
          <Menu className="h-3 w-3 text-muted-foreground" />
        </div>
      </TableCell>
      {children}
    </TableRow>
  );
}

export function DataTable<TData, TValue>({
  columns: initialColumns,
  data,
  searchKey,
  searchPlaceholder = "Search...",
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
}: DataTableProps<TData, TValue>) {
  // Core table state
  const [sorting, setSorting] = useState<SortingState>(initialState?.sorting || []);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(initialState?.columnFilters || []);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(initialState?.columnVisibility || {});
  const [rowSelection, setRowSelection] = useState({});
  const [columnOrder, setColumnOrder] = useState<string[]>(
    initialState?.columnOrder || initialColumns.map((col) => col.id || '')
  );
  const [pinnedColumns, setPinnedColumns] = useState<{
    left: string[];
    right: string[];
  }>(initialState?.pinnedColumns || { left: [], right: [] });
  const [globalFilter, setGlobalFilter] = useState('');
  
  // View management state
  const [views, setViews] = useState<TableView[]>([]);
  const [currentView, setCurrentView] = useState<TableView | null>(null);
  const [showCreateView, setShowCreateView] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  
  // Settings state
  const [localEnableSorting, setLocalEnableSorting] = useState(enableSorting);
  const [localEnableFilters, setLocalEnableFilters] = useState(enableColumnFilters);
  const [localEnableReordering, setLocalEnableReordering] = useState(enableColumnReordering);
  const [localEnableRowReordering, setLocalEnableRowReordering] = useState(enableRowReordering);
  
  // Row reordering state
  const [rowOrder, setRowOrder] = useState<string[]>([]);
  
  // Initialize row order when data changes
  useEffect(() => {
    if (data.length > 0) {
      setRowOrder(data.map((_, index) => index.toString()));
    }
  }, [data]);

  // Reorder columns based on current order and pinning
  const orderedColumns = React.useMemo(() => {
    const pinned = [...pinnedColumns.left, ...pinnedColumns.right];
    const unpinned = columnOrder.filter((id) => !pinned.includes(id));
    const finalOrder = [...pinnedColumns.left, ...unpinned, ...pinnedColumns.right];
    
    return finalOrder
      .map((id) => initialColumns.find((col) => col.id === id))
      .filter(Boolean) as ColumnDef<TData, TValue>[];
  }, [initialColumns, columnOrder, pinnedColumns]);

  // Load views from localStorage on mount
  useEffect(() => {
    const savedViews = localStorage.getItem(`table-views-${tableId}`);
    if (savedViews) {
      const parsedViews = JSON.parse(savedViews);
      setViews(parsedViews);
      const defaultView = parsedViews.find((v: TableView) => v.isDefault);
      if (defaultView) {
        loadView(defaultView);
      }
    }
  }, [tableId]);

  // Notify parent of state changes
  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        sorting,
        columnFilters,
        columnVisibility,
        columnOrder,
        pinnedColumns,
        pageSize: table?.getState().pagination.pageSize || pageSize,
      });
    }
  }, [sorting, columnFilters, columnVisibility, columnOrder, pinnedColumns, onStateChange]);

  const table = useReactTable({
    data,
    columns: orderedColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: localEnableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: localEnableFilters ? getFilteredRowModel() : undefined,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: initialState?.pageSize || pageSize,
      },
    },
  });

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle column reordering
  const handleColumnDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setColumnOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over?.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Handle row reordering
  const handleRowDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && onRowReorder) {
      const activeIndex = parseInt(active.id as string);
      const overIndex = parseInt(over?.id as string);
      
      if (!isNaN(activeIndex) && !isNaN(overIndex)) {
        setRowOrder((items) => {
          const oldIndex = items.indexOf(activeIndex.toString());
          const newIndex = items.indexOf(overIndex.toString());
          return arrayMove(items, oldIndex, newIndex);
        });
        onRowReorder(activeIndex, overIndex);
      }
    }
  };

  // Pin/unpin column
  const toggleColumnPin = (columnId: string, side: 'left' | 'right') => {
    setPinnedColumns((prev) => {
      const isCurrentlyPinned = prev.left.includes(columnId) || prev.right.includes(columnId);
      
      if (isCurrentlyPinned) {
        // Unpin
        return {
          left: prev.left.filter((id) => id !== columnId),
          right: prev.right.filter((id) => id !== columnId),
        };
      } else {
        // Pin to specified side
        if (side === 'left') {
          return {
            ...prev,
            left: [...prev.left, columnId],
          };
        } else {
          return {
            ...prev,
            right: [...prev.right, columnId],
          };
        }
      }
    });
  };

  const isPinnedColumn = (columnId: string) => {
    return pinnedColumns.left.includes(columnId) || pinnedColumns.right.includes(columnId);
  };

  // View management functions
  const saveCurrentAsView = useCallback((name: string, isDefault = false) => {
    const newView: TableView = {
      id: Date.now().toString(),
      name,
      isDefault,
      config: {
        columnVisibility,
        columnOrder,
        pinnedColumns,
        sorting,
        columnFilters,
        pageSize: table.getState().pagination.pageSize,
      },
      createdAt: new Date().toISOString(),
    };

    const updatedViews = isDefault 
      ? [newView, ...views.map(v => ({ ...v, isDefault: false }))]
      : [...views, newView];
    
    setViews(updatedViews);
    setCurrentView(newView);
    localStorage.setItem(`table-views-${tableId}`, JSON.stringify(updatedViews));
  }, [columnVisibility, columnOrder, pinnedColumns, sorting, columnFilters, table, views, tableId]);

  const loadView = useCallback((view: TableView) => {
    setColumnVisibility(view.config.columnVisibility);
    setColumnOrder(view.config.columnOrder);
    setPinnedColumns(view.config.pinnedColumns);
    setSorting(view.config.sorting);
    setColumnFilters(view.config.columnFilters);
    table.setPageSize(view.config.pageSize);
    setCurrentView(view);
  }, [table]);

  const deleteView = useCallback((viewId: string) => {
    const updatedViews = views.filter(v => v.id !== viewId);
    setViews(updatedViews);
    localStorage.setItem(`table-views-${tableId}`, JSON.stringify(updatedViews));
    
    if (currentView?.id === viewId) {
      setCurrentView(null);
    }
  }, [views, currentView, tableId]);

  // Export functions
  const exportToExcel = useCallback(() => {
    const visibleColumns = table.getVisibleLeafColumns();
    const rows = table.getRowModel().rows;
    
    // Prepare data for export
    const exportData = rows.map(row => {
      const rowData: any = {};
      visibleColumns.forEach(column => {
        const cell = row.getVisibleCells().find(cell => cell.column.id === column.id);
        if (cell) {
          // Get the raw value or rendered content
          const value = cell.getValue();
          rowData[column.id] = value;
        }
      });
      return rowData;
    });

    // Create workbook
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    
    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${tableId}-export-${timestamp}.xlsx`;
    
    // Save file
    XLSX.writeFile(wb, filename);
  }, [table, tableId]);

  const createNewView = useCallback(() => {
    if (newViewName.trim()) {
      saveCurrentAsView(newViewName.trim());
      setNewViewName('');
      setShowCreateView(false);
    }
  }, [newViewName, saveCurrentAsView]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* View Management */}
          <div className="flex items-center space-x-1">
            {/* Current View Indicator */}
            {currentView && (
              <Badge variant="outline" className="gap-1">
                <BookmarkPlus className="h-3 w-3" />
                {currentView.name}
                {currentView.isDefault && ' (Default)'}
              </Badge>
            )}
            
            {/* View Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <BookmarkPlus className="h-4 w-4 mr-2" />
                  Views
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[250px]">
                <DropdownMenuLabel>Saved Views</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {views.length > 0 ? (
                  views.map((view) => (
                    <div key={view.id} className="flex items-center justify-between px-2 py-1">
                      <DropdownMenuItem
                        className="flex-1 cursor-pointer"
                        onClick={() => loadView(view)}
                      >
                        <div className="flex items-center space-x-2">
                          <span className={currentView?.id === view.id ? 'font-medium' : ''}>
                            {view.name}
                          </span>
                          {view.isDefault && (
                            <Badge variant="secondary" className="text-xs">Default</Badge>
                          )}
                        </div>
                      </DropdownMenuItem>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteView(view.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="px-2 py-1 text-sm text-muted-foreground">
                    No saved views
                  </div>
                )}
                <DropdownMenuSeparator />
                <div className="p-2">
                  {showCreateView ? (
                    <div className="space-y-2">
                      <Input
                        placeholder="View name"
                        value={newViewName}
                        onChange={(e) => setNewViewName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && createNewView()}
                        className="h-8"
                      />
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          className="h-6 text-xs"
                          onClick={createNewView}
                          disabled={!newViewName.trim()}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-xs"
                          onClick={() => {
                            setShowCreateView(false);
                            setNewViewName('');
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
                      className="w-full h-8"
                      onClick={() => setShowCreateView(true)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Create View
                    </Button>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Global Search */}
          {localEnableFilters && (
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={globalFilter ?? ''}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="pl-8 max-w-sm"
              />
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Export */}
          <Button variant="outline" size="sm" onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          {/* Column Visibility */}
          {enableColumnVisibility && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Columns
                  <ChevronDown className="h-4 w-4 ml-2" />
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
                        <div className="flex items-center justify-between w-full">
                          <span>{column.id}</span>
                          {isPinnedColumn(column.id) && (
                            <Pin className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      </DropdownMenuCheckboxItem>
                    );
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
                checked={localEnableSorting}
                onCheckedChange={(checked) => setLocalEnableSorting(!!checked)}
              >
                Sorting
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={localEnableFilters}
                onCheckedChange={(checked) => setLocalEnableFilters(!!checked)}
              >
                Filtering
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={localEnableReordering}
                onCheckedChange={(checked) => setLocalEnableReordering(!!checked)}
              >
                Column Reordering
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={localEnableRowReordering}
                onCheckedChange={(checked) => setLocalEnableRowReordering(!!checked)}
                disabled={!onRowReorder}
              >
                Row Reordering
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => saveCurrentAsView('Default View', true)}>
                <Save className="h-3 w-3 mr-2" />
                Save as Default
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Active Filters */}
      {columnFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {columnFilters.map((filter) => (
            <Badge key={filter.id} variant="secondary" className="gap-1">
              {filter.id}: {filter.value as string}
              <button
                onClick={() => {
                  setColumnFilters((prev) => prev.filter((f) => f.id !== filter.id));
                }}
                className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
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
            if (localEnableReordering) {
              handleColumnDragEnd(event);
            }
            if (localEnableRowReordering && onRowReorder) {
              handleRowDragEnd(event);
            }
          }}
        >
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {localEnableReordering ? (
                    <SortableContext
                      items={columnOrder}
                      strategy={horizontalListSortingStrategy}
                    >
                      {localEnableRowReordering && onRowReorder && (
                        <TableHead className="w-8 p-2">
                          <div className="w-6 h-6 flex items-center justify-center">
                            {/* Drag handle column header */}
                          </div>
                        </TableHead>
                      )}
                      {headerGroup.headers.map((header) => {
                        const isPinned = isPinnedColumn(header.column.id);
                        return (
                          <DraggableColumnHeader
                            key={header.id}
                            column={header.column}
                            isPinned={isPinned}
                          >
                            <div className="flex items-center space-x-1 min-w-0 flex-1">
                              {header.isPlaceholder ? null : (
                                <>
                                  {/* Column Header Content */}
                                  <div className="flex-1 min-w-0">
                                    {localEnableSorting && header.column.getCanSort() ? (
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
                                              onClick={() => toggleColumnPin(header.column.id, 'left')}
                                            >
                                              <Pin className="h-3 w-3 mr-2" />
                                              Pin Left
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={() => toggleColumnPin(header.column.id, 'right')}
                                            >
                                              <Pin className="h-3 w-3 mr-2" />
                                              Pin Right
                                            </DropdownMenuItem>
                                          </>
                                        ) : (
                                          <DropdownMenuItem
                                            onClick={() => toggleColumnPin(header.column.id, 'left')}
                                          >
                                            <PinOff className="h-3 w-3 mr-2" />
                                            Unpin
                                          </DropdownMenuItem>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={() => header.column.toggleVisibility()}
                                        >
                                          <EyeOff className="h-3 w-3 mr-2" />
                                          Hide Column
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </>
                              )}
                            </div>
                          </DraggableColumnHeader>
                        );
                      })}
                    </SortableContext>
                  ) : (
                    <>
                      {localEnableRowReordering && onRowReorder && (
                        <TableHead className="w-8 p-2">
                          <div className="w-6 h-6 flex items-center justify-center">
                            {/* Drag handle column header */}
                          </div>
                        </TableHead>
                      )}
                      {headerGroup.headers.map((header) => {
                        const isPinned = isPinnedColumn(header.column.id);
                        return (
                          <TableHead
                            key={header.id}
                            className={cn('relative', isPinned ? 'bg-muted/50' : '')}
                          >
                            <div className="flex items-center space-x-1 min-w-0 flex-1">
                              {header.isPlaceholder ? null : (
                                <>
                                  {/* Column Header Content */}
                                  <div className="flex-1 min-w-0">
                                    {localEnableSorting && header.column.getCanSort() ? (
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
                                              onClick={() => toggleColumnPin(header.column.id, 'left')}
                                            >
                                              <Pin className="h-3 w-3 mr-2" />
                                              Pin Left
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={() => toggleColumnPin(header.column.id, 'right')}
                                            >
                                              <Pin className="h-3 w-3 mr-2" />
                                              Pin Right
                                            </DropdownMenuItem>
                                          </>
                                        ) : (
                                          <DropdownMenuItem
                                            onClick={() => toggleColumnPin(header.column.id, 'left')}
                                          >
                                            <PinOff className="h-3 w-3 mr-2" />
                                            Unpin
                                          </DropdownMenuItem>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={() => header.column.toggleVisibility()}
                                        >
                                          <EyeOff className="h-3 w-3 mr-2" />
                                          Hide Column
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </>
                              )}
                            </div>
                          </TableHead>
                        );
                      })}
                    </>
                  )}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                localEnableRowReordering && onRowReorder ? (
                  <SortableContext
                    items={table.getRowModel().rows.map((_, index) => index.toString())}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.map((row, index) => (
                      <DraggableTableRow
                        key={row.id}
                        row={row}
                        index={index}
                        data-state={row.getIsSelected() && "selected"}
                        className="hover:bg-muted/50"
                      >
                        {row.getVisibleCells().map((cell) => {
                          const isPinned = isPinnedColumn(cell.column.id);
                          return (
                            <TableCell 
                              key={cell.id}
                              className={isPinned ? 'bg-muted/30' : ''}
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          );
                        })}
                      </DraggableTableRow>
                    ))}
                  </SortableContext>
                ) : (
                  table.getRowModel().rows.map((row, index) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className="hover:bg-muted/50"
                    >
                      {localEnableRowReordering && onRowReorder && (
                        <TableCell className="w-8 p-2">
                          <div className="w-6 h-6 flex items-center justify-center">
                            {/* Placeholder for alignment */}
                          </div>
                        </TableCell>
                      )}
                      {row.getVisibleCells().map((cell) => {
                        const isPinned = isPinnedColumn(cell.column.id);
                        return (
                          <TableCell 
                            key={cell.id}
                            className={isPinned ? 'bg-muted/30' : ''}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                )
              ) : (
                <TableRow>
                  <TableCell 
                    colSpan={orderedColumns.length + (localEnableRowReordering && onRowReorder ? 1 : 0)} 
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
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Rows per page</p>
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => {
                  table.setPageSize(Number(e.target.value));
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
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
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
  );
}