import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { DCFControls } from '@/components/workspace/dcf/DCFControls'
import { DCFMainTable } from '@/components/workspace/dcf/DCFMainTable'
import { DCFChartView } from '@/components/workspace/dcf/DCFChartView'
import { DCFSensitivity } from '@/components/workspace/dcf/DCFSensitivity'
import { DCFSummaryCards } from '@/components/workspace/dcf/DCFSummaryCards'
import { ScenarioManager } from '@/components/workspace/ScenarioManager'
import { useScenario } from '@/hooks/useScenario'
import useDcfCalculations from '@/hooks/useDcfCalculations'
import { useProjectSettings } from '@/contexts/ProjectSettingsContext'
import { generateFiscalYearLabels } from '@/utils/fiscalYearUtils'
import { useValuationData } from '@/contexts/ValuationDataContext'
import { toast } from 'sonner'
import { ChartBar, KeyRound, SlidersHorizontal } from 'lucide-react'
import { WorkspaceHeaderLayout } from '@/components/layout/WorkspaceHeaderLayout'
import { DCFAssumptionsSummary } from '@/components/workspace/dcf/DCFAssumptionsSummary'
import { DCFAssumptionsDisplay } from '@/components/workspace/dcf/DCFAssumptionsDisplay'
import { Scenario, TerminalAssumptions } from '@/utils/scenarioUtils'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DCFStubPeriodInputs } from '@/components/workspace/dcf/DCFStubPeriodInputs'

