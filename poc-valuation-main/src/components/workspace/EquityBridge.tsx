import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/utils/formatters'
import { ArrowRight, MinusCircle, PlusCircle } from 'lucide-react'
import { useProjectSettings } from '@/contexts/ProjectSettingsContext'

interface EquityBridgeProps {
  enterpriseValue: number
  unitMultiplier?: number
  showDetailedItems?: boolean
}

// Update interface to include showNegative property
interface ExtendedFormatOptions {
  unitMultiplier?: number
  currency?: string
  decimals?: number
  showNegative?: boolean
}

export function EquityBridge({
  enterpriseValue,
  unitMultiplier = 1000000,
  showDetailedItems = false,
}: EquityBridgeProps) {
  const { settings } = useProjectSettings()

  // Default to settings values
  const cash = settings.cashBalance ?? 0
  const debt = settings.debtBalance ?? 0

  // Calculate equity value
  const equityValue = enterpriseValue + cash - debt

  // Define additional items for detailed view
  const additionalItems = showDetailedItems
    ? [
        { name: 'Preferred Equity', value: 0, isAddition: false },
        { name: 'Minority Interest', value: 0, isAddition: false },
      ]
    : []

  return (
    <div className="mb-6 flex items-center space-x-4">
      <div className="text-center">
        <div className="mb-1 text-sm text-muted-foreground">Enterprise Value</div>
        <div className="text-lg font-semibold">
          {formatCurrency(enterpriseValue, { unitMultiplier, currency: settings.currency })}
        </div>
      </div>

      <ArrowRight className="h-5 w-5 text-muted-foreground" />

      <div className="flex-1">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <PlusCircle className="mr-2 h-4 w-4 text-green-500" />
              <span>Cash & Equivalents</span>
            </div>
            <span className="font-medium text-green-600">
              {formatCurrency(cash, {
                unitMultiplier,
                currency: settings.currency,
                showNegative: false,
              } as ExtendedFormatOptions)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <MinusCircle className="mr-2 h-4 w-4 text-red-500" />
              <span>Total Debt</span>
            </div>
            <span className="font-medium text-red-600">
              {formatCurrency(debt, {
                unitMultiplier,
                currency: settings.currency,
                showNegative: true,
              } as ExtendedFormatOptions)}
            </span>
          </div>

          {showDetailedItems &&
            additionalItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  {item.isAddition ? (
                    <PlusCircle className="mr-2 h-4 w-4 text-green-500" />
                  ) : (
                    <MinusCircle className="mr-2 h-4 w-4 text-red-500" />
                  )}
                  <span>{item.name}</span>
                </div>
                <span
                  className={`font-medium ${item.isAddition ? 'text-green-600' : 'text-red-600'}`}
                >
                  {formatCurrency(item.value, {
                    unitMultiplier,
                    currency: settings.currency,
                    showNegative: !item.isAddition,
                  } as ExtendedFormatOptions)}
                </span>
              </div>
            ))}
        </div>
      </div>

      <ArrowRight className="h-5 w-5 text-muted-foreground" />

      <div className="text-center">
        <div className="mb-1 text-sm text-muted-foreground">Equity Value</div>
        <div className="text-lg font-semibold">
          {formatCurrency(equityValue, { unitMultiplier, currency: settings.currency })}
        </div>
      </div>
    </div>
  )
}
