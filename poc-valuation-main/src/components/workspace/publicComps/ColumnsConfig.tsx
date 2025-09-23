import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Settings } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ColumnConfigOption {
  id: string
  label: string
  enabled: boolean
  includeInValuation: boolean
}

interface ColumnsConfigProps {
  onConfigChange: (config: Record<string, boolean>) => void
  initialConfig: Record<string, boolean>
}

export function ColumnsConfig({ onConfigChange, initialConfig }: ColumnsConfigProps) {
  const [columnsConfig, setColumnsConfig] = useState<ColumnConfigOption[]>([
    {
      id: 'marketCap',
      label: 'Market Cap ($M)',
      enabled: initialConfig.marketCap,
      includeInValuation: true,
    },
    {
      id: 'netDebt',
      label: 'Net Debt ($M)',
      enabled: initialConfig.netDebt,
      includeInValuation: true,
    },
    {
      id: 'enterpriseValue',
      label: 'Enterprise Value ($M)',
      enabled: initialConfig.enterpriseValue,
      includeInValuation: true,
    },
    {
      id: 'revenue',
      label: 'Revenue ($M)',
      enabled: initialConfig.revenue,
      includeInValuation: true,
    },
    { id: 'ebitda', label: 'EBITDA ($M)', enabled: initialConfig.ebitda, includeInValuation: true },
    { id: 'ebit', label: 'EBIT ($M)', enabled: initialConfig.ebit, includeInValuation: true },
    {
      id: 'netIncome',
      label: 'Net Income ($M)',
      enabled: initialConfig.netIncome,
      includeInValuation: true,
    },
    {
      id: 'evToRevenue',
      label: 'EV/Revenue',
      enabled: initialConfig.evToRevenue,
      includeInValuation: true,
    },
    {
      id: 'evToEbitda',
      label: 'EV/EBITDA',
      enabled: initialConfig.evToEbitda,
      includeInValuation: true,
    },
    { id: 'evToEbit', label: 'EV/EBIT', enabled: initialConfig.evToEbit, includeInValuation: true },
    { id: 'peRatio', label: 'P/E Ratio', enabled: initialConfig.peRatio, includeInValuation: true },
    {
      id: 'pToBookValue',
      label: 'P/Book Value',
      enabled: initialConfig.pToBookValue,
      includeInValuation: true,
    },
    {
      id: 'revenueGrowth',
      label: 'Revenue Growth (%)',
      enabled: initialConfig.revenueGrowth,
      includeInValuation: true,
    },
    {
      id: 'ebitdaMargin',
      label: 'EBITDA Margin (%)',
      enabled: initialConfig.ebitdaMargin,
      includeInValuation: true,
    },
  ])

  const [open, setOpen] = useState(false)

  const handleToggleColumn = (id: string) => {
    setColumnsConfig((prev) =>
      prev.map((col) => (col.id === id ? { ...col, enabled: !col.enabled } : col))
    )
  }

  const handleToggleValuation = (id: string) => {
    setColumnsConfig((prev) =>
      prev.map((col) =>
        col.id === id ? { ...col, includeInValuation: !col.includeInValuation } : col
      )
    )
  }

  const handleApply = () => {
    const config = columnsConfig.reduce(
      (acc, col) => {
        acc[col.id] = col.enabled
        return acc
      },
      {} as Record<string, boolean>
    )

    // Pass the include in valuation configuration as additional info
    const valuationConfig = columnsConfig.reduce(
      (acc, col) => {
        if (col.includeInValuation) {
          acc[col.id] = true
        }
        return acc
      },
      {} as Record<string, boolean>
    )

    // Store valuation config in localStorage for persistence
    localStorage.setItem('compsValuationConfig', JSON.stringify(valuationConfig))

    onConfigChange(config)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Configure Columns
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Configure Table Columns</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            <div className="grid grid-cols-[1fr,180px] gap-4 border-b pb-2 font-medium">
              <div>Column Name</div>
              <div className="text-center">Include in Statistics</div>
            </div>
            {columnsConfig.map((column) => (
              <div
                key={column.id}
                className="grid grid-cols-[1fr,180px] items-center gap-4 border-b border-gray-100 py-2"
              >
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`column-${column.id}`}
                    checked={column.enabled}
                    onCheckedChange={() => handleToggleColumn(column.id)}
                  />
                  <Label htmlFor={`column-${column.id}`} className="cursor-pointer">
                    {column.label}
                  </Label>
                </div>
                <div className="flex items-center justify-center">
                  <Checkbox
                    id={`valuation-${column.id}`}
                    checked={column.includeInValuation}
                    onCheckedChange={() => handleToggleValuation(column.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="mt-4 flex justify-end border-t pt-4">
          <Button onClick={handleApply} className="bg-teal hover:bg-teal/90">
            Apply Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
