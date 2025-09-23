import { useEffect, useState, useRef } from 'react'
import { useCompanyFinancialData } from './useCompanyFinancialData'
import { toast } from '@/components/ui/sonner'

export function useCompanyDcfIntegration() {
  const { financialData, isLoading } = useCompanyFinancialData()
  const [lastActualRevenue, setLastActualRevenue] = useState<number | null>(null)
  const [lastActualEbitda, setLastActualEbitda] = useState<number | null>(null)

  // Add a ref to track if we've already shown the toast during this session
  const toastShownRef = useRef<boolean>(false)

  useEffect(() => {
    if (financialData && !isLoading) {
      // Find revenue item
      const revenueItem = financialData.incomeStatementItems.find(
        (item) =>
          item.item.toLowerCase().includes('revenue') || item.item.toLowerCase().includes('sales')
      )

      if (revenueItem && revenueItem.values.length > 0) {
        // Last value is most recent (most recent fiscal year)
        const revenueValue = revenueItem.values[revenueItem.values.length - 1]
        setLastActualRevenue(revenueValue)

        // Update localStorage with the full actual value
        localStorage.setItem('lastActualRevenue', revenueValue.toString())
        console.log(`Setting lastActualRevenue in localStorage: ${revenueValue}`)

        // Only show toast if it hasn't been shown already in this session
        if (!toastShownRef.current) {
          toast.success('Revenue data updated from company data')
          toastShownRef.current = true
        }
      }

      // Find EBITDA or calculate it
      const ebitdaItem = financialData.incomeStatementItems.find((item) =>
        item.item.toLowerCase().includes('ebitda')
      )

      if (ebitdaItem && ebitdaItem.values.length > 0) {
        const ebitdaValue = ebitdaItem.values[ebitdaItem.values.length - 1]
        setLastActualEbitda(ebitdaValue)
        localStorage.setItem('lastActualEbitda', ebitdaValue.toString())
        console.log(`Setting lastActualEbitda in localStorage: ${ebitdaValue}`)
      } else {
        // Try to calculate EBITDA from other metrics
        const ebitItem = financialData.incomeStatementItems.find(
          (item) =>
            item.item.toLowerCase() === 'ebit' ||
            item.item.toLowerCase().includes('operating income')
        )

        const depreciationItem = financialData.incomeStatementItems.find(
          (item) =>
            item.item.toLowerCase().includes('depreciation') ||
            item.item.toLowerCase().includes('amortization')
        )

        if (
          ebitItem &&
          ebitItem.values.length > 0 &&
          depreciationItem &&
          depreciationItem.values.length > 0
        ) {
          const lastIndex = ebitItem.values.length - 1
          const calculatedEbitda = ebitItem.values[lastIndex] + depreciationItem.values[lastIndex]
          setLastActualEbitda(calculatedEbitda)
          localStorage.setItem('lastActualEbitda', calculatedEbitda.toString())
          console.log(`Setting calculated lastActualEbitda in localStorage: ${calculatedEbitda}`)
        }
      }

      // Dispatch an event to notify other components
      window.dispatchEvent(new CustomEvent('companyFinancialDataUpdated'))
    }
  }, [financialData, isLoading])

  return {
    lastActualRevenue,
    lastActualEbitda,
    isLoading,
  }
}
