import React from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, SortDesc } from 'lucide-react'
import { ColumnsConfig } from '@/components/workspace/publicComps/ColumnsConfig'
import { CompanyData } from '@/hooks/usePublicCompsData'

interface CompsFilterProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  onSortFieldChange: (field: keyof CompanyData | '') => void
  columnsConfig: Record<string, boolean>
  onColumnsConfigChange: (config: Record<string, boolean>) => void
}

export function CompsFilter({
  searchTerm,
  onSearchChange,
  onSortFieldChange,
  columnsConfig,
  onColumnsConfigChange,
}: CompsFilterProps) {
  return (
    <div className="flex flex-none flex-wrap items-center justify-between gap-4 border-b pb-4">
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search companies..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-[300px]"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ColumnsConfig onConfigChange={onColumnsConfigChange} initialConfig={columnsConfig} />

        <Select onValueChange={(value: string) => onSortFieldChange(value as keyof CompanyData)}>
          <SelectTrigger className="w-[180px]">
            <SortDesc className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ticker">Ticker</SelectItem>
            <SelectItem value="name">Company Name</SelectItem>
            <SelectItem value="marketCap">Market Cap</SelectItem>
            <SelectItem value="revenue">Revenue</SelectItem>
            <SelectItem value="ebitda">EBITDA</SelectItem>
            <SelectItem value="evToRevenue">EV/Revenue</SelectItem>
            <SelectItem value="evToEbitda">EV/EBITDA</SelectItem>
            <SelectItem value="peRatio">P/E Ratio</SelectItem>
            <SelectItem value="revenueGrowth">Revenue Growth</SelectItem>
            <SelectItem value="ebitdaMargin">EBITDA Margin</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