export default function DcfAnalysis() {
  const { projectId = 'new' } = useParams<{ projectId: string }>()
  const [activeTab, setActiveTab] = useState<string>('table-view')
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

  // Get financial projections from context
  const { financialProjections } = useValuationData()

  // DCF control states
  const [unitMultiplier, setUnitMultiplier] = useState<number>(1)
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

  // Stub period states
  const [isStubPeriod, setIsStubPeriod] = useState<boolean>(false)
  const [stubPeriodFraction, setStubPeriodFraction] = useState<number>(0)
  const [stubInputs, setStubInputs] = useState({
    revenue: 0,
    ebit: 0,
    taxes: 0,
    depreciation: 0,
    capex: 0,
    nwcChange: 0,
  })

  // UI control states for collapsible sections
  const [isValuationParametersOpen, setIsValuationParametersOpen] = useState<boolean>(true)
  const [isAdditionalControlsOpen, setIsAdditionalControlsOpen] = useState<boolean>(true)
  const [isKeyAssumptionsOpen, setIsKeyAssumptionsOpen] = useState<boolean>(true)
  const [isStubPeriodOpen, setIsStubPeriodOpen] = useState<boolean>(true)

  // Flag to prevent duplicate toast messages
  const [initialLoad, setInitialLoad] = useState(true)

  const { calculateDcf, results: dcf } = useDcfCalculations()
  const { settings: projectSettings } = useProjectSettings()

  // Calculate stub period based on valuation date and projected first fiscal year end
  useEffect(() => {
    if (settings?.valuationDate && settings?.fiscalYearEnd) {
      const valuationDate = new Date(settings.valuationDate)

      // Determine the current calendar year
      const currentYear = valuationDate.getFullYear()

      // Parse the fiscal year end format (MM-DD)
      const [fiscalEndMonth, fiscalEndDay] = (settings.fiscalYearEnd || '12-31')
        .split('-')
        .map(Number)

      // Create the next fiscal year end date after valuation date
      let nextFiscalYearEnd = new Date(currentYear, fiscalEndMonth - 1, fiscalEndDay)

      // If valuation date is after the fiscal year end in the current year,
      // then we need the next calendar year's fiscal end
      if (valuationDate > nextFiscalYearEnd) {
        nextFiscalYearEnd = new Date(currentYear + 1, fiscalEndMonth - 1, fiscalEndDay)
      }

      // Check if valuation date is before the fiscal year end
      if (valuationDate < nextFiscalYearEnd) {
        // Calculate what fraction of a year the stub period represents
        const msInYear = 365 * 24 * 60 * 60 * 1000
        const timeDiff = nextFiscalYearEnd.getTime() - valuationDate.getTime()
        const fraction = timeDiff / msInYear

        // Calculate stub period fraction but don't automatically enable it
        setStubPeriodFraction(fraction)

        // Set default stub inputs - pro-rate the first year projection by the stub period fraction
        if (
          financialProjections &&
          financialProjections.incomeStatement &&
          financialProjections.incomeStatement.revenue &&
          financialProjections.incomeStatement.revenue.length > 0
        ) {
          // Pro-rate first year projections
          const firstYearRevenue = financialProjections.incomeStatement.revenue[0] || 0
          const firstYearEbit = financialProjections.incomeStatement.ebit[0] || 0
          const firstYearTaxes = financialProjections.incomeStatement.taxes[0] || 0
          const firstYearDepreciation = financialProjections.incomeStatement.depreciation[0] || 0
          const firstYearCapex = Math.abs(financialProjections.cashFlow.capitalExpenditures[0] || 0)
          const firstYearNwcChange = Math.abs(
            (financialProjections.cashFlow.changeInAccountsReceivable[0] || 0) +
              (financialProjections.cashFlow.changeInInventory[0] || 0) +
              (financialProjections.cashFlow.changeInAccountsPayable[0] || 0) +
              (financialProjections.cashFlow.changeInOtherWorkingCapital[0] || 0)
          )

          // Pro-rate based on stub fraction
          setStubInputs({
            revenue: firstYearRevenue * fraction,
            ebit: firstYearEbit * fraction,
            taxes: firstYearTaxes * fraction,
            depreciation: firstYearDepreciation * fraction,
            capex: firstYearCapex * fraction,
            nwcChange: firstYearNwcChange * fraction,
          })
        } else if (historicals && historicals.lastActualRevenue) {
          // Fall back to historicals if no projections available
          setStubInputs({
            revenue: historicals.lastActualRevenue * fraction,
            ebit: (historicals.lastActualEbit || 0) * fraction,
            taxes: (historicals.lastActualEbit || 0) * (taxRate / 100) * fraction,
            depreciation: (historicals.lastActualDepreciation || 0) * fraction,
            capex: (historicals.lastActualDepreciation || 0) * 1.1 * fraction, // Capex slightly higher than depreciation
            nwcChange: historicals.lastActualRevenue * 0.01 * fraction, // 1% of revenue as NWC
          })
        }
      }
    }
  }, [settings?.valuationDate, settings?.fiscalYearEnd, historicals, taxRate, financialProjections])

  // Handle stub inputs change
  const handleStubInputChange = (input: keyof typeof stubInputs, value: number) => {
    setStubInputs((prev) => ({
      ...prev,
      [input]: value,
    }))
  }

  // Calculate stub period FCF
  const calculateStubPeriodFCF = () => {
    const { revenue, ebit, taxes, depreciation, capex, nwcChange } = stubInputs

    // Simple FCF calculation
    const nopat = ebit - taxes
    const fcf = nopat + depreciation - capex - nwcChange

    // Discount the stub period cash flow
    const stubDiscountFactor = 1 / Math.pow(1 + discountRate / 100, stubPeriodFraction / 2)
    const discountedStubFcf = fcf * stubDiscountFactor

    return { fcf, discountedFcf: discountedStubFcf }
  }

  // Extract terminal assumptions from the scenario
  useEffect(() => {
    if (scenario && 'terminalAssumptions' in scenario) {
      // When scenario loads or changes, update the terminal assumptions from the scenario
      const terminalAssumptions = (scenario as unknown as Scenario).terminalAssumptions

      if (terminalAssumptions) {
        setTerminalGrowthRate(terminalAssumptions.terminalGrowthRate)

        // Store these in settings for persistence
        setSettings({
          ...settings,
          terminalGrowthRate: terminalAssumptions.terminalGrowthRate,
          terminalNopatMargin: terminalAssumptions.terminalNopatMargin,
          terminalReinvestmentRate: terminalAssumptions.terminalReinvestmentRate,
        })
      }
    }
  }, [scenario, setSettings])

  // Handler for terminal assumptions changes
  const handleTerminalAssumptionsChange = (updates: Partial<TerminalAssumptions>) => {
    // Create updated terminal assumptions
    const fullScenario = scenario as unknown as Scenario
    const updatedTerminalAssumptions = {
      ...(fullScenario.terminalAssumptions || {
        terminalGrowthRate: terminalGrowthRate,
        terminalNopatMargin: settings?.terminalNopatMargin || 15,
        terminalReinvestmentRate: settings?.terminalReinvestmentRate || 40,
      }),
      ...updates,
    }

    // Update the scenario's terminal assumptions
    if (scenario && setScenario) {
      setScenario({
        ...scenario,
        terminalAssumptions: updatedTerminalAssumptions,
      } as unknown as typeof scenario)
    }

    // Update local state for components that depend on these values
    if ('terminalGrowthRate' in updates) {
      setTerminalGrowthRate(updates.terminalGrowthRate as number)
    }

    // Update settings for persistence
    setSettings({
      ...settings,
      ...updates,
    })
  }

  // Update settings when DCF control states change
  useEffect(() => {
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

  // Calculate DCF results when assumptions or settings change, now using the integrated financial projections
  useEffect(() => {
    if (assumptions && historicals && financialProjections) {
      // Use financial projections for DCF calculation instead of direct scenario assumptions
      // This ensures the DCF uses data from our integrated 3-statement model

      const params = {
        forecastPeriod: forecastPeriod,
        // Use the revenue growth rates from the Income Statement projections instead of directly from assumptions
        revenueGrowthRates:
          financialProjections?.incomeStatement.revenue.map(
            (rev, i, arr) =>
              i === 0
                ? rev / historicals.lastActualRevenue - 1 // First year growth = (Year1 / Historical) - 1
                : rev / arr[i - 1] - 1 // Subsequent growth = (CurrentYear / PriorYear) - 1
          ) || Array(forecastPeriod).fill(0.05),

        // Calculate EBITDA margins from the projections
        ebitdaMargins:
          financialProjections?.incomeStatement.ebitda.map(
            (ebitda, i) => ebitda / financialProjections.incomeStatement.revenue[i]
          ) || Array(forecastPeriod).fill(0.2),

        taxRate: taxRate / 100,

        // Use depreciation from projections
        depreciationRates:
          financialProjections?.incomeStatement.depreciation.map(
            (dep, i) => dep / financialProjections.incomeStatement.revenue[i]
          ) || Array(forecastPeriod).fill(0.03),

        // Use CapEx from projections (negative in cash flow, so multiply by -1)
        capexPercentages:
          financialProjections?.cashFlow.capitalExpenditures.map(
            (capex, i) => -capex / financialProjections.incomeStatement.revenue[i]
          ) || Array(forecastPeriod).fill(0.05),

        // Use working capital changes from projections (need to convert to percentages)
        nwcPercentages: financialProjections
          ? Array(forecastPeriod)
              .fill(0)
              .map((_, i) => {
                const wc = -(
                  financialProjections.cashFlow.changeInAccountsReceivable[i] +
                  financialProjections.cashFlow.changeInInventory[i] +
                  financialProjections.cashFlow.changeInAccountsPayable[i] +
                  financialProjections.cashFlow.changeInOtherWorkingCapital[i]
                )
                return wc / financialProjections.incomeStatement.revenue[i]
              })
          : Array(forecastPeriod).fill(0.02),

        terminalGrowthRate: terminalGrowthRate / 100,
        wacc: discountRate / 100,
        initialRevenue: historicals?.lastActualRevenue || 1000,
        exitMultiple: exitMultipleValue,
        // Add stub period information only if enabled
        stubPeriod: isStubPeriod
          ? {
              isStubPeriod,
              stubPeriodFraction,
              ...calculateStubPeriodFCF(),
            }
          : undefined,
      }

      calculateDcf(params)
    } else if (assumptions && historicals) {
      // If no integrated projections available, fall back to direct calculation
      console.log('No integrated financial projections available, using direct assumptions for DCF')

      const rawGrowthRates =
        assumptions?.incomeCf?.['Sales Growth (%)']?.slice(0, forecastPeriod) ||
        Array(forecastPeriod).fill(5)
      const revenueGrowthRates = rawGrowthRates.map((rate: number) => rate / 100)

      let initialRevenue = historicals?.lastActualRevenue
      if (!initialRevenue) {
        const storedRevenue = localStorage.getItem('lastActualRevenue')
        initialRevenue = storedRevenue ? parseFloat(storedRevenue) : 1000
      }

      const params = {
        forecastPeriod,
        revenueGrowthRates,
        ebitdaMargins: Array(forecastPeriod).fill(0.2),
        taxRate: taxRate / 100,
        depreciationRates:
          assumptions?.incomeCf?.['Depreciation (% of Sales)']
            ?.slice(0, forecastPeriod)
            .map((rate: number) => rate / 100) || Array(forecastPeriod).fill(0.03),
        capexPercentages:
          assumptions?.incomeCf?.['CapEx (% of Sales)']
            ?.slice(0, forecastPeriod)
            .map((rate: number) => rate / 100) || Array(forecastPeriod).fill(0.05),
        nwcPercentages: Array(forecastPeriod).fill(0.02),
        terminalGrowthRate: terminalGrowthRate / 100,
        wacc: discountRate / 100,
        initialRevenue,
        exitMultiple: exitMultipleValue,
        // Add stub period information only if enabled
        stubPeriod: isStubPeriod
          ? {
              isStubPeriod,
              stubPeriodFraction,
              ...calculateStubPeriodFCF(),
            }
          : undefined,
      }

      calculateDcf(params)

      // Only show toast on initial load to prevent repeating messages
      if (initialLoad) {
        // Show a toast when falling back to direct calculation
        toast.warning(
          'Using direct assumptions for DCF. Generate integrated projections first for more accuracy.',
          {
            duration: 5000,
            action: {
              label: 'View Projections',
              onClick: () =>
                (window.location.href = `/workspace/${projectId}/projected-financials`),
            },
          }
        )

        setInitialLoad(false)
      }
    }
  }, [
    calculateDcf,
    assumptions,
    historicals,
    financialProjections,
    forecastPeriod,
    discountRate,
    taxRate,
    terminalGrowthRate,
    terminalValueMethod,
    exitMultipleValue,
    depreciationSource,
    initialLoad,
    isStubPeriod,
    stubPeriodFraction,
    stubInputs,
  ])

  // Listen for tax rate changes from Core Assumptions - cleanup to prevent memory leaks
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
  }, [settings])

  // Use fiscal year labels instead of projection labels for consistency
  const projectionYearLabels = generateFiscalYearLabels(
    projectSettings.mostRecentFiscalYearEnd || new Date().toISOString().split('T')[0],
    projectSettings.fiscalYearEnd || '12-31',
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
    setDepreciationSource(source)
  }

  const handleNavigateToDepreciationSchedule = () => {
    window.location.href = `/workspace/${projectId}/depreciation-capex`
  }

  const handleNavigateToProjectedFinancials = () => {
    window.location.href = `/workspace/${projectId}/projected-financials`
  }

  // Simple sensitivity analysis function for tornado chart
  const runSensitivityAnalysis = (param: string, rangePercent: number) => {
    // Simple simulation for the specified parameter
    const baseEV = dcf?.enterpriseValue || 0
    const labels = []
    const values = []

    for (let i = -2; i <= 2; i++) {
      const stepPercent = (rangePercent / 2) * (i / 2)
      labels.push(
        `${param === 'wacc' || param === 'growth' ? stepPercent.toFixed(1) + '%' : stepPercent.toFixed(1)}`
      )

      let valueFactor = 1
      if (param === 'wacc') {
        valueFactor = 1 - (stepPercent / 100) * 2
      } else if (param === 'growth' || param === 'exitMultiple') {
        valueFactor = 1 + (stepPercent / 100) * 2
      } else if (param === 'revenue' || param === 'margin') {
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

  return (
    <WorkspaceHeaderLayout
      title="Discounted Cash Flow Analysis"
      icon={<ChartBar className="h-5 w-5" />}
      description="Valuation based on projections of future free cash flows."
      fullWidth
      showCommentsButton={true}
      hideCollaboration={true} // Hide the duplicate User Presence and Share buttons
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

      {/* Main content area - removing all overflow properties to let the WorkspaceHeaderLayout control scrolling */}
      <div className="flex-1">
        <div>
          {/* Stub Period Inputs - Now with toggle control passed in */}
          <Collapsible
            open={isStubPeriodOpen}
            onOpenChange={setIsStubPeriodOpen}
            className="mb-4 w-full"
          >
            <Card className="border shadow-sm">
              <CollapsibleTrigger className="flex w-full items-center justify-between p-4 text-left">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-primary" />
                  <span className="text-lg font-medium">Stub Period Inputs</span>
                </div>
                <div className="text-muted-foreground">{isStubPeriodOpen ? '↑' : '↓'}</div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4">
                  <DCFStubPeriodInputs
                    isStubPeriod={isStubPeriod}
                    setIsStubPeriod={setIsStubPeriod}
                    stubPeriodFraction={stubPeriodFraction}
                    stubPeriodEndDate={
                      settings?.fiscalYearEnd
                        ? new Date().getFullYear() + '-' + settings.fiscalYearEnd
                        : ''
                    }
                    lastFYEDate={settings?.mostRecentFiscalYearEnd || ''}
                    valuationDate={settings?.valuationDate || ''}
                    stubInputs={stubInputs}
                    onStubInputChange={handleStubInputChange}
                    currency={currency}
                    unitMultiplier={unitMultiplier}
                  />
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* DCF Controls with Collapsible Sections */}
          <Collapsible
            open={isAdditionalControlsOpen}
            onOpenChange={setIsAdditionalControlsOpen}
            className="mb-4 w-full"
          >
            <Card className="border shadow-sm">
              <CollapsibleTrigger className="flex w-full items-center justify-between p-4 text-left">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5 text-primary" />
                  <span className="text-lg font-medium">DCF Controls</span>
                </div>
                <div className="text-muted-foreground">{isAdditionalControlsOpen ? '↑' : '↓'}</div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4">
                  {/* Valuation Parameters as a nested collapsible section */}
                  <Collapsible
                    open={isValuationParametersOpen}
                    onOpenChange={setIsValuationParametersOpen}
                    className="mb-4 w-full"
                  >
                    <Card className="border-0 shadow-none">
                      <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-left">
                        <div className="flex items-center gap-2">
                          <ChartBar className="h-5 w-5 text-primary" />
                          <span className="text-lg font-medium">Valuation Parameters</span>
                        </div>
                        <div className="text-muted-foreground">
                          {isValuationParametersOpen ? '↑' : '↓'}
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="py-4">
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
                        </div>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>

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
                    showMainControlSliders={false} /* Hide duplicate sliders */
                  />
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Key Assumptions component as a standalone collapsible card */}
          {assumptions && (
            <Collapsible
              open={isKeyAssumptionsOpen}
              onOpenChange={setIsKeyAssumptionsOpen}
              className="mb-4 w-full"
            >
              <Card className="border shadow-sm">
                <CollapsibleTrigger className="flex w-full items-center justify-between p-4 text-left">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-5 w-5 text-primary" />
                    <span className="text-lg font-medium">Key Assumptions</span>
                  </div>
                  <div className="text-muted-foreground">{isKeyAssumptionsOpen ? '↑' : '↓'}</div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4">
                    <DCFAssumptionsDisplay
                      assumptions={assumptions}
                      terminalAssumptions={(scenario as unknown as Scenario)?.terminalAssumptions}
                      forecastPeriod={forecastPeriod}
                      yearLabels={projectionYearLabels}
                    />
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* DCF Controls and Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4 w-full">
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

            <Card>
              <CardContent className="p-6">
                <TabsContent value="table-view" className="mt-0">
                  {dcf?.projections && (
                    <div>
                      <DCFMainTable
                        calculatedProjections={{
                          revenue: dcf.projections.revenue || [],
                          ebitda: dcf.projections.ebitda || [],
                          depreciation: dcf.projections.depreciation || [],
                          ebit: dcf.projections.ebit || [],
                          taxes: dcf.projections.taxes || [],
                          nopat: dcf.projections.taxes.map(
                            (tax, i) => dcf.projections.ebit[i] - tax
                          ),
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
                        stubPeriod={
                          isStubPeriod
                            ? {
                                isStubPeriod,
                                stubPeriodFraction,
                                fcf: calculateStubPeriodFCF().fcf,
                                discountedFcf: calculateStubPeriodFCF().discountedFcf,
                              }
                            : undefined
                        }
                      />

                      {/* Pass dynamic DCF data to the summary cards */}
                      <DCFSummaryCards
                        enterpriseValue={dcf.enterpriseValue || 0}
                        pvFcf={dcf.projections.discountedFcf || []}
                        pvTerminalValue={dcf.projections.discountedTerminalValue || 0}
                        impliedMultiple={dcf.impliedMultiple}
                        discountRate={discountRate}
                        terminalGrowthRate={terminalGrowthRate}
                        unitMultiplier={unitMultiplier}
                        currency={currency}
                        stubPeriod={
                          isStubPeriod
                            ? {
                                isStubPeriod,
                                stubPeriodFraction,
                                fcf: calculateStubPeriodFCF().fcf,
                                discountedFcf: calculateStubPeriodFCF().discountedFcf,
                              }
                            : undefined
                        }
                      />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="chart-view" className="mt-0">
                  {dcf?.projections && (
                    <DCFChartView
                      projectionYearLabels={projectionYearLabels}
                      calculatedProjections={{
                        revenue: dcf.projections.revenue || [],
                        ebit: dcf.projections.ebit || [],
                        fcf: dcf.projections.fcf || [],
                      }}
                      unitMultiplier={unitMultiplier}
                      currency={currency}
                      stubPeriod={
                        isStubPeriod
                          ? {
                              isStubPeriod,
                              stubPeriodFraction,
                              fcf: calculateStubPeriodFCF().fcf,
                              discountedFcf: calculateStubPeriodFCF().discountedFcf,
                            }
                          : undefined
                      }
                    />
                  )}
                </TabsContent>

                <TabsContent value="sensitivity-view" className="mt-0">
                  {dcf?.sensitivityMatrix && (
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
                      baseValueIndices={{
                        waccIdx: 2,
                        secondaryIdx: 2,
                      }}
                      discountRate={discountRate}
                      runSensitivityAnalysis={runSensitivityAnalysis}
                    />
                  )}
                </TabsContent>
              </CardContent>
            </Card>
          </Tabs>
        </div>
      </div>
    </WorkspaceHeaderLayout>
  )
}
