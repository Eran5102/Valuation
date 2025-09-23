import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { EquityBridge } from '@/components/workspace/EquityBridge'
import ValuationSummaryTable from '@/components/workspace/ValuationSummaryTable'
import FootballFieldChart from '@/components/workspace/FootballFieldChart'
import EmptyState from '@/components/EmptyState'
import { useScenario } from '@/hooks/useScenario'
import { useDcfCalculations } from '@/hooks/useDcfCalculations'
import { DCFModelInputs } from '@/components/workspace/dcf/DCFModelInputs'
import { DCFModelOutputs } from '@/components/workspace/dcf/DCFModelOutputs'
import { DCFHistoricalInputs } from '@/components/workspace/dcf/DCFHistoricalInputs'
import { DCFSettings } from '@/components/workspace/dcf/DCFSettings'
import { DCFAssumptionsSummary } from '@/components/workspace/dcf/DCFAssumptionsSummary'
import { ScenarioManager } from '@/components/workspace/ScenarioManager'
import { useParams } from 'react-router-dom'
import { DCFMainTable } from '@/components/workspace/dcf/DCFMainTable'
import { DCFControls } from '@/components/workspace/dcf/DCFControls'
import { DCFChartView } from '@/components/workspace/dcf/DCFChartView'
import { DCFSensitivity } from '@/components/workspace/dcf/DCFSensitivity'
import { DCFStubPeriodInputs } from '@/components/workspace/dcf/DCFStubPeriodInputs'
import { generateProjectionLabels } from '@/utils/fiscalYearUtils'
import { Activity } from 'lucide-react'
import { WorkspaceHeaderLayout } from '@/components/layout/WorkspaceHeaderLayout'
import { DCFAssumptionsDisplay } from '@/components/workspace/dcf/DCFAssumptionsDisplay'
import { Scenario } from '@/utils/scenarioUtils'
import { formatDate } from '@/utils/formatters'

