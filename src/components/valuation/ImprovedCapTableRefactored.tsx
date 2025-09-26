'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Plus, Save } from 'lucide-react'

// Import our extracted components and hooks
import { CapTableProps } from './cap-table/types'
import { useCapTableData } from './cap-table/hooks/use-cap-table-data'
import { useShareClassManagement } from './cap-table/hooks/use-share-class-management'
import { useOptionsManagement } from './cap-table/hooks/use-options-management'
import { createShareClassColumns } from './cap-table/columns/share-class-columns'
import { createOptionsColumns } from './cap-table/columns/options-columns'
import { calculateCapTableTotals } from './cap-table/utils/calculations'
import { SummaryCards } from './cap-table/components/SummaryCards'

// Dynamic import for OptimizedDataTable
const OptimizedDataTable = dynamic(
  () =>
    import('@/components/ui/optimized-data-table').then((mod) => ({
      default: mod.OptimizedDataTable,
    })),
  {
    loading: () => <LoadingSpinner size="md" className="p-4" />,
    ssr: false,
  }
)

export function ImprovedCapTableRefactored({ valuationId, onSave }: CapTableProps) {
  // Use our extracted hooks
  const {
    shareClasses,
    setShareClasses,
    options,
    setOptions,
    editingRows,
    setEditingRows,
    hasChanges,
    setHasChanges,
    isLoading,
    isSaving,
    saveError,
    saveCapTable,
  } = useCapTableData(valuationId, onSave)

  const {
    updateShareClass,
    validateSeniority,
    toggleRowEdit,
    addShareClass,
    deleteShareClass,
  } = useShareClassManagement(
    shareClasses,
    setShareClasses,
    setEditingRows,
    setHasChanges,
    isLoading
  )

  const { addOption, updateOption, deleteOption } = useOptionsManagement(
    options,
    setOptions,
    setEditingRows,
    setHasChanges,
    isLoading
  )

  // Calculate totals for summary
  const totals = calculateCapTableTotals(shareClasses)

  // Create column definitions
  const shareClassColumns = createShareClassColumns(
    editingRows,
    updateShareClass,
    validateSeniority,
    toggleRowEdit,
    deleteShareClass
  )

  const optionsColumns = createOptionsColumns(
    editingRows,
    updateOption,
    toggleRowEdit,
    deleteOption
  )

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <SummaryCards shareClassCount={shareClasses.length} totals={totals} />

      {/* Main Table */}
      <Card className="border-primary/20 bg-card">
        <CardHeader className="border-b border-primary/20 bg-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Cap Table Configuration</h3>
              <p className="text-sm text-muted-foreground">
                Manage share classes and their properties
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={addShareClass} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Share Class
              </Button>
              {hasChanges && (
                <Button
                  onClick={saveCapTable}
                  variant="secondary"
                  size="sm"
                  disabled={isSaving}
                  title="Save all changes to database (row edit buttons only update local state)"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
            </div>
          </div>
          {saveError && (
            <div className="mt-2 text-sm text-red-600">
              {saveError}
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <OptimizedDataTable
            key="share-classes-table"
            tableId="share-classes-table"
            columns={shareClassColumns as any}
            data={shareClasses}
            enableColumnReordering={true}
            enableColumnVisibility={true}
            enableSorting={true}
            enablePagination={false}
            enableColumnFilters={true}
            enableColumnPinning={true}
            enableRowReordering={true}
            onRowReorder={(fromIndex, toIndex) => {
              const newShareClasses = [...shareClasses]
              const [movedShareClass] = newShareClasses.splice(fromIndex, 1)
              newShareClasses.splice(toIndex, 0, movedShareClass)
              setShareClasses(newShareClasses)
              setHasChanges(true)
            }}
            className="border-0"
          />
        </CardContent>
      </Card>

      {/* Options/Warrants Table */}
      <Card className="border-primary/20 bg-card">
        <CardHeader className="border-b border-primary/20 bg-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Options & Warrants</h3>
              <p className="text-sm text-muted-foreground">
                Manage employee stock options and warrants
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={addOption}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Option/Warrant
              </Button>
              {hasChanges && (
                <Button
                  onClick={saveCapTable}
                  variant="secondary"
                  size="sm"
                  disabled={isSaving}
                  title="Save all changes to database (row edit buttons only update local state)"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {options.length > 0 ? (
            <div>
              <OptimizedDataTable
                key="options-table"
                tableId="options-table"
                columns={optionsColumns as any}
                data={options}
                enableColumnReordering={true}
                enableColumnVisibility={true}
                enableSorting={true}
                enablePagination={false}
                enableColumnFilters={true}
                enableColumnPinning={true}
                enableRowReordering={true}
                onRowReorder={(fromIndex, toIndex) => {
                  const newOptions = [...options]
                  const [movedOption] = newOptions.splice(fromIndex, 1)
                  newOptions.splice(toIndex, 0, movedOption)
                  setOptions(newOptions)
                  setHasChanges(true)
                }}
                initialState={{
                  columnVisibility: {
                    type: true,
                    numOptions: true,
                    exercisePrice: true,
                    actions: true,
                  },
                  columnOrder: ['type', 'numOptions', 'exercisePrice', 'actions'],
                }}
                className="border-0"
              />
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="mb-4 text-muted-foreground">No options or warrants added yet</p>
              <Button
                onClick={addOption}
                variant="outline"
                className="border-primary/20 hover:bg-primary/5"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add First Option/Warrant
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ImprovedCapTableRefactored