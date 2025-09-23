import React, { useState } from 'react'
import { CompsFilter } from './CompsFilter'
import { CompsTable } from './CompsTable'
import { CompsStatistics } from './CompsStatistics'
import { CompanyData } from '@/hooks/usePublicCompsData'
import { TabsContent, TabsList, TabsTrigger, Tabs } from '@/components/ui/tabs'

interface TargetMetrics {
  name: string
  evToRevenue?: number
  evToEbitda?: number
  evToEbit?: number
  peRatio?: number
  pToBookValue?: number
  revenueGrowth?: number
  ebitdaMargin?: number
  [key: string]: string | number | undefined
}

interface ComparablesAnalysisTabProps {
  filteredComps: CompanyData[]
  columnsConfig: Record<string, boolean>
  searchTerm: string
  onSearchChange: (value: string) => void
  onSortFieldChange: (field: keyof CompanyData | '') => void
  onColumnsConfigChange: (config: Record<string, boolean>) => void
  onRemoveComp: (ticker: string) => void
  onUpdateComp: (comp: CompanyData) => void
  onToggleIncludeInStats: (ticker: string, include: boolean) => void
  targetMetrics?: TargetMetrics
}

export function ComparablesAnalysisTab({
  filteredComps,
  columnsConfig,
  searchTerm,
  onSearchChange,
  onSortFieldChange,
  onColumnsConfigChange,
  onRemoveComp,
  onUpdateComp,
  onToggleIncludeInStats,
  targetMetrics,
}: ComparablesAnalysisTabProps) {
  return (
    <div className="flex flex-col space-y-4">
      <CompsFilter
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        onSortFieldChange={onSortFieldChange}
        columnsConfig={columnsConfig}
        onColumnsConfigChange={onColumnsConfigChange}
      />

      <div className="w-full">
        <CompsTable
          comps={filteredComps}
          onRemoveComp={onRemoveComp}
          onUpdateComp={onUpdateComp}
          onToggleIncludeInStats={onToggleIncludeInStats}
          columnsConfig={columnsConfig}
        />
      </div>

      <CompsStatistics
        comps={filteredComps}
        tableClassName="border rounded-md"
        targetMetrics={targetMetrics}
      />
    </div>
  )
}
