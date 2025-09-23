import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/utils/formatters'
import { Settings2 } from 'lucide-react'

interface ScenarioEV {
  id: string
  name: string
  enterpriseValue: number
  isActive?: boolean
}

interface ScenarioComparisonProps {
  scenarios: ScenarioEV[]
  unitMultiplier: number
  currency: string
  onNavigateToScenarioManager: () => void
}

export function ScenarioComparison({
  scenarios,
  unitMultiplier,
  currency,
  onNavigateToScenarioManager,
}: ScenarioComparisonProps) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium">Scenario Value Comparison</h3>
        <button
          onClick={onNavigateToScenarioManager}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
        >
          <Settings2 className="h-4 w-4" />
          Manage Scenarios
        </button>
      </div>
      <div className="grid gap-2">
        {scenarios.map((scenario) => (
          <div
            key={scenario.id}
            className={`flex items-center justify-between rounded-lg p-2 ${
              scenario.isActive ? 'bg-primary/10 dark:bg-primary/20' : 'bg-muted/5'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`text-sm ${scenario.isActive ? 'font-semibold' : 'font-medium'}`}>
                {scenario.name}
              </span>
              {scenario.isActive && (
                <Badge variant="secondary" className="text-xs">
                  Active
                </Badge>
              )}
            </div>
            <span className={`text-sm ${scenario.isActive ? 'font-bold' : 'font-semibold'}`}>
              {formatCurrency(scenario.enterpriseValue, { unitMultiplier, currency })}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}
