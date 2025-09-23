import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { formatPercent } from '@/utils/formatters'

interface DCFModelInputsProps {
  assumptions: any
  historicals: any
  settings: any
}

export function DCFModelInputs({ assumptions, historicals, settings }: DCFModelInputsProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">DCF Model Inputs</h2>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-medium">Forecast Period</h3>
              <p>{settings.forecastPeriod || 5} years</p>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-medium">Terminal Growth Rate</h3>
              <p>{formatPercent(settings.terminalGrowthRate || 0.02)}</p>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-medium">WACC</h3>
              <p>{formatPercent(settings.wacc || 0.1)}</p>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-medium">Tax Rate</h3>
              <p>{formatPercent(settings.taxRate || 0.25)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