export default function ValuationSynthesis() {
  const { projectId = 'new' } = useParams<{ projectId: string }>()
  const [activeTab, setActiveTab] = useState<string>('summary')
  const {
    scenario,
    setScenario,
    assumptions,
    setAssumptions,
    historicals,
    setHistoricals,
    settings,
    setSettings,
  } = useScenario(projectId)

  // DCF control states
  const [unitMultiplier, setUnitMultiplier] = useState<number>(1) // Changed from 1000000 (millions) to 1 (dollars)
  const [forecastPeriod, setForecastPeriod] = useState<number>(settings?.forecastPeriod || 5)
  const [discountRate, setDiscountRate] = useState<number>(settings?.discountRate || 12)
  const [taxRate, setTaxRate] = useState<number>(settings?.taxRate || 25)
  const [terminalGrowthRate, setTerminalGrowthRate] = useState<number>(
    settings?.terminalGrowthRate || 2
  )
  const [terminalValueMethod, setTerminalValueMethod] = useState<string>(
    settings?.terminalValueMethod || 'PGM'
  )
  const [exitMultipleMetric, setExitMultipleMetric] = useState<string>(
    settings?.exitMultipleMetric || 'EBITDA'
  )
  const [exitMultipleValue, setExitMultipleValue] = useState<number>(
    settings?.exitMultipleValue || 8
  )
  const [depreciationSource, setDepreciationSource] = useState<'scenario' | 'schedule'>(
    settings?.depreciationSource || 'scenario'
  )
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'GBP' | 'CAD'>(
    settings?.currency || 'USD'
  )

  // Add stub period states
  const [isStubPeriod, setIsStubPeriod] = useState<boolean>(false)
  const [stubPeriodFraction, setStubPeriodFraction] = useState<number>(0)
  const [stubPeriodEndDate, setStubPeriodEndDate] = useState<string>('')
  const [lastFYEDate, setLastFYEDate] = useState<string>('')
  const [stubInputs, setStubInputs] = useState({
    revenue: 0,
    ebit: 0,
    taxes: 0,
    depreciation: 0,
    capex: 0,
    nwcChange: 0,
  })

  // Use the DCF calculator hook with the new stub period calculation function
  const { calculateDcf, results: dcf, calculateStubPeriodInfo } = useDcfCalculations()

  // Check for stub period when the component loads or when relevant dates change
  useEffect(() => {
    const stubInfo = calculateStubPeriodInfo()
    setIsStubPeriod(stubInfo.isStubPeriod)
    setStubPeriodFraction(stubInfo.stubPeriodFraction)

    if (stubInfo.mostRecentFYEDate) {
      setLastFYEDate(stubInfo.mostRecentFYEDate.toISOString().split('T')[0])
    }

    if (stubInfo.valuationDate) {
      setStubPeriodEndDate(stubInfo.valuationDate.toISOString().split('T')[0])
    }

    // If there's a new stub period, initialize stub inputs with estimated values
    if (stubInfo.isStubPeriod && historicals && historicals.lastActualRevenue) {
      // Simple proration based on stub period fraction
      const fraction = stubInfo.stubPeriodFraction

      // Use last year's values to estimate stub period (simple proration)
      const estimatedRevenue = historicals.lastActualRevenue * fraction
      const estimatedEbit = (historicals.lastActualEbit || estimatedRevenue * 0.15) * fraction
      const estimatedDepreciation =
        (historicals.lastActualDepreciation || estimatedRevenue * 0.05) * fraction

      setStubInputs({
        revenue: Math.round(estimatedRevenue),
        ebit: Math.round(estimatedEbit),
        taxes: Math.round(estimatedEbit * (taxRate / 100)),
        depreciation: Math.round(estimatedDepreciation),
        capex: Math.round(estimatedDepreciation * 1.1), // Slightly higher than depreciation
        nwcChange: Math.round(estimatedRevenue * 0.02), // 2% of revenue as NWC change
      })
    }
  }, [
    settings?.valuationDate || settings?.mostRecentFiscalYearEnd,
    settings?.mostRecentFiscalYearEnd,
    calculateStubPeriodInfo,
    historicals,
    taxRate,
  ])

  useEffect(() => {
    // Update settings when DCF control states change
    const updatedSettings = {
      ...settings,
      forecastPeriod,
      discountRate,
      taxRate,
      terminalGrowthRate,
      terminalValueMethod,
      exitMultipleMetric,
      exitMultipleValue,
      depreciationSource,
      currency,
    }
    setSettings(updatedSettings)
  }, [
    forecastPeriod,
    discountRate,
    taxRate,
    terminalGrowthRate,
    terminalValueMethod,
    exitMultipleMetric,
    exitMultipleValue,
    depreciationSource,
    currency,
  ])

  // Handle stub input changes
  const handleStubInputChange = (input: keyof typeof stubInputs, value: number) => {
    setStubInputs((prev) => ({
      ...prev,
      [input]: value,
    }))
  }

  // Calculate DCF results when assumptions, settings, or stub inputs change
  useEffect(() => {
    if (assumptions && historicals && settings) {
      // Convert growth rates from percentages to decimals for calculations
      const rawGrowthRates =
        assumptions?.incomeCf?.['Sales Growth (%)']?.slice(0, forecastPeriod) ||
        Array(forecastPeriod).fill(5)
      const revenueGrowthRates = rawGrowthRates.map((rate: number) => rate / 100)

      console.log('DCF calculation - using historicals:', historicals)
      console.log('DCF calculation - using growth rates:', revenueGrowthRates)

      // Use last actual revenue from historicals or fall back to localStorage
      let initialRevenue = historicals?.lastActualRevenue
      if (!initialRevenue) {
        const storedRevenue = localStorage.getItem('lastActualRevenue')
        if (storedRevenue) {
          initialRevenue = parseFloat(storedRevenue)
          console.log(`Using revenue from localStorage: ${initialRevenue}`)
        } else {
          initialRevenue = 1000 // Default fallback
          console.log(`No revenue found, using default: ${initialRevenue}`)
        }
      } else {
        console.log(`Using revenue from historicals: ${initialRevenue}`)
      }

      // Include stub period information in DCF calculations
      const params = {
        forecastPeriod: forecastPeriod,
        revenueGrowthRates: revenueGrowthRates,
        ebitdaMargins: Array(forecastPeriod).fill(0.2), // Default EBITDA margin
        taxRate: taxRate / 100,
        depreciationRates:
          assumptions?.incomeCf?.['Depreciation (% of Sales)']
            ?.slice(0, forecastPeriod)
            .map((rate: number) => rate / 100) || Array(forecastPeriod).fill(0.03),
        capexPercentages:
          assumptions?.incomeCf?.['CapEx (% of Sales)']
            ?.slice(0, forecastPeriod)
            .map((rate: number) => rate / 100) || Array(forecastPeriod).fill(0.05),
        nwcPercentages: Array(forecastPeriod).fill(0.02), // Default NWC % of sales
        terminalGrowthRate: terminalGrowthRate / 100,
        wacc: discountRate / 100,
        initialRevenue: initialRevenue,
        exitMultiple: exitMultipleValue,
        // Include stub period parameters
        isStubPeriod,
        stubPeriodFraction,
        stubPeriodInputs: stubInputs,
      }

      calculateDcf(params)
    }
  }, [
    calculateDcf,
    assumptions,
    historicals,
    forecastPeriod,
    discountRate,
    taxRate,
    terminalGrowthRate,
    terminalValueMethod,
    exitMultipleValue,
    depreciationSource,
    // Add stub period dependencies
    isStubPeriod,
    stubPeriodFraction,
    stubInputs,
  ])

  // Listen for tax rate changes from Core Assumptions
  useEffect(() => {
    const handleTaxRateChanged = (event: CustomEvent) => {
      if (event.detail && typeof event.detail.value === 'number') {
        setTaxRate(event.detail.value)
        console.log(`DCF: Tax rate updated to ${event.detail.value}%`)

        // Also update settings for persistence
        setSettings({
          ...settings,
          taxRate: event.detail.value,
        })
      }
    }

    // Add event listener for the tax rate change event
    window.addEventListener('taxRateChanged', handleTaxRateChanged as EventListener)

    // Clean up
    return () => {
      window.removeEventListener('taxRateChanged', handleTaxRateChanged as EventListener)
    }
  }, [settings]) // Add settings to dependency array to ensure the most recent state is used

  const projectionYearLabels = generateProjectionLabels(
    settings?.mostRecentFiscalYearEnd || new Date().toISOString().split('T')[0],
    settings?.fiscalYearEnd || '12-31',
    forecastPeriod
  )

  const hasData =
    assumptions &&
    assumptions.incomeCf &&
    assumptions.balanceSheet &&
    historicals &&
    historicals.incomeStatement &&
    historicals.balanceSheet

  // Handle DCF control changes
  const handleUnitChange = (value: string) => {
    setUnitMultiplier(parseInt(value))
  }

  const handleCurrencyChange = (value: string) => {
    setCurrency(value as 'USD' | 'EUR' | 'GBP' | 'CAD')
  }

  const handleForecastPeriodChange = (value: number[]) => {
    setForecastPeriod(value[0])
  }

  const handleDiscountRateChange = (value: number[]) => {
    setDiscountRate(value[0])
  }

  const handleTaxRateChange = (value: number[]) => {
    setTaxRate(value[0])

    // Also update settings for persistence
    setSettings({
      ...settings,
      taxRate: value[0],
    })
  }

  const handleTerminalGrowthChange = (value: number[]) => {
    setTerminalGrowthRate(value[0])
  }

  const handleTerminalValueMethodChange = (method: string) => {
    setTerminalValueMethod(method)
  }

  const handleExitMultipleMetricChange = (metric: string) => {
    setExitMultipleMetric(metric)
  }

  const handleExitMultipleValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setExitMultipleValue(parseFloat(event.target.value) || 0)
  }

  const handleDepreciationSourceChange = (source: 'scenario' | 'schedule') => {
    console.log(`Changing depreciation source to: ${source}`)
    setDepreciationSource(source)

    // Show a notification when switching depreciation source
    if (source === 'schedule') {
      console.log('Using custom Depreciation & CapEx Schedule')
    } else {
      console.log('Using scenario assumptions for depreciation')
    }
  }

  const handleNavigateToDepreciationSchedule = () => {
    // Navigate to depreciation schedule page
    window.location.href = `/workspace/${projectId}/depreciation-capex`
  }

  // Sensitivity analysis for tornado chart
  const runSensitivityAnalysis = (param: string, rangePercent: number) => {
    // Simple simulation for the specified parameter
    const baseEV = dcf?.enterpriseValue || 0
    const labels = []
    const values = []
    const steps = 5

    // Create test values around the base case parameter
    for (let i = -2; i <= 2; i++) {
      const stepPercent = (rangePercent / 2) * (i / 2)
      labels.push(
        `${param === 'wacc' || param === 'growth' ? stepPercent.toFixed(1) + '%' : stepPercent.toFixed(1)}`
      )

      // Simulate the impact on enterprise value
      let valueFactor = 1
      if (param === 'wacc') {
        // WACC up, value down (inverse relationship)
        valueFactor = 1 - (stepPercent / 100) * 2
      } else if (param === 'growth' || param === 'exitMultiple') {
        // Growth up, value up (direct relationship)
        valueFactor = 1 + (stepPercent / 100) * 2
      } else if (param === 'revenue' || param === 'margin') {
        // Revenue/margin up, value up (direct relationship)
        valueFactor = 1 + (stepPercent / 100) * 1.5
      }

      values.push(baseEV * valueFactor)
    }

    return {
      labels,
      values,
      baseIndex: 2, // Middle value is the base case
    }
  }

  const baseValueIndices = {
    waccIdx: 2,
    secondaryIdx: 2,
  }

  const renderContent = () => {
    if (!hasData) {
      return (
        <Card className="col-span-2">
          <CardContent>
            <EmptyState
              title="No Data Available"
              description="Please input assumptions and historicals to generate the valuation synthesis."
            />
          </CardContent>
        </Card>
      )
    }

    return (
      <>
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Valuation Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <ValuationSummaryTable dcf={dcf} settings={settings} />
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>DCF Analysis</CardTitle>
          </CardHeader>
          <CardContent className="overflow-visible">
            {/* DCF Assumptions Summary placed above controls */}
            <DCFAssumptionsSummary
              discountRate={discountRate}
              terminalGrowthRate={terminalGrowthRate}
              taxRate={taxRate}
              forecastPeriod={forecastPeriod}
              maxProjectionYears={settings?.maxProjectionYears || 10}
              onDiscountRateChange={handleDiscountRateChange}
              onTerminalGrowthChange={handleTerminalGrowthChange}
              onTaxRateChange={handleTaxRateChange}
              onForecastPeriodChange={handleForecastPeriodChange}
              terminalValueMethod={terminalValueMethod}
            />

            <DCFControls
              unitMultiplier={unitMultiplier}
              currency={currency}
              forecastPeriod={forecastPeriod}
              maxProjectionYears={settings?.maxProjectionYears || 10}
              discountRate={discountRate}
              taxRate={taxRate}
              terminalGrowthRate={terminalGrowthRate}
              terminalValueMethod={terminalValueMethod}
              exitMultipleMetric={exitMultipleMetric}
              exitMultipleValue={exitMultipleValue}
              onUnitChange={handleUnitChange}
              onCurrencyChange={handleCurrencyChange}
              onForecastPeriodChange={handleForecastPeriodChange}
              onDiscountRateChange={handleDiscountRateChange}
              onTaxRateChange={handleTaxRateChange}
              onTerminalGrowthChange={handleTerminalGrowthChange}
              onTerminalValueMethodChange={handleTerminalValueMethodChange}
              onExitMultipleMetricChange={handleExitMultipleMetricChange}
              onExitMultipleValueChange={handleExitMultipleValueChange}
              onNavigateToDepreciationSchedule={handleNavigateToDepreciationSchedule}
              hasCustomDepreciationSchedule={dcf?.hasCustomDepreciationSchedule}
              depreciationSource={depreciationSource}
              onDepreciationSourceChange={handleDepreciationSourceChange}
              showMainControlSliders={false}
            />

            {/* Add the new stub period inputs component */}
            <DCFStubPeriodInputs
              isStubPeriod={isStubPeriod}
              setIsStubPeriod={setIsStubPeriod}
              stubPeriodFraction={stubPeriodFraction}
              stubPeriodEndDate={stubPeriodEndDate}
              lastFYEDate={lastFYEDate}
              valuationDate={settings?.valuationDate || new Date().toISOString().split('T')[0]}
              stubInputs={stubInputs}
              onStubInputChange={handleStubInputChange}
              currency={currency}
              unitMultiplier={unitMultiplier}
            />

            {dcf?.projections && (
              <Tabs defaultValue="table-view" className="mt-4">
                <TabsList className="w-full">
                  <TabsTrigger value="table-view" className="flex-1">
                    Table View
                  </TabsTrigger>
                  <TabsTrigger value="chart-view" className="flex-1">
                    Graphics
                  </TabsTrigger>
                  <TabsTrigger value="sensitivity-view" className="flex-1">
                    Sensitivity
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="table-view" className="py-4">
                  {/* Add the DCF Assumptions Display above the table */}
                  {assumptions && (
                    <Card className="mb-4">
                      <CardContent className="p-4">
                        <DCFAssumptionsDisplay
                          assumptions={assumptions}
                          terminalAssumptions={
                            (scenario as unknown as Scenario)?.terminalAssumptions
                          }
                          forecastPeriod={forecastPeriod}
                          yearLabels={projectionYearLabels}
                        />
                      </CardContent>
                    </Card>
                  )}
                  <div className="overflow-auto">
                    <DCFMainTable
                      calculatedProjections={{
                        revenue: dcf.projections.revenue || [],
                        ebitda: dcf.projections.ebitda || [],
                        depreciation: dcf.projections.depreciation || [],
                        ebit: dcf.projections.ebit || [],
                        taxes: dcf.projections.taxes || [],
                        nopat: dcf.projections.taxes.map((tax, i) => dcf.projections.ebit[i] - tax),
                        addBackDepreciation: dcf.projections.depreciation || [],
                        lessCapex: dcf.projections.capex.map((c) => -c) || [],
                        lessChangeInWc: dcf.projections.nwcChanges.map((wc) => -wc) || [],
                        fcf: dcf.projections.fcf || [],
                        terminalValue: dcf.projections.terminalValue,
                      }}
                      projectionYearLabels={projectionYearLabels}
                      forecastPeriod={forecastPeriod}
                      unitMultiplier={unitMultiplier}
                      currency={currency}
                      depreciationSource={depreciationSource}
                      // Add stub period info to show in the table if needed
                      stubPeriod={dcf?.stubPeriod}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="chart-view" className="py-4">
                  <DCFChartView
                    projectionYearLabels={projectionYearLabels}
                    calculatedProjections={{
                      revenue: dcf.projections.revenue || [],
                      ebit: dcf.projections.ebit || [],
                      fcf: dcf.projections.fcf || [],
                    }}
                    unitMultiplier={unitMultiplier}
                    currency={currency}
                    // Pass stub period for chart display
                    stubPeriod={dcf?.stubPeriod}
                  />
                </TabsContent>
                <TabsContent value="sensitivity-view" className="py-4">
                  <DCFSensitivity
                    baseResult={dcf.enterpriseValue}
                    unitMultiplier={unitMultiplier}
                    currency={currency}
                    waccRate={discountRate}
                    growthRate={terminalGrowthRate}
                    exitMultiple={exitMultipleValue}
                    terminalValueMethod={terminalValueMethod}
                    exitMultipleMetric={exitMultipleMetric}
                    sensitivityMatrix={dcf.sensitivityMatrix}
                    baseValueIndices={baseValueIndices}
                    discountRate={discountRate}
                    runSensitivityAnalysis={runSensitivityAnalysis}
                  />
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Football Field Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <FootballFieldChart dcf={dcf} settings={settings} />
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Equity Bridge</CardTitle>
          </CardHeader>
          <CardContent>
            <EquityBridge enterpriseValue={dcf?.enterpriseValue || 0} />
          </CardContent>
        </Card>
      </>
    )
  }

  return (
    <WorkspaceHeaderLayout
      title="Valuation Synthesis"
      icon={<Activity className="h-5 w-5" />}
      description="Review and synthesize the results of your valuation model."
    >
      <div className="mb-4 flex flex-col space-y-4">
        <ScenarioManager
          scenario={scenario}
          setScenario={setScenario}
          assumptions={assumptions}
          setAssumptions={setAssumptions}
          historicals={historicals}
          setHistoricals={setHistoricals}
          settings={settings}
          setSettings={setSettings}
        />
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="historicals">Historicals</TabsTrigger>
            <TabsTrigger value="dcf-inputs">DCF Inputs</TabsTrigger>
            <TabsTrigger value="dcf-outputs">DCF Outputs</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="summary" className="mt-2">
            <div className="grid grid-cols-1 gap-4 overflow-auto">{renderContent()}</div>
          </TabsContent>
          <TabsContent value="historicals" className="mt-2">
            <Card>
              <CardHeader>
                <CardTitle>Historicals</CardTitle>
              </CardHeader>
              <CardContent>
                <DCFHistoricalInputs
                  historicals={historicals}
                  setHistoricals={setHistoricals}
                  settings={settings}
                />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="dcf-inputs" className="mt-2">
            <Card>
              <CardHeader>
                <CardTitle>DCF Model Inputs</CardTitle>
              </CardHeader>
              <CardContent>
                <DCFModelInputs
                  assumptions={assumptions}
                  historicals={historicals}
                  settings={settings}
                />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="dcf-outputs" className="mt-2">
            <Card>
              <CardHeader>
                <CardTitle>DCF Model Outputs</CardTitle>
              </CardHeader>
              <CardContent>
                <DCFModelOutputs dcf={dcf} settings={settings} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="settings" className="mt-2">
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <DCFSettings settings={settings} setSettings={setSettings} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </WorkspaceHeaderLayout>
  )
}
