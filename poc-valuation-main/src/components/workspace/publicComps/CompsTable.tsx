import { useState } from 'react'
import { CompanyData } from '@/hooks/usePublicCompsData'
import { useCompsTableColumns } from './useCompsTableColumns'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface CompsTableProps {
  comps: CompanyData[]
  onRemoveComp: (ticker: string) => void
  onUpdateComp: (updatedComp: CompanyData) => void
  onToggleIncludeInStats: (ticker: string, include: boolean) => void
  columnsConfig: Record<string, boolean>
}

// Define column groups for tabbed navigation
const COLUMN_GROUPS = {
  company: ['include', 'actions', 'date', 'source'],
  financials: ['marketCap', 'netDebt', 'enterpriseValue', 'revenue', 'ebitda', 'ebit', 'netIncome'],
  valuation: ['evToRevenue', 'evToEbitda', 'evToEbit', 'peRatio', 'pToBookValue'],
  performance: ['revenueGrowth', 'ebitdaMargin'],
}

export function CompsTable({
  comps,
  onRemoveComp,
  onUpdateComp,
  onToggleIncludeInStats,
  columnsConfig,
}: CompsTableProps) {
  const [tableState, setTableState] = useState({
    editingCell: null,
    editValue: '',
  })
  const [activeTab, setActiveTab] = useState<string>('company')

  const handleCellClick = (comp: CompanyData, field: keyof CompanyData) => {
    // Only allow editing numeric fields
    if (typeof comp[field] === 'number') {
      setTableState({
        editingCell: { ticker: comp.ticker, field },
        editValue: comp[field].toString(),
      })
    }
  }

  const handleCellBlur = () => {
    if (tableState.editingCell) {
      const comp = comps.find((c) => c.ticker === tableState.editingCell?.ticker)
      if (comp && tableState.editingCell) {
        const updatedComp = {
          ...comp,
          [tableState.editingCell.field]: parseFloat(tableState.editValue) || 0,
          isEdited: true,
        }
        onUpdateComp(updatedComp)
      }
      setTableState({ editingCell: null, editValue: '' })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellBlur()
    }
  }

  const setEditValue = (value: string) => {
    setTableState((prev) => ({ ...prev, editValue: value }))
  }

  // Get all columns
  const allColumns = useCompsTableColumns({
    columnsConfig,
    onRemoveComp,
    onToggleIncludeInStats,
    tableState,
    handleCellClick,
    handleCellBlur,
    handleKeyDown,
    setEditValue,
  })

  // Get the fixed columns (ticker and name) that should appear on all tabs
  const fixedColumns = allColumns.filter((column) => ['ticker', 'name'].includes(column.id))

  // Filter columns based on active tab (excluding fixed columns that will be shown separately)
  const visibleColumns = allColumns.filter((column) =>
    COLUMN_GROUPS[activeTab as keyof typeof COLUMN_GROUPS]?.includes(column.id)
  )

  // Combined columns with fixed columns first, then tab-specific columns
  const combinedColumns = [...fixedColumns, ...visibleColumns]

  // No data message component
  const NoDataMessage = () => (
    <div className="flex items-center justify-center py-8 text-muted-foreground">
      No companies added yet. Add your first company above.
    </div>
  )

  return (
    <div className="flex flex-col rounded-md border">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b px-4 pt-2">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="company">Company Info</TabsTrigger>
            <TabsTrigger value="financials">Financial Data</TabsTrigger>
            <TabsTrigger value="valuation">Valuation Metrics</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>
        </div>

        <div className="p-1">
          <TabsContent value={activeTab} className="mt-0">
            <div className="max-h-[550px] overflow-y-auto">
              {comps.length === 0 ? (
                <NoDataMessage />
              ) : (
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-background">
                    <TableRow>
                      {combinedColumns.map((column) => (
                        <TableHead
                          key={column.id}
                          className={`${column.isNumeric ? 'text-right' : ''}`}
                        >
                          {column.header}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comps.map((comp) => (
                      <TableRow key={comp.ticker}>
                        {combinedColumns.map((column) => (
                          <TableCell
                            key={`${comp.ticker}-${column.id}`}
                            className={`${column.isNumeric ? 'text-right' : ''}`}
                          >
                            {column.cell
                              ? column.cell(comp)
                              : column.accessorKey
                                ? comp[column.accessorKey]
                                : null}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
