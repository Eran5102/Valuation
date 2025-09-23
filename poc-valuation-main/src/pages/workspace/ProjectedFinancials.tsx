import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useValuationData } from '@/contexts/ValuationDataContext'
import { useIntegratedFinancialModel } from '@/hooks/useIntegratedFinancialModel'
import { useProjectSettings } from '@/contexts/ProjectSettingsContext'
import { IncomeStatementTable } from '@/components/workspace/financials/IncomeStatementTable'
import { BalanceSheetTable } from '@/components/workspace/financials/BalanceSheetTable'
import { CashFlowTable } from '@/components/workspace/financials/CashFlowTable'
import { ScenarioManager } from '@/components/workspace/ScenarioManager'
import { useScenario } from '@/hooks/useScenario'
import { Button } from '@/components/ui/button'
import { FileBarChart, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import EmptyState from '@/components/EmptyState'
import { WorkspaceHeaderLayout } from '@/components/layout/WorkspaceHeaderLayout'
import { DCFAssumptionsDisplay } from '@/components/workspace/dcf/DCFAssumptionsDisplay'
import { generateFiscalYearLabels } from '@/utils/fiscalYearUtils'

export default function ProjectedFinancials() {
  const { projectId = 'new' } = useParams<{ projectId: string }>()
  const [activeTab, setActiveTab] = useState<string>('income-statement')
  const [unitMultiplier, setUnitMultiplier] = useState<number>(1)
  const [showGrowthRates, setShowGrowthRates] = useState<boolean>(true)
  const { financialProjections, setFinancialProjections } = useValuationData()
  const { calculateFinancialProjections, isCalculating, calculationError } =
    useIntegratedFinancialModel(projectId)
  const { settings } = useProjectSettings()
  const {
    scenario,
    assumptions,
    historicals,
    settings: scenarioSettings,
    setScenario,
    setAssumptions,
    setHistoricals,
    setSettings,
  } = useScenario(projectId)

  // Generate projection year labels using the fiscal year format (FY2025, FY2026, etc.)
  const projectionYearLabels = generateFiscalYearLabels(
    settings?.mostRecentFiscalYearEnd || new Date().toISOString().split('T')[0],
    settings?.fiscalYearEnd || '12-31',
    scenarioSettings?.forecastPeriod || 5
  )

  // Calculate projections on initial load if we have data
  useEffect(() => {
    if (
      projectId !== 'new' &&
      scenario &&
      assumptions &&
      historicals &&
      !financialProjections &&
      !isCalculating
    ) {
      calculateFinancialProjections()
    }
  }, [
    projectId,
    scenario,
    assumptions,
    historicals,
    financialProjections,
    isCalculating,
    calculateFinancialProjections,
  ])

  // Refresh data manually
  const handleRefresh = async () => {
    toast.promise(
      new Promise((resolve, reject) => {
        try {
          const result = calculateFinancialProjections()
          // Wait a brief moment to simulate processing
          setTimeout(() => {
            if (calculationError) {
              reject(new Error(calculationError))
            } else {
              resolve(result)
            }
          }, 300)
        } catch (error) {
          reject(error)
        }
      }),
      {
        loading: 'Recalculating financial projections...',
        success: 'Financial projections updated successfully',
        error: (err) => `Error: ${err.message || 'Could not calculate projections'}`,
      }
    )
  }

  // Respond to changes in unit display preference
  const handleUnitChange = (value: string) => {
    const multiplier = parseInt(value, 10)
    setUnitMultiplier(multiplier)
  }

  // Toggle growth rates display
  const handleToggleGrowthRates = () => {
    setShowGrowthRates((prev) => !prev)
  }

  // If no data available, show appropriate message
  const renderEmptyState = () => (
    <EmptyState
      title="No Financial Projections Available"
      description="Select a scenario and enter assumptions to generate projected financial statements."
    />
  )

  const controlsSection = (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Display Units:</span>
          <Select onValueChange={handleUnitChange} defaultValue="1">
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select Units" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Actual</SelectItem>
              <SelectItem value="1000">Thousands</SelectItem>
              <SelectItem value="1000000">Millions</SelectItem>
              <SelectItem value="1000000000">Billions</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" size="sm" onClick={handleToggleGrowthRates}>
          {showGrowthRates ? 'Hide Growth Rates' : 'Show Growth Rates'}
        </Button>
      </div>

      <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isCalculating}>
        <RefreshCw className={`mr-1 h-4 w-4 ${isCalculating ? 'animate-spin' : ''}`} />
        Refresh Projections
      </Button>
    </div>
  )

  return (
    <WorkspaceHeaderLayout
      title="Projected Financial Statements"
      icon={<FileBarChart className="h-5 w-5" />}
      description="View the fully integrated 3-statement financial projections based on your active scenario."
      showCommentsButton={true}
      hideCollaboration={true}
      fullWidth={true}
    >
      <div className="mb-8 flex flex-col space-y-4">
        <ScenarioManager
          scenario={scenario}
          setScenario={setScenario}
          assumptions={assumptions}
          setAssumptions={setAssumptions}
          historicals={historicals}
          setHistoricals={setHistoricals}
          settings={scenarioSettings}
          setSettings={setSettings}
          onRefreshProjections={handleRefresh}
        />
      </div>

      <div className="w-full">
        <Card className="w-full">
          <CardContent className="p-6">
            {/* Add DCF Assumptions Display component connected to the current scenario */}
            {assumptions && (
              <Card className="mb-6 mt-2">
                <CardContent className="p-4">
                  <DCFAssumptionsDisplay
                    assumptions={assumptions}
                    forecastPeriod={scenarioSettings?.forecastPeriod || 5}
                    yearLabels={projectionYearLabels}
                  />
                </CardContent>
              </Card>
            )}

            <div className="mb-4">{controlsSection}</div>

            {/* Financial statements tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="flex w-full rounded-none border-b">
                <TabsTrigger value="income-statement" className="flex-1">
                  Income Statement
                </TabsTrigger>
                <TabsTrigger value="balance-sheet" className="flex-1">
                  Balance Sheet
                </TabsTrigger>
                <TabsTrigger value="cash-flow" className="flex-1">
                  Cash Flow
                </TabsTrigger>
              </TabsList>

              {/* Display financial tables or empty state */}
              {financialProjections ? (
                <div className="max-h-[600px] overflow-auto p-4">
                  <TabsContent value="income-statement" className="m-0 w-full">
                    <IncomeStatementTable
                      incomeStatement={financialProjections.incomeStatement}
                      years={projectionYearLabels}
                      unitMultiplier={unitMultiplier}
                      currency={settings.currency || 'USD'}
                      showGrowthRates={showGrowthRates}
                    />
                  </TabsContent>

                  <TabsContent value="balance-sheet" className="m-0 w-full">
                    <BalanceSheetTable
                      balanceSheet={financialProjections.balanceSheet}
                      years={projectionYearLabels}
                      unitMultiplier={unitMultiplier}
                      currency={settings.currency || 'USD'}
                    />
                  </TabsContent>

                  <TabsContent value="cash-flow" className="m-0 w-full">
                    <CashFlowTable
                      cashFlow={financialProjections.cashFlow}
                      years={projectionYearLabels}
                      unitMultiplier={unitMultiplier}
                      currency={settings.currency || 'USD'}
                    />
                  </TabsContent>
                </div>
              ) : (
                <div className="p-4">{renderEmptyState()}</div>
              )}

              {/* Error message display */}
              {calculationError && (
                <div className="m-4 rounded-md border border-red-200 bg-red-50 p-3 text-red-800">
                  <p className="font-semibold">Error in financial projections:</p>
                  <p>{calculationError}</p>
                </div>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </WorkspaceHeaderLayout>
  )
}
