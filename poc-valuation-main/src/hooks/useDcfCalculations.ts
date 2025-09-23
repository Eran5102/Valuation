import { useState, useCallback, useEffect } from 'react'
import { useProjectSettings } from '@/contexts/ProjectSettingsContext'
import { differenceInDays } from 'date-fns'

export interface DcfCalculationParams {
  forecastPeriod: number
  revenueGrowthRates: number[]
  ebitdaMargins: number[]
  taxRate: number
  depreciationRates: number[]
  capexPercentages: number[]
  nwcPercentages: number[]
  terminalGrowthRate: number
  wacc: number
  initialRevenue: number
  exitMultiple?: number
  // Add terminal year PGM assumptions
  terminalNopatMargin?: number
  terminalReinvestmentRate?: number
  // Add stub period parameters
  isStubPeriod?: boolean
  stubPeriodFraction?: number
  stubPeriodInputs?: {
    revenue: number
    ebit: number
    taxes: number
    depreciation: number
    capex: number
    nwcChange: number
  }
}

export interface DcfResults {
  enterpriseValue: number
  equityValue: number
  impliedMultiple: number
  irr: number
  npv: number
  paybackPeriod: number
  projections: {
    years: string[]
    revenue: number[]
    ebitda: number[]
    taxes: number[]
    depreciation: number[]
    capex: number[]
    nwcChanges: number[]
    fcf: number[]
    discountFactors: number[]
    discountedFcf: number[]
    terminalValue: number
    discountedTerminalValue: number
    totalPV?: number // Add this field for compatibility
    ebit?: number[] // Add this field for compatibility
  }
  sensitivityMatrix: {
    waccRange: number[]
    growthRange: number[]
    values: number[][]
  }
  hasCustomDepreciationSchedule: boolean
  // Add new properties for terminal year assumptions
  terminalYearAssumptions?: {
    nopatMargin: number
    reinvestmentRate: number
    impliedRoic?: number
  }
  // Add stub period information to results
  stubPeriod?: {
    isStubPeriod: boolean
    stubPeriodFraction: number
    fcf: number
    discountedFcf: number
  }
}

