'use client'

import React, { useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Plus, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

// Import types
import { CapTableProps } from './cap-table/types'

// Import unified hook
import { useUnifiedCapTable } from './cap-table/hooks/useUnifiedCapTable'

// Import column definitions
import { createShareClassColumnsV2 } from './cap-table/v2/columns/ShareClassColumnsV2'
import { createOptionsColumns } from './cap-table/columns/options-columns'

// Import calculations
import { calculateCapTableTotals } from './cap-table/utils/calculations'

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

export function UnifiedCapTable({ valuationId, onSave }: CapTableProps) {
  // Use unified hook for all cap table data
  const {
    // Share Classes
    shareClasses,
    updateShareClass,
    addShareClass,
    deleteShareClass,
    handleShareClassReorder,

    // Options
    options,
    updateOption,
    addOption,
    deleteOption,

    // Editing state
    editingShareRows,
    toggleShareRowEdit,
    editingOptionRows,
    toggleOptionRowEdit,

    // Save state
    hasChanges,
    isLoading,
    isSaving,
    saveError,
    lastSaveTime,
  } = useUnifiedCapTable(valuationId, onSave)

  // Create column definitions for share classes
  const shareClassColumns = useMemo(
    () =>
      createShareClassColumnsV2(
        editingShareRows,
        updateShareClass,
        toggleShareRowEdit,
        deleteShareClass
      ),
    [editingShareRows, updateShareClass, toggleShareRowEdit, deleteShareClass]
  )

  // Create column definitions for options
  const optionsColumns = useMemo(
    () => createOptionsColumns(editingOptionRows, updateOption, toggleOptionRowEdit, deleteOption),
    [editingOptionRows, updateOption, toggleOptionRowEdit, deleteOption]
  )

  // Calculate totals for share classes
  const totals = useMemo(() => calculateCapTableTotals(shareClasses), [shareClasses])

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Share Classes Table */}
      <Card className="border-primary/20 bg-card">
        <CardHeader className="border-primary/20 bg-primary/5 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Share Classes</h3>
              <p className="text-sm text-muted-foreground">
                Manage share classes and their properties
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Save indicator */}
              {(hasChanges || isSaving) && (
                <div className="flex items-center gap-2">
                  {isSaving ? (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <LoadingSpinner size="sm" />
                      <span>Saving to database...</span>
                    </div>
                  ) : hasChanges ? (
                    <div className="text-sm text-amber-600">Unsaved changes (auto-save in 3s)</div>
                  ) : null}
                </div>
              )}

              {/* Success indicator */}
              {!hasChanges && !isSaving && lastSaveTime && (
                <div className="text-sm text-green-600">✓ All changes saved</div>
              )}

              {/* Add share class button */}
              <Button
                onClick={addShareClass}
                disabled={isLoading}
                className="hover:bg-primary/90 bg-primary text-primary-foreground"
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Share Class
              </Button>
            </div>
          </div>

          {/* Error display */}
          {saveError && (
            <div className="bg-destructive/10 mt-2 flex items-center gap-2 rounded-md p-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{saveError}</span>
            </div>
          )}

          {/* Summary totals */}
          <div className="mt-4 grid grid-cols-4 gap-4">
            <div className="bg-muted/50 rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Total Shares</p>
              <p className="text-lg font-semibold">{totals.totalShares.toLocaleString()}</p>
            </div>
            <div className="bg-muted/50 rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Total Invested</p>
              <p className="text-lg font-semibold">{formatCurrency(totals.totalInvested)}</p>
            </div>
            <div className="bg-muted/50 rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Total LP</p>
              <p className="text-lg font-semibold">{formatCurrency(totals.totalLP)}</p>
            </div>
            <div className="bg-muted/50 rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Total Dividends</p>
              <p className="text-lg font-semibold">{formatCurrency(totals.totalDividends)}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <OptimizedDataTable
            key={`share-classes-${valuationId}`}
            tableId="unified-share-classes-table"
            columns={shareClassColumns as any}
            data={shareClasses}
            enableColumnReordering={true}
            enableColumnVisibility={true}
            enableSorting={true}
            enablePagination={false}
            enableColumnFilters={true}
            enableColumnPinning={true}
            enableRowReordering={true}
            onRowReorder={handleShareClassReorder}
            initialState={{
              columnOrder: [
                'actions',
                'shareType',
                'name',
                'roundDate',
                'sharesOutstanding',
                'pricePerShare',
                'amountInvested',
                'lpMultiple',
                'preferenceType',
                'seniority',
                'conversionRatio',
                'dividendsDeclared',
                'dividendsRate',
              ],
            }}
          />
        </CardContent>
      </Card>

      {/* Options/Warrants Table */}
      <Card className="border-primary/20 bg-card">
        <CardHeader className="border-primary/20 bg-primary/5 border-b">
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
                className="hover:bg-primary/90 bg-primary text-primary-foreground"
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Option/Warrant
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <OptimizedDataTable
            key={`options-${valuationId}`}
            tableId="unified-options-table"
            columns={optionsColumns as any}
            data={options}
            enableColumnReordering={true}
            enableColumnVisibility={true}
            enableSorting={true}
            enablePagination={false}
            enableColumnFilters={true}
            enableColumnPinning={true}
            enableRowReordering={false}
            className="border-0"
          />
        </CardContent>
      </Card>
    </div>
  )
}
