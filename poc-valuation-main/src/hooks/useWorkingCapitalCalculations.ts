import { useCallback, useMemo } from 'react'

interface WorkingCapitalResults {
  revenue: number[]
  cogs: number[]
  accountsReceivable: number[]
  inventory: number[]
  otherCurrentAssets: number[]
  accountsPayable: number[]
  otherCurrentLiabilities: number[]
  totalCurrentAssets: number[]
  totalCurrentLiabilities: number[]
  netWorkingCapital: number[]
  nwcChange: number[]
}

export function useWorkingCapitalCalculations(
  assumptions: any,
  historicals: any,
  forecastPeriod: number
): WorkingCapitalResults {
  const calculateWorkingCapital = useCallback((): WorkingCapitalResults => {
    const results = {
      revenue: [] as number[],
      cogs: [] as number[],
      accountsReceivable: [] as number[],
      inventory: [] as number[],
      otherCurrentAssets: [] as number[],
      accountsPayable: [] as number[],
      otherCurrentLiabilities: [] as number[],
      totalCurrentAssets: [] as number[],
      totalCurrentLiabilities: [] as number[],
      netWorkingCapital: [] as number[],
      nwcChange: [] as number[],
    }

    console.log('Starting working capital calculation with assumptions:', assumptions)
    console.log('Starting working capital calculation with historicals:', historicals)
    console.log('Starting working capital calculation with forecastPeriod:', forecastPeriod)

    // Ensure we have valid inputs
    if (!assumptions || !historicals || !forecastPeriod || forecastPeriod <= 0) {
      console.error('Invalid inputs for working capital calculation')
      return results
    }

    // Helper function to get assumption value for a specific year
    // If the year is beyond our explicit assumptions, use the last available value
    const getAssumptionValue = (category: string, key: string, year: number): number => {
      const values = assumptions[category][key] || []
      if (year < values.length) {
        return values[year]
      } else if (values.length > 0) {
        return values[values.length - 1]
      }
      // Default values if no assumptions provided
      if (key === 'Sales Growth (%)') return 5
      if (key === 'COGS (% of Sales)') return 65
      if (key === 'Days Sales Outstanding (DSO)') return 45
      if (key === 'Days Inventory Held (DIH)') return 60
      if (key === 'Days Payable Outstanding (DPO)') return 30
      if (key === 'Prepaid & Other Curr Assets (% Sales)') return 2
      if (key === 'Accrued Liabilities (% Sales)') return 3
      return 0
    }

    // Start with historicals
    let lastRevenue = historicals.lastActualRevenue || 1000 // Default to 1000 if not provided
    let lastNwc = historicals.lastActualNwc || 150 // Default to 150 if not provided

    console.log('Initial values - lastRevenue:', lastRevenue, 'lastNwc:', lastNwc)

    for (let i = 0; i < forecastPeriod; i++) {
      // Get growth rate and cost ratios from assumptions
      const salesGrowth = getAssumptionValue('incomeCf', 'Sales Growth (%)', i) / 100
      const cogsPercent = getAssumptionValue('incomeCf', 'COGS (% of Sales)', i) / 100

      // DSO, DIH, DPO from assumptions (in days)
      const dso = getAssumptionValue('balanceSheet', 'Days Sales Outstanding (DSO)', i)
      const dih = getAssumptionValue('balanceSheet', 'Days Inventory Held (DIH)', i)
      const dpo = getAssumptionValue('balanceSheet', 'Days Payable Outstanding (DPO)', i)

      // Other working capital items as % of sales
      const otherCaPercent =
        getAssumptionValue('balanceSheet', 'Prepaid & Other Curr Assets (% Sales)', i) / 100
      const otherClPercent =
        getAssumptionValue('balanceSheet', 'Accrued Liabilities (% Sales)', i) / 100

      // Calculate revenue and cogs
      const currentRevenue = lastRevenue * (1 + salesGrowth)
      const currentCogs = currentRevenue * cogsPercent

      console.log(`Year ${i + 1}:`, {
        salesGrowth,
        cogsPercent,
        dso,
        dih,
        dpo,
        otherCaPercent,
        otherClPercent,
        currentRevenue,
        currentCogs,
      })

      // Calculate working capital components
      const currentAr = currentRevenue * (dso / 365)
      const currentInventory = currentCogs * (dih / 365)
      const currentAp = currentCogs * (dpo / 365)
      const currentOtherCurrentAssets = currentRevenue * otherCaPercent
      const currentOtherCurrentLiabilities = currentRevenue * otherClPercent

      console.log(`Year ${i + 1} WC components:`, {
        currentAr,
        currentInventory,
        currentAp,
        currentOtherCurrentAssets,
        currentOtherCurrentLiabilities,
      })

      // Calculate totals
      const currentTotalCurrentAssets = currentAr + currentInventory + currentOtherCurrentAssets
      const currentTotalCurrentLiabilities = currentAp + currentOtherCurrentLiabilities
      const currentNwc = currentTotalCurrentAssets - currentTotalCurrentLiabilities

      // Calculate change in NWC
      const currentNwcChange =
        i === 0 ? currentNwc - lastNwc : currentNwc - results.netWorkingCapital[i - 1]

      console.log(`Year ${i + 1} totals:`, {
        currentTotalCurrentAssets,
        currentTotalCurrentLiabilities,
        currentNwc,
        currentNwcChange,
      })

      // Push all calculated values to results arrays
      results.revenue.push(currentRevenue)
      results.cogs.push(currentCogs)
      results.accountsReceivable.push(currentAr)
      results.inventory.push(currentInventory)
      results.otherCurrentAssets.push(currentOtherCurrentAssets)
      results.accountsPayable.push(currentAp)
      results.otherCurrentLiabilities.push(currentOtherCurrentLiabilities)
      results.totalCurrentAssets.push(currentTotalCurrentAssets)
      results.totalCurrentLiabilities.push(currentTotalCurrentLiabilities)
      results.netWorkingCapital.push(currentNwc)
      results.nwcChange.push(currentNwcChange)

      lastRevenue = currentRevenue // Update for the next iteration
    }

    console.log('Final working capital calculation results:', results)

    return results
  }, [assumptions, historicals, forecastPeriod])

  return useMemo(() => calculateWorkingCapital(), [calculateWorkingCapital])
}
