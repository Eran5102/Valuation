import React, { useEffect, useState } from 'react'
import { formatNumber, formatPercent, formatCurrency } from '@/utils/formatters'

interface DynamicContentValueProps {
  contentId: string
  format?: {
    type?: 'currency' | 'percent' | 'decimal' | 'multiple'
    decimals?: number
    unitMultiplier?: number
    color?: string // Optional color override from theme
  }
}

// Mock data function - In a real application, this would fetch from your state management
const fetchDynamicValue = (contentId: string): { value: number | string; isLoading: boolean } => {
  // This is just mock data - in a real app this would connect to your state management
  const mockData: Record<string, number | string> = {
    'final-weighted-equity-value': 156000000,
    'final-price-per-share': 12.58,
    'final-weighted-ev': 180000000,
    'calculated-wacc': 0.1245,
    'cost-of-equity': 0.135,
    'after-tax-cost-of-debt': 0.048,
    'relevered-beta': 1.35,
    'qualitative-risk-premium': 0.02,
    'dcf-implied-ev': 175000000,
    'terminal-value': 145000000,
    'terminal-growth-rate': 0.025,
    'exit-multiple-used': 8.5,
    'cca-median-ev-ebitda': 7.8,
    'pta-median-ev-revenue': 2.2,
    'selected-cca-metric-value': 165000000,
    'selected-pta-metric-value': 170000000,
    'active-scenario-name': 'Base Case',
    'wacc-rate': 0.1245,
    'terminal-growth-rate-assumption': 0.025,
    'exit-multiple': 8.5,
    'equity-value-range': '140,000,000 - 160,000,000',
    'price-per-share': 12.58,
    'fully-diluted-shares': 12500000,
    'company-name': 'Acme Corporation',
    'valuation-date': '2025-04-01',
    'client-name': 'John Smith',
    'purpose-of-valuation': 'Annual Valuation',
  }

  return {
    value: mockData[contentId] || 'N/A',
    isLoading: false,
  }
}

export function DynamicContentValue({ contentId, format }: DynamicContentValueProps) {
  const [formattedValue, setFormattedValue] = useState<string>('...')
  const { value, isLoading } = fetchDynamicValue(contentId)

  useEffect(() => {
    if (isLoading) {
      setFormattedValue('Loading...')
      return
    }

    if (value === 'N/A' || value === undefined || value === null) {
      setFormattedValue('N/A')
      return
    }

    if (typeof value === 'string' && !format?.type) {
      // If it's already a string and no format is specified
      setFormattedValue(value)
      return
    }

    // Apply formatting based on the format type
    if (format) {
      try {
        const numericValue = Number(value)
        switch (format.type) {
          case 'currency':
            setFormattedValue(
              formatCurrency(numericValue, {
                unitMultiplier: format.unitMultiplier || 1,
                decimals: format.decimals || 0,
              })
            )
            break
          case 'percent':
            setFormattedValue(formatPercent(numericValue, format.decimals || 1))
            break
          case 'multiple':
            setFormattedValue(`${formatNumber(numericValue, { decimals: format.decimals || 1 })}x`)
            break
          case 'decimal':
            setFormattedValue(formatNumber(numericValue, { decimals: format.decimals || 0 }))
            break
          default:
            setFormattedValue(String(value))
        }
      } catch (error) {
        console.error('Error formatting value:', error)
        setFormattedValue(String(value))
      }
    } else {
      // Default formatting if no format is specified
      setFormattedValue(String(value))
    }
  }, [value, isLoading, format])

  // Apply the color style if specified
  const style = format?.color ? { color: format.color } : undefined

  return (
    <span className="dynamic-content-value" style={style}>
      {formattedValue}
    </span>
  )
}
