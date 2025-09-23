import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { useParams } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AddCompForm } from '@/components/workspace/publicComps/AddCompForm'
import { CompanyMetricsDisplay } from '@/components/workspace/publicComps/CompanyMetricsDisplay'
import { BenchmarkingTab } from '@/components/workspace/publicComps/BenchmarkingTab'
import { ComparablesAnalysisTab } from '@/components/workspace/publicComps/ComparablesAnalysisTab'
import { usePublicCompsData, CompanyData } from '@/hooks/usePublicCompsData'
import { WorkspaceHeaderLayout } from '@/components/layout/WorkspaceHeaderLayout'
import { BarChart3 } from 'lucide-react'

// Target metrics data that will be used across components
export const targetCompanyMetrics = {
  name: 'Target Company',
  revenue: 150000,
  ebitda: 45000,
  ebit: 35000,
  netIncome: 25000,
  marketCap: 300000,
  netDebt: 50000,
  enterpriseValue: 350000,
  evToRevenue: 2.3,
  evToEbitda: 7.8,
  evToEbit: 10.0,
  peRatio: 12.0,
  pToBookValue: 1.8,
  revenueGrowth: 15.0,
  ebitdaMargin: 30.0,
}

export default function PublicComps() {
  const { projectId } = useParams<{ projectId: string }>()
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<keyof CompanyData | ''>('')

  const [columnsConfig, setColumnsConfig] = useState<Record<string, boolean>>({
    marketCap: true,
    netDebt: true,
    enterpriseValue: true,
    revenue: true,
    ebitda: true,
    ebit: true,
    netIncome: true,
    evToRevenue: true,
    evToEbitda: true,
    evToEbit: true,
    peRatio: true,
    pToBookValue: true,
    revenueGrowth: true,
    ebitdaMargin: true,
  })

  const {
    compsData,
    peerGroups,
    handleAddComp,
    handleRemoveComp,
    handleUpdateComp,
    handleToggleIncludeInStats,
    handleSavePeerGroup,
    handleLoadPeerGroup,
  } = usePublicCompsData(projectId)

  const filteredComps = compsData.filter(
    (comp) =>
      comp.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const sortedComps = [...filteredComps].sort((a, b) => {
    if (!sortField) return 0

    const aValue = a[sortField]
    const bValue = b[sortField]

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return aValue.localeCompare(bValue)
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return aValue - bValue
    }

    return 0
  })

  return (
    <WorkspaceHeaderLayout
      title="Public Company Comparables"
      icon={<BarChart3 />}
      description="Analyze and compare relative valuation multiples from similar public companies"
      fullWidth={true}
      showCommentsButton={true}
      hideCollaboration={true}
    >
      <div className="mb-4">
        <p className="text-muted-foreground">
          Compare your subject company to similar publicly traded companies to derive valuation
          multiples. Filter, analyze, and adjust comparables data to determine appropriate valuation
          ranges.
        </p>
      </div>

      <div className="flex w-full flex-col space-y-6 pb-24">
        {/* Moved the Add Company Form to the top */}
        <Card className="p-6">
          <AddCompForm
            onAddComp={handleAddComp}
            onSavePeerGroup={handleSavePeerGroup}
            onLoadPeerGroup={handleLoadPeerGroup}
            peerGroups={peerGroups}
            comps={compsData}
          />
        </Card>

        <Card className="w-full overflow-hidden p-0">
          <Tabs defaultValue="comparables" className="w-full">
            <div className="px-6 pt-6">
              <TabsList className="mb-2">
                <TabsTrigger value="comparables">Comparables Analysis</TabsTrigger>
                <TabsTrigger value="benchmarking">Metric Benchmarking</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="comparables" className="p-6 pt-2">
              <ComparablesAnalysisTab
                filteredComps={sortedComps}
                columnsConfig={columnsConfig}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onSortFieldChange={setSortField}
                onColumnsConfigChange={setColumnsConfig}
                onRemoveComp={handleRemoveComp}
                onUpdateComp={handleUpdateComp}
                onToggleIncludeInStats={handleToggleIncludeInStats}
                targetMetrics={targetCompanyMetrics}
              />
            </TabsContent>

            <TabsContent value="benchmarking" className="p-6 pt-2">
              <BenchmarkingTab
                comps={compsData}
                columnsConfig={columnsConfig}
                targetMetrics={targetCompanyMetrics}
              />
            </TabsContent>
          </Tabs>
        </Card>

        <Card className="p-6">
          <CompanyMetricsDisplay />
        </Card>
      </div>
    </WorkspaceHeaderLayout>
  )
}