export function useDcfCalculations() {
  const { settings } = useProjectSettings()
  const [results, setResults] = useState<DcfResults | null>(null)
  const [forceRefresh, setForceRefresh] = useState<number>(0)

  // Listen for tax rate changes from Core Assumptions
  useEffect(() => {
    const handleTaxRateChanged = (event: CustomEvent) => {
      // When tax rate changes, if we have results, we should recalculate
      if (results && event.detail && typeof event.detail.value === 'number') {
        console.log(`DCF Calculation: Detected tax rate change to ${event.detail.value}%`)
        setForceRefresh((prev) => prev + 1) // Force a recalculation
      }
    }

    const handleDepreciationSourceChanged = (event: CustomEvent) => {
      if (event.detail && typeof event.detail.value === 'string') {
        console.log(`DCF Calculation: Detected depreciation source change to ${event.detail.value}`)
        setForceRefresh((prev) => prev + 1) // Force a recalculation
      }
    }

    window.addEventListener('taxRateChanged', handleTaxRateChanged as EventListener)
    window.addEventListener(
      'depreciationSourceChanged',
      handleDepreciationSourceChanged as EventListener
    )

    return () => {
      window.removeEventListener('taxRateChanged', handleTaxRateChanged as EventListener)
      window.removeEventListener(
        'depreciationSourceChanged',
        handleDepreciationSourceChanged as EventListener
      )
    }
  }, [results])

  // Calculate stub period fraction based on valuation date and most recent FYE
  const calculateStubPeriodInfo = useCallback(() => {
    // Get the valuation date from settings
    const valuationDate = settings?.valuationDate ? new Date(settings.valuationDate) : new Date()

    // Get the most recent fiscal year end date from settings
    let mostRecentFYEDate: Date | null = null
    if (settings?.mostRecentFiscalYearEnd) {
      mostRecentFYEDate = new Date(settings.mostRecentFiscalYearEnd)
    }

    // If no date is available, return no stub period
    if (!mostRecentFYEDate) {
      return {
        isStubPeriod: false,
        stubPeriodFraction: 0,
        mostRecentFYEDate: null,
        valuationDate,
      }
    }

    // Check if valuation date is different from FYE
    const isStubPeriod = valuationDate.getTime() !== mostRecentFYEDate.getTime()

    // Calculate stub period fraction (days between dates / 365)
    let stubPeriodFraction = 0
    if (isStubPeriod && valuationDate > mostRecentFYEDate) {
      const daysDifference = differenceInDays(valuationDate, mostRecentFYEDate)
      stubPeriodFraction = daysDifference / 365
    }

    return {
      isStubPeriod,
      stubPeriodFraction,
      mostRecentFYEDate,
      valuationDate,
    }
  }, [settings?.valuationDate, settings?.mostRecentFiscalYearEnd])

  const calculateDcf = useCallback(
    (params: DcfCalculationParams): DcfResults => {
      const {
        forecastPeriod,
        revenueGrowthRates,
        ebitdaMargins,
        taxRate,
        depreciationRates,
        capexPercentages,
        nwcPercentages,
        terminalGrowthRate,
        wacc,
        initialRevenue,
        exitMultiple,
        // Get terminal year PGM assumptions from params or fallback to settings
        terminalNopatMargin = settings.terminalNopatMargin || 15,
        terminalReinvestmentRate = settings.terminalReinvestmentRate || 40,
        // Stub period parameters
        isStubPeriod = false,
        stubPeriodFraction = 0,
        stubPeriodInputs = {
          revenue: 0,
          ebit: 0,
          taxes: 0,
          depreciation: 0,
          capex: 0,
          nwcChange: 0,
        },
      } = params

      // Get current depreciation source from settings
      const depreciationSource = settings.depreciationSource || 'scenario'

      // Check if there's a custom depreciation schedule in localStorage
      let hasCustomSchedule = depreciationSource === 'schedule'
      let customDepreciation: number[] | null = null
      let customCapex: number[] | null = null

      try {
        const savedSchedule = localStorage.getItem('depreciationCapexSchedule')
        if (savedSchedule && depreciationSource === 'schedule') {
          const parsedSchedule = JSON.parse(savedSchedule)
          if (parsedSchedule && parsedSchedule.schedule) {
            hasCustomSchedule = true
            customDepreciation = parsedSchedule.schedule.depreciation || null
            customCapex = parsedSchedule.schedule.projectedCapex || null
            console.log('Using custom depreciation schedule:', {
              depreciation: customDepreciation,
              capex: customCapex,
            })
          }
        }
      } catch (error) {
        console.error('Error loading custom depreciation/capex schedule:', error)
      }

      // Years array for projections
      const years = Array.from(
        { length: forecastPeriod },
        (_, i) => `${new Date().getFullYear() + i}`
      )

      // Log the initial revenue and growth rates for debugging
      console.log(`DCF Calculation - Initial Revenue: ${initialRevenue}`)
      console.log(`DCF Calculation - Growth Rates: ${JSON.stringify(revenueGrowthRates)}`)

      // Calculate revenue projections - properly use initial revenue and growth rates
      const revenue = [initialRevenue]

      for (let i = 0; i < forecastPeriod; i++) {
        const growthRate = revenueGrowthRates[i] !== undefined ? revenueGrowthRates[i] : 0.05 // Default to 5% if not specified
        const nextRevenue = revenue[i] * (1 + growthRate)
        revenue.push(nextRevenue)
        console.log(`Year ${i + 1} revenue: ${nextRevenue} (growth rate: ${growthRate})`)
      }
      revenue.shift() // Remove initial revenue

      // Calculate EBITDA
      const ebitda = revenue.map((rev, i) => rev * ebitdaMargins[i])

      // Calculate depreciation (use custom schedule if available)
      let depreciation
      if (hasCustomSchedule && customDepreciation && customDepreciation.length >= forecastPeriod) {
        console.log('Using custom depreciation schedule')
        depreciation = customDepreciation.slice(0, forecastPeriod)
      } else {
        console.log('Using scenario-based depreciation rates')
        depreciation = revenue.map((rev, i) => rev * depreciationRates[i])
      }

      // Calculate EBIT
      const ebit = ebitda.map((eb, i) => eb - depreciation[i])

      // Calculate taxes (EBITDA - Depreciation) * Tax Rate
      const taxes = ebitda.map((eb, i) => (eb - depreciation[i]) * taxRate)

      // Calculate capex (use custom schedule if available)
      let capex
      if (hasCustomSchedule && customCapex && customCapex.length >= forecastPeriod) {
        console.log('Using custom capex schedule')
        capex = customCapex.slice(0, forecastPeriod)
      } else {
        console.log('Using scenario-based capex percentages')
        capex = revenue.map((rev, i) => rev * capexPercentages[i])
      }

      // Calculate changes in net working capital
      const nwcChanges = revenue.map((rev, i) => rev * nwcPercentages[i])

      // Calculate free cash flow
      const fcf = ebitda.map((eb, i) => eb - taxes[i] - capex[i] - nwcChanges[i])

      // Calculate discount factors
      const discountFactors = Array.from(
        { length: forecastPeriod },
        (_, i) => 1 / Math.pow(1 + wacc, i + 1)
      )

      // Calculate discounted FCF
      const discountedFcf = fcf.map((cf, i) => cf * discountFactors[i])

      // Calculate stub period FCF and discount it
      let stubPeriodFcf = 0
      let stubPeriodDiscountedFcf = 0

      // Only calculate stub period values if we have a stub period
      if (isStubPeriod && stubPeriodFraction > 0) {
        // Calculate stub period FCF directly from inputs
        stubPeriodFcf =
          stubPeriodInputs.ebit -
          stubPeriodInputs.taxes +
          stubPeriodInputs.depreciation -
          stubPeriodInputs.capex -
          stubPeriodInputs.nwcChange

        // Discount the stub period FCF (stub period is less than a year)
        stubPeriodDiscountedFcf = stubPeriodFcf / Math.pow(1 + wacc, stubPeriodFraction)

        console.log(`Stub Period FCF: ${stubPeriodFcf}, Discounted: ${stubPeriodDiscountedFcf}`)
      }

      // Calculate terminal value with terminal year assumptions
      let terminalValue
      if (exitMultiple) {
        // Terminal value based on exit multiple
        terminalValue = ebitda[ebitda.length - 1] * exitMultiple
      } else {
        // Terminal value based on perpetuity growth with terminal year assumptions
        // Use the PGM model with terminal NOPAT margin and reinvestment rate

        // Get final year revenue and calculate terminal year NOPAT
        const terminalYearRevenue = revenue[revenue.length - 1] * (1 + terminalGrowthRate)
        const terminalYearNopat = terminalYearRevenue * (terminalNopatMargin / 100)

        // Calculate terminal FCF using the reinvestment rate
        // FCF = NOPAT * (1 - Reinvestment Rate)
        const terminalYearFcf = terminalYearNopat * (1 - terminalReinvestmentRate / 100)

        // Terminal value using PGM formula: FCF * (1 + g) / (wacc - g)
        terminalValue = terminalYearFcf / (wacc - terminalGrowthRate)

        console.log(`Terminal Value Calculation:
        Terminal Year Revenue: ${terminalYearRevenue}
        Terminal NOPAT Margin: ${terminalNopatMargin}%
        Terminal Year NOPAT: ${terminalYearNopat}
        Terminal Reinvestment Rate: ${terminalReinvestmentRate}%
        Terminal Year FCF: ${terminalYearFcf}
        WACC: ${wacc * 100}%
        Terminal Growth Rate: ${terminalGrowthRate * 100}%
        Terminal Value: ${terminalValue}
      `)
      }

      // Discount terminal value
      const discountedTerminalValue = terminalValue * discountFactors[discountFactors.length - 1]

      // Calculate enterprise value (including stub period if applicable)
      const enterpriseValue =
        (isStubPeriod ? stubPeriodDiscountedFcf : 0) + // Include stub period FCF if applicable
        discountedFcf.reduce((sum, val) => sum + val, 0) +
        discountedTerminalValue

      // Calculate total PV (for compatibility)
      const totalPV = enterpriseValue

      // Assume equity value is enterprise value for simplicity (no debt/cash adjustment)
      const equityValue = enterpriseValue

      // Calculate implied multiple
      const impliedMultiple = enterpriseValue / ebitda[0]

      // Generate sensitivity analysis matrix
      const waccRange = [wacc - 0.02, wacc - 0.01, wacc, wacc + 0.01, wacc + 0.02]
      const growthRange = [
        terminalGrowthRate - 0.01,
        terminalGrowthRate - 0.005,
        terminalGrowthRate,
        terminalGrowthRate + 0.005,
        terminalGrowthRate + 0.01,
      ]

      // Create sensitivity matrix
      const sensitivityValues: number[][] = []
      for (const w of waccRange) {
        const row: number[] = []
        for (const g of growthRange) {
          // Calculate EV with these sensitivity parameters
          const discFactors = Array.from(
            { length: forecastPeriod },
            (_, i) => 1 / Math.pow(1 + w, i + 1)
          )

          const discFcf = fcf.map((cf, i) => cf * discFactors[i])

          let tv
          if (exitMultiple) {
            tv = ebitda[ebitda.length - 1] * exitMultiple
          } else {
            tv = (fcf[fcf.length - 1] * (1 + g)) / (w - g)
          }

          const discTv = tv * discFactors[discFactors.length - 1]
          const ev = discFcf.reduce((sum, val) => sum + val, 0) + discTv
          row.push(ev)
        }
        sensitivityValues.push(row)
      }

      // Simplified IRR calculation (not accurate, just for placeholder)
      const irr = wacc + 0.005

      // Simplified NPV calculation
      const npv = enterpriseValue

      // Simplified payback period calculation
      let cumulativeCF = 0
      let paybackPeriod = 0
      for (let i = 0; i < discountedFcf.length; i++) {
        cumulativeCF += discountedFcf[i]
        if (cumulativeCF >= 0) {
          paybackPeriod = i + 1
          break
        }
      }

      // Calculate implied ROIC for terminal year
      const impliedRoic =
        terminalReinvestmentRate > 0 ? (terminalGrowthRate * 100) / terminalReinvestmentRate : 0

      const result: DcfResults = {
        enterpriseValue,
        equityValue,
        impliedMultiple,
        irr,
        npv,
        paybackPeriod,
        projections: {
          years,
          revenue,
          ebitda,
          taxes,
          depreciation,
          capex,
          nwcChanges,
          fcf,
          discountFactors,
          discountedFcf,
          terminalValue,
          discountedTerminalValue,
          totalPV,
          ebit,
        },
        sensitivityMatrix: {
          waccRange: [wacc - 0.02, wacc - 0.01, wacc, wacc + 0.01, wacc + 0.02],
          growthRange: [
            terminalGrowthRate - 0.01,
            terminalGrowthRate - 0.005,
            terminalGrowthRate,
            terminalGrowthRate + 0.005,
            terminalGrowthRate + 0.01,
          ],
          values: [
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
          ],
        },
        hasCustomDepreciationSchedule: hasCustomSchedule,
        // Add terminal year assumptions to results
        terminalYearAssumptions: {
          nopatMargin: terminalNopatMargin,
          reinvestmentRate: terminalReinvestmentRate,
          impliedRoic: impliedRoic,
        },
        // Add stub period information if applicable
        stubPeriod: isStubPeriod
          ? {
              isStubPeriod,
              stubPeriodFraction,
              fcf: stubPeriodFcf,
              discountedFcf: stubPeriodDiscountedFcf,
            }
          : undefined,
      }

      // Now update the sensitivity matrix with real values
      for (let i = 0; i < result.sensitivityMatrix.waccRange.length; i++) {
        for (let j = 0; j < result.sensitivityMatrix.growthRange.length; j++) {
          const w = result.sensitivityMatrix.waccRange[i]
          const g = result.sensitivityMatrix.growthRange[j]

          // Calculate terminal value with these sensitivity parameters
          let tv
          if (exitMultiple) {
            tv = ebitda[ebitda.length - 1] * exitMultiple
          } else {
            tv = (fcf[fcf.length - 1] * (1 + g)) / (w - g)
          }

          const discFactors = Array.from(
            { length: forecastPeriod },
            (_, i) => 1 / Math.pow(1 + w, i + 1)
          )
          const discFcf = fcf.map((cf, idx) => cf * discFactors[idx])
          const discTv = tv * discFactors[discFactors.length - 1]

          result.sensitivityMatrix.values[i][j] =
            discFcf.reduce((sum, val) => sum + val, 0) + discTv
        }
      }

      setResults(result)
      return result
    },
    [settings.depreciationSource, settings.terminalNopatMargin, settings.terminalReinvestmentRate]
  )

  // This compatibility function allows calling the hook with all parameters directly
  const calculateDcfWithParams = useCallback(
    (
      assumptions: any,
      historicals: any,
      settings: any,
      forecastPeriod: number,
      discountRate: number,
      taxRate: number,
      terminalValueMethod: string,
      terminalGrowthRate: number,
      exitMultipleValue: number,
      exitMultipleMetric: string,
      depreciationSource: 'scenario' | 'schedule'
    ): DcfResults | null => {
      // Log the historicals data for debugging
      console.log('DCF calculation with historicals:', historicals)
      console.log('DCF calculation with tax rate:', taxRate)
      console.log('DCF calculation with depreciation source:', depreciationSource)

      // Extract necessary data from assumptions
      const revenueGrowthRates =
        assumptions?.incomeCf?.['Sales Growth (%)']?.map((rate: number) => rate / 100) ||
        Array(forecastPeriod).fill(0.05)
      console.log('Using revenue growth rates:', revenueGrowthRates)

      const ebitdaMargins = Array(forecastPeriod).fill(0.2) // Extract from assumptions if available
      const depreciationRates =
        assumptions?.incomeCf?.['Depreciation (% of Sales)']?.map((rate: number) => rate / 100) ||
        Array(forecastPeriod).fill(0.03)
      const capexPercentages =
        assumptions?.incomeCf?.['CapEx (% of Sales)']?.map((rate: number) => rate / 100) ||
        Array(forecastPeriod).fill(0.05)
      const nwcPercentages = Array(forecastPeriod).fill(0.02) // Extract from assumptions if available

      // Get initial revenue from historicals or localStorage
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

      // Get terminal year assumptions from settings
      const terminalNopatMargin = settings.terminalNopatMargin || 15
      const terminalReinvestmentRate = settings.terminalReinvestmentRate || 40

      console.log(
        `Using terminal assumptions - NOPAT Margin: ${terminalNopatMargin}%, Reinvestment Rate: ${terminalReinvestmentRate}%`
      )

      // Use the core function with adapted parameters
      const calculationParams: DcfCalculationParams = {
        forecastPeriod,
        revenueGrowthRates,
        ebitdaMargins,
        taxRate: taxRate / 100, // Convert from percentage to decimal
        depreciationRates,
        capexPercentages,
        nwcPercentages,
        terminalGrowthRate: terminalGrowthRate / 100, // Convert from percentage to decimal
        wacc: discountRate / 100, // Convert from percentage to decimal
        initialRevenue,
        exitMultiple: exitMultipleValue,
        terminalNopatMargin: terminalNopatMargin,
        terminalReinvestmentRate: terminalReinvestmentRate,
      }

      if (!results) {
        return calculateDcf(calculationParams)
      }

      return {
        ...results,
        hasCustomDepreciationSchedule: depreciationSource === 'schedule',
      }
    },
    [calculateDcf, results]
  )

  // Force recalculation when settings change
  useEffect(() => {
    if (forceRefresh > 0 && results) {
      console.log('Forcing DCF recalculation due to external changes')
      // This would ideally trigger the recalculation, but we need the parameters
      // Since we don't have them here, we'll rely on the parent component to
      // trigger the recalculation by changing its own state

      // Dispatch an event to notify parent components to recalculate
      window.dispatchEvent(new CustomEvent('dcfRecalculationNeeded'))
    }
  }, [forceRefresh, results])

  return {
    calculateDcf,
    calculateDcfWithParams,
    calculateStubPeriodInfo,
    results,
    projections: results?.projections,
    sensitivityMatrix: results?.sensitivityMatrix,
    hasCustomDepreciationSchedule: results?.hasCustomDepreciationSchedule || false,
    terminalYearAssumptions: results?.terminalYearAssumptions,
    stubPeriod: results?.stubPeriod,
  }
}

// This named export matches what other files are importing
export default useDcfCalculations
