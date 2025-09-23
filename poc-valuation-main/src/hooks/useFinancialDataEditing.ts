import { useState, useEffect } from 'react'
import { CompanyFinancialData, FinancialItem } from '@/pages/workspace/CompanyData'

interface UseFinancialDataEditingProps {
  initialIncomeStatementItems: FinancialItem[]
  initialBalanceSheetItems: FinancialItem[]
  initialCashFlowItems: FinancialItem[]
  fiscalYears: string[]
}

export function useFinancialDataEditing({
  initialIncomeStatementItems,
  initialBalanceSheetItems,
  initialCashFlowItems,
  fiscalYears,
}: UseFinancialDataEditingProps) {
  const [editMode, setEditMode] = useState(false)
  const [incomeItems, setIncomeItems] = useState<FinancialItem[]>(initialIncomeStatementItems)
  const [balanceItems, setBalanceItems] = useState<FinancialItem[]>(initialBalanceSheetItems)
  const [cashFlowItems, setCashFlowItems] = useState<FinancialItem[]>(initialCashFlowItems)

  // Create copies to store edits
  const [editedIncomeItems, setEditedIncomeItems] = useState<FinancialItem[]>([])
  const [editedBalanceItems, setEditedBalanceItems] = useState<FinancialItem[]>([])
  const [editedCashFlowItems, setEditedCashFlowItems] = useState<FinancialItem[]>([])

  // Update local state when props change
  useEffect(() => {
    setIncomeItems(initialIncomeStatementItems)
    setBalanceItems(initialBalanceSheetItems)
    setCashFlowItems(initialCashFlowItems)
  }, [initialIncomeStatementItems, initialBalanceSheetItems, initialCashFlowItems])

  // Initialize edited values when entering edit mode
  useEffect(() => {
    if (editMode) {
      setEditedIncomeItems(JSON.parse(JSON.stringify(incomeItems)))
      setEditedBalanceItems(JSON.parse(JSON.stringify(balanceItems)))
      setEditedCashFlowItems(JSON.parse(JSON.stringify(cashFlowItems)))
    }
  }, [editMode, incomeItems, balanceItems, cashFlowItems])

  const handleValueChange = (
    statementType: 'income' | 'balance' | 'cashflow',
    itemIndex: number,
    valueIndex: number,
    newValue: string
  ) => {
    const numericValue = parseFloat(newValue) || 0

    if (statementType === 'income') {
      const updatedItems = [...editedIncomeItems]
      updatedItems[itemIndex].values[valueIndex] = numericValue
      setEditedIncomeItems(updatedItems)
    } else if (statementType === 'balance') {
      const updatedItems = [...editedBalanceItems]
      updatedItems[itemIndex].values[valueIndex] = numericValue
      setEditedBalanceItems(updatedItems)
    } else if (statementType === 'cashflow') {
      const updatedItems = [...editedCashFlowItems]
      updatedItems[itemIndex].values[valueIndex] = numericValue
      setEditedCashFlowItems(updatedItems)
    }
  }

  const saveChanges = () => {
    if (editMode) {
      setIncomeItems(editedIncomeItems)
      setBalanceItems(editedBalanceItems)
      setCashFlowItems(editedCashFlowItems)
    }

    const dataToSave: CompanyFinancialData = {
      companyName: '', // Default values for required properties
      ticker: '',
      lastModified: new Date().toISOString(),
      incomeStatementItems: editMode ? editedIncomeItems : incomeItems,
      balanceSheetItems: editMode ? editedBalanceItems : balanceItems,
      cashFlowItems: editMode ? editedCashFlowItems : cashFlowItems,
      yearLabels: fiscalYears,
      currency: 'USD', // Default value
      unitMultiplier: 1, // Default value
    }

    localStorage.setItem('companyFinancialData', JSON.stringify(dataToSave))

    // Dispatch storage event to notify other components
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'companyFinancialData',
        newValue: JSON.stringify(dataToSave),
      })
    )

    // If in edit mode, exit edit mode
    if (editMode) {
      setEditMode(false)
    }

    return dataToSave
  }

  const cancelEditing = () => {
    setEditMode(false)
  }

  return {
    editMode,
    setEditMode,
    incomeItems,
    balanceItems,
    cashFlowItems,
    editedIncomeItems,
    editedBalanceItems,
    editedCashFlowItems,
    handleValueChange,
    saveChanges,
    cancelEditing,
  }
}
