import React from 'react'
import { TableColumn } from '@/components/shared/DataTable'
import { IncludeCheckbox } from './IncludeCheckbox'
import { CompanyActions } from './CompanyActions'
import { SourceDisplay } from './SourceDisplay'
import { EditableCell } from './EditableCell'
import { CompanyData } from '@/hooks/usePublicCompsData'

export interface CompsTableState {
  editingCell: { ticker: string; field: keyof CompanyData } | null
  editValue: string
}

interface UseCompsTableColumnsProps {
  columnsConfig: Record<string, boolean>
  onRemoveComp: (ticker: string) => void
  onToggleIncludeInStats: (ticker: string, include: boolean) => void
  tableState: CompsTableState
  handleCellClick: (comp: CompanyData, field: keyof CompanyData) => void
  handleCellBlur: () => void
  handleKeyDown: (e: React.KeyboardEvent) => void
  setEditValue: (value: string) => void
}

export function useCompsTableColumns({
  columnsConfig,
  onRemoveComp,
  onToggleIncludeInStats,
  tableState,
  handleCellClick,
  handleCellBlur,
  handleKeyDown,
  setEditValue,
}: UseCompsTableColumnsProps) {
  // Define base columns that are always displayed
  const baseColumns: TableColumn<CompanyData>[] = [
    {
      id: 'include',
      header: 'Include',
      cell: (item) => (
        <IncludeCheckbox
          checked={item.includeInStats}
          onChange={(checked) => onToggleIncludeInStats(item.ticker, checked)}
        />
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (item) => <CompanyActions onRemove={() => onRemoveComp(item.ticker)} />,
    },
    {
      id: 'ticker',
      header: 'Ticker',
      accessorKey: 'ticker',
      className: 'font-medium',
    },
    {
      id: 'name',
      header: 'Company Name',
      accessorKey: 'name',
    },
    {
      id: 'date',
      header: 'Date',
      accessorKey: 'date',
    },
    {
      id: 'source',
      header: 'Source',
      cell: (item) => <SourceDisplay source={item.source} />,
    },
  ]

  // Define columns that can be toggled based on columnsConfig
  const configColumns: TableColumn<CompanyData>[] = [
    {
      id: 'marketCap',
      header: 'Market Cap ($M)',
      cell: (item) => (
        <EditableCell
          value={item.marketCap}
          isEdited={item.isEdited}
          isEditing={
            tableState.editingCell?.ticker === item.ticker &&
            tableState.editingCell?.field === 'marketCap'
          }
          editValue={tableState.editValue}
          onEdit={setEditValue}
          onBlur={handleCellBlur}
          onKeyDown={handleKeyDown}
          field="marketCap"
          suffix=""
        />
      ),
      isNumeric: true,
    },
    {
      id: 'netDebt',
      header: 'Net Debt ($M)',
      cell: (item) => (
        <EditableCell
          value={item.netDebt}
          isEdited={item.isEdited}
          isEditing={
            tableState.editingCell?.ticker === item.ticker &&
            tableState.editingCell?.field === 'netDebt'
          }
          editValue={tableState.editValue}
          onEdit={setEditValue}
          onBlur={handleCellBlur}
          onKeyDown={handleKeyDown}
          field="netDebt"
          suffix=""
        />
      ),
      isNumeric: true,
    },
    {
      id: 'enterpriseValue',
      header: 'Enterprise Value ($M)',
      cell: (item) => (
        <EditableCell
          value={item.enterpriseValue}
          isEdited={item.isEdited}
          isEditing={
            tableState.editingCell?.ticker === item.ticker &&
            tableState.editingCell?.field === 'enterpriseValue'
          }
          editValue={tableState.editValue}
          onEdit={setEditValue}
          onBlur={handleCellBlur}
          onKeyDown={handleKeyDown}
          field="enterpriseValue"
          suffix=""
        />
      ),
      isNumeric: true,
    },
    {
      id: 'revenue',
      header: 'Revenue ($M)',
      cell: (item) => (
        <EditableCell
          value={item.revenue}
          isEdited={item.isEdited}
          isEditing={
            tableState.editingCell?.ticker === item.ticker &&
            tableState.editingCell?.field === 'revenue'
          }
          editValue={tableState.editValue}
          onEdit={setEditValue}
          onBlur={handleCellBlur}
          onKeyDown={handleKeyDown}
          field="revenue"
          suffix=""
        />
      ),
      isNumeric: true,
    },
    {
      id: 'ebitda',
      header: 'EBITDA ($M)',
      cell: (item) => (
        <EditableCell
          value={item.ebitda}
          isEdited={item.isEdited}
          isEditing={
            tableState.editingCell?.ticker === item.ticker &&
            tableState.editingCell?.field === 'ebitda'
          }
          editValue={tableState.editValue}
          onEdit={setEditValue}
          onBlur={handleCellBlur}
          onKeyDown={handleKeyDown}
          field="ebitda"
          suffix=""
        />
      ),
      isNumeric: true,
    },
    {
      id: 'ebit',
      header: 'EBIT ($M)',
      cell: (item) => (
        <EditableCell
          value={item.ebit}
          isEdited={item.isEdited}
          isEditing={
            tableState.editingCell?.ticker === item.ticker &&
            tableState.editingCell?.field === 'ebit'
          }
          editValue={tableState.editValue}
          onEdit={setEditValue}
          onBlur={handleCellBlur}
          onKeyDown={handleKeyDown}
          field="ebit"
          suffix=""
        />
      ),
      isNumeric: true,
    },
    {
      id: 'netIncome',
      header: 'Net Income ($M)',
      cell: (item) => (
        <EditableCell
          value={item.netIncome}
          isEdited={item.isEdited}
          isEditing={
            tableState.editingCell?.ticker === item.ticker &&
            tableState.editingCell?.field === 'netIncome'
          }
          editValue={tableState.editValue}
          onEdit={setEditValue}
          onBlur={handleCellBlur}
          onKeyDown={handleKeyDown}
          field="netIncome"
          suffix=""
        />
      ),
      isNumeric: true,
    },
    {
      id: 'evToRevenue',
      header: 'EV/Revenue',
      cell: (item) => (
        <EditableCell
          value={item.evToRevenue}
          isEdited={item.isEdited}
          isEditing={
            tableState.editingCell?.ticker === item.ticker &&
            tableState.editingCell?.field === 'evToRevenue'
          }
          editValue={tableState.editValue}
          onEdit={setEditValue}
          onBlur={handleCellBlur}
          onKeyDown={handleKeyDown}
          field="evToRevenue"
          suffix=""
        />
      ),
      isNumeric: true,
    },
    {
      id: 'evToEbitda',
      header: 'EV/EBITDA',
      cell: (item) => (
        <EditableCell
          value={item.evToEbitda}
          isEdited={item.isEdited}
          isEditing={
            tableState.editingCell?.ticker === item.ticker &&
            tableState.editingCell?.field === 'evToEbitda'
          }
          editValue={tableState.editValue}
          onEdit={setEditValue}
          onBlur={handleCellBlur}
          onKeyDown={handleKeyDown}
          field="evToEbitda"
          suffix=""
        />
      ),
      isNumeric: true,
    },
    {
      id: 'evToEbit',
      header: 'EV/EBIT',
      cell: (item) => (
        <EditableCell
          value={item.evToEbit}
          isEdited={item.isEdited}
          isEditing={
            tableState.editingCell?.ticker === item.ticker &&
            tableState.editingCell?.field === 'evToEbit'
          }
          editValue={tableState.editValue}
          onEdit={setEditValue}
          onBlur={handleCellBlur}
          onKeyDown={handleKeyDown}
          field="evToEbit"
          suffix=""
        />
      ),
      isNumeric: true,
    },
    {
      id: 'peRatio',
      header: 'P/E Ratio',
      cell: (item) => (
        <EditableCell
          value={item.peRatio}
          isEdited={item.isEdited}
          isEditing={
            tableState.editingCell?.ticker === item.ticker &&
            tableState.editingCell?.field === 'peRatio'
          }
          editValue={tableState.editValue}
          onEdit={setEditValue}
          onBlur={handleCellBlur}
          onKeyDown={handleKeyDown}
          field="peRatio"
          suffix=""
        />
      ),
      isNumeric: true,
    },
    {
      id: 'pToBookValue',
      header: 'P/Book Value',
      cell: (item) => (
        <EditableCell
          value={item.pToBookValue}
          isEdited={item.isEdited}
          isEditing={
            tableState.editingCell?.ticker === item.ticker &&
            tableState.editingCell?.field === 'pToBookValue'
          }
          editValue={tableState.editValue}
          onEdit={setEditValue}
          onBlur={handleCellBlur}
          onKeyDown={handleKeyDown}
          field="pToBookValue"
          suffix=""
        />
      ),
      isNumeric: true,
    },
    {
      id: 'revenueGrowth',
      header: 'Revenue Growth (%)',
      cell: (item) => (
        <EditableCell
          value={item.revenueGrowth}
          isEdited={item.isEdited}
          isEditing={
            tableState.editingCell?.ticker === item.ticker &&
            tableState.editingCell?.field === 'revenueGrowth'
          }
          editValue={tableState.editValue}
          onEdit={setEditValue}
          onBlur={handleCellBlur}
          onKeyDown={handleKeyDown}
          field="revenueGrowth"
          suffix=""
        />
      ),
      isNumeric: true,
    },
    {
      id: 'ebitdaMargin',
      header: 'EBITDA Margin (%)',
      cell: (item) => (
        <EditableCell
          value={item.ebitdaMargin}
          isEdited={item.isEdited}
          isEditing={
            tableState.editingCell?.ticker === item.ticker &&
            tableState.editingCell?.field === 'ebitdaMargin'
          }
          editValue={tableState.editValue}
          onEdit={setEditValue}
          onBlur={handleCellBlur}
          onKeyDown={handleKeyDown}
          field="ebitdaMargin"
          suffix=""
        />
      ),
      isNumeric: true,
    },
  ].filter((col) => columnsConfig[col.id])

  return [...baseColumns, ...configColumns]
}
