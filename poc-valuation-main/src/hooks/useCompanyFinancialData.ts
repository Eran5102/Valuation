import { useState, useEffect } from 'react'
import { CompanyFinancialData, FinancialItem } from '@/pages/workspace/CompanyData'

interface FinancialDataResult {
  financialData: CompanyFinancialData | null
  isLoading: boolean
  lastModified: string | null
  getLastItemValue: (
    itemName: string,
    statementType: 'income' | 'balance' | 'cashflow'
  ) => number | null
  getItemByName: (
    itemName: string,
    statementType: 'income' | 'balance' | 'cashflow'
  ) => FinancialItem | null
  findSimilarItemByName: (
    searchTerm: string,
    statementType: 'income' | 'balance' | 'cashflow'
  ) => { item: FinancialItem; matchScore: number } | null
  refreshData: () => void
}

export function useCompanyFinancialData(): FinancialDataResult {
  const [financialData, setFinancialData] = useState<CompanyFinancialData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshCounter, setRefreshCounter] = useState(0)

  const loadFinancialData = () => {
    const savedData = localStorage.getItem('companyFinancialData')
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData) as CompanyFinancialData
        setFinancialData(parsedData)
        console.log('Financial data loaded:', parsedData)
      } catch (error) {
        console.error('Error loading company financial data:', error)
      }
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadFinancialData()

    // Add event listener for storage changes to keep data in sync across tabs
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'companyFinancialData') {
        loadFinancialData()
      }
    }

    // Also listen for custom events
    const handleCustomEvent = () => {
      loadFinancialData()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('companyFinancialDataUpdated', handleCustomEvent)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('companyFinancialDataUpdated', handleCustomEvent)
    }
  }, [refreshCounter])

  const refreshData = () => {
    setRefreshCounter((prev) => prev + 1)
  }

  // Helper to get the most recent value for a specific line item
  const getLastItemValue = (
    itemName: string,
    statementType: 'income' | 'balance' | 'cashflow'
  ): number | null => {
    if (!financialData) return null

    let items: FinancialItem[] = []

    switch (statementType) {
      case 'income':
        items = financialData.incomeStatementItems
        break
      case 'balance':
        items = financialData.balanceSheetItems
        break
      case 'cashflow':
        items = financialData.cashFlowItems
        break
    }

    const item = items.find((i) => i.item === itemName)
    if (!item || item.values.length === 0) return null

    return item.values[0] // Return the most recent value (first in the array)
  }

  // Helper to get an entire item by name
  const getItemByName = (
    itemName: string,
    statementType: 'income' | 'balance' | 'cashflow'
  ): FinancialItem | null => {
    if (!financialData) return null

    let items: FinancialItem[] = []

    switch (statementType) {
      case 'income':
        items = financialData.incomeStatementItems
        break
      case 'balance':
        items = financialData.balanceSheetItems
        break
      case 'cashflow':
        items = financialData.cashFlowItems
        break
    }

    const item = items.find((i) => i.item === itemName)
    return item || null
  }

  // Helper to find similar item by partial name match
  const findSimilarItemByName = (
    searchTerm: string,
    statementType: 'income' | 'balance' | 'cashflow'
  ): { item: FinancialItem; matchScore: number } | null => {
    if (!financialData) return null

    let items: FinancialItem[] = []

    switch (statementType) {
      case 'income':
        items = financialData.incomeStatementItems
        break
      case 'balance':
        items = financialData.balanceSheetItems
        break
      case 'cashflow':
        items = financialData.cashFlowItems
        break
    }

    if (items.length === 0) return null

    // First try exact match
    const exactMatch = items.find((i) => i.item.toLowerCase() === searchTerm.toLowerCase())
    if (exactMatch) {
      return { item: exactMatch, matchScore: 1 }
    }

    // If no exact match, try contains match
    const searchTermLower = searchTerm.toLowerCase()
    const matches = items
      .map((item) => {
        const itemNameLower = item.item.toLowerCase()
        // Check if the item name contains the search term
        if (itemNameLower.includes(searchTermLower)) {
          return {
            item,
            matchScore: searchTermLower.length / itemNameLower.length, // Higher score for closer matches
          }
        }

        // Check if search term contains the item name
        if (searchTermLower.includes(itemNameLower)) {
          return {
            item,
            matchScore: itemNameLower.length / searchTermLower.length,
          }
        }

        return { item, matchScore: 0 }
      })
      .filter((match) => match.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)

    return matches.length > 0 ? matches[0] : null
  }

  return {
    financialData,
    isLoading,
    lastModified: financialData?.lastModified || null,
    getLastItemValue,
    getItemByName,
    findSimilarItemByName,
    refreshData,
  }
}
