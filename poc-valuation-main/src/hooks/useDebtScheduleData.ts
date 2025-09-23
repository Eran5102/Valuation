import { useState, useEffect } from 'react'

// Interface for debt facility
export interface DebtFacility {
  id: string
  name: string
  initialBalance: number
  interestRate: number
  newDrawdowns: number[]
  principalRepayments: number[]
}

export interface DebtScheduleData {
  // Original properties
  openingDebtBalance: number[]
  interestRate: number
  principalRepaymentType: 'fixed' | 'percentage'
  principalRepaymentValue: number
  newDebtIssuance: number[]
  principalRepayment: number[]
  closingDebtBalance: number[]
  interestExpense: number[]
  importedFromCompanyData?: boolean
  lastModified?: string

  // New properties to match usage in DebtSchedule.tsx
  facilities?: DebtFacility[]
  schedule?: {
    openingDebtBalance: number[]
    newDebtIssuance: number[]
    principalRepayment: number[]
    closingDebtBalance: number[]
    interestExpense: number[]
  }
}

export function useDebtScheduleData(forecastPeriod: number): {
  debtSchedule: DebtScheduleData | null
  hasDebtSchedule: boolean
} {
  const [debtSchedule, setDebtSchedule] = useState<DebtScheduleData | null>(null)
  const [hasDebtSchedule, setHasDebtSchedule] = useState(false)

  useEffect(() => {
    const savedSchedule = localStorage.getItem('debtScheduleData')
    if (savedSchedule) {
      try {
        const parsedSchedule = JSON.parse(savedSchedule)
        setDebtSchedule(parsedSchedule)
        setHasDebtSchedule(true)
        console.log('Loaded debt schedule data:', parsedSchedule)
      } catch (error) {
        console.error('Error parsing debt schedule:', error)
        setHasDebtSchedule(false)
      }
    } else {
      setHasDebtSchedule(false)
    }
  }, [forecastPeriod])

  return { debtSchedule, hasDebtSchedule }
}
