'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Info, TrendingUp, ArrowRight, RefreshCw, AlertTriangle } from 'lucide-react'
import { useDCFModel } from '@/contexts/DCFModelContext'

interface ScenarioProjectionLinkProps {
  valuationId: string
  activeScenario?: any
}

export function ScenarioProjectionLink({
  valuationId,
  activeScenario,
}: ScenarioProjectionLinkProps) {
  const { updateFinancials, updateWorkingCapital, updateAssumptions, recalculateAll } =
    useDCFModel()

  const [isApplying, setIsApplying] = useState(false)
  const [scenarioImpact, setScenarioImpact] = useState<any>(null)

  // Calculate the impact of scenario on projections
  useEffect(() => {
    if (activeScenario?.assumptions) {
      calculateScenarioImpact()
    }
  }, [activeScenario])

  const calculateScenarioImpact = () => {
    if (!activeScenario?.assumptions) return

    const assumptions = activeScenario.assumptions
    const impact = {
      revenue: {
        growthRates: [],
        drivers: [],
      },
      margins: {
        grossMargin: null,
        ebitdaMargin: null,
        netMargin: null,
      },
      workingCapital: {
        dso: assumptions.daysReceivables,
        dio: assumptions.daysInventory,
        dpo: assumptions.daysPayables,
        cashConversionCycle:
          (assumptions.daysReceivables || 0) +
          (assumptions.daysInventory || 0) -
          (assumptions.daysPayables || 0),
      },
      capex: {
        maintenancePercent: assumptions.maintenanceCapexPercent,
        growthPercent: assumptions.growthCapexPercent,
        totalPercent:
          (assumptions.maintenanceCapexPercent || 0) + (assumptions.growthCapexPercent || 0),
      },
      balanceSheet: {
        debtToEquity: assumptions.debtToEquityRatio,
        currentRatio: assumptions.currentRatio,
        interestCoverage: assumptions.interestCoverageRatio,
      },
    }

    // Calculate revenue growth trajectory
    if (assumptions.revenueGrowthRate) {
      // Base growth rate with potential modifiers
      let baseGrowth = assumptions.revenueGrowthRate

      // Apply growth drivers if available
      if (assumptions.unitGrowthRate && assumptions.priceInflation) {
        const organicGrowth =
          (1 + assumptions.unitGrowthRate / 100) * (1 + assumptions.priceInflation / 100) - 1
        impact.revenue.drivers.push({
          type: 'Unit Growth',
          value: assumptions.unitGrowthRate,
          impact: 'Drives volume',
        })
        impact.revenue.drivers.push({
          type: 'Price Inflation',
          value: assumptions.priceInflation,
          impact: 'Pricing power',
        })
        baseGrowth = organicGrowth * 100
      }

      if (assumptions.marketShareGrowth) {
        baseGrowth += assumptions.marketShareGrowth
        impact.revenue.drivers.push({
          type: 'Market Share',
          value: assumptions.marketShareGrowth,
          impact: 'Competitive gains',
        })
      }

      // Create declining growth rate pattern
      for (let i = 0; i < 5; i++) {
        const declineRate = i * 0.15 // 15% annual decline in growth rate
        impact.revenue.growthRates.push(Math.max(baseGrowth * (1 - declineRate), 3))
      }
    }

    // Calculate margin trajectory
    if (assumptions.ebitdaMargin) {
      const baseMargin = assumptions.ebitdaMargin
      impact.margins.ebitdaMargin = baseMargin
      impact.margins.grossMargin = baseMargin * 1.6 // Approximate gross margin
      impact.margins.netMargin = baseMargin * 0.65 // Approximate net margin after tax
    }

    setScenarioImpact(impact)
  }

  const applyScenarioToProjections = async () => {
    if (!activeScenario?.assumptions || !scenarioImpact) return

    setIsApplying(true)
    try {
      const assumptions = activeScenario.assumptions

      // Update DCF assumptions
      await updateAssumptions({
        // Revenue assumptions
        revenueGrowthRates: scenarioImpact.revenue.growthRates,

        // Margin assumptions
        grossMargin: scenarioImpact.margins.grossMargin,
        ebitdaMargin: scenarioImpact.margins.ebitdaMargin,

        // Working capital assumptions
        daysReceivables: assumptions.daysReceivables || 45,
        daysInventory: assumptions.daysInventory || 60,
        daysPayables: assumptions.daysPayables || 30,

        // Capex assumptions
        capexMethod: assumptions.growthCapexPercent ? 'growth' : 'percentage',
        maintenanceCapexPercent: assumptions.maintenanceCapexPercent || 3,
        growthCapexPercent: assumptions.growthCapexPercent || 2,

        // Depreciation
        depreciationMethod: 'percentage',
        depreciationPercent: assumptions.depreciationRate || 5,

        // Tax
        effectiveTaxRate: assumptions.taxRate || 25,

        // Terminal value
        terminalGrowthRate: assumptions.terminalGrowthRate || 3,
        exitMultiple: assumptions.exitMultiple || 8,
      })

      // Trigger full recalculation
      await recalculateAll()

      // Show success
      const notification = document.createElement('div')
      notification.className =
        'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50'
      notification.textContent = 'Scenario applied to projections'
      document.body.appendChild(notification)
      setTimeout(() => notification.remove(), 3000)
    } catch (error) {
      console.error('Error applying scenario:', error)
    } finally {
      setIsApplying(false)
    }
  }

  if (!activeScenario) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No active scenario selected. Create or select a scenario to see its impact on projections.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Scenario Impact on Projections
            </CardTitle>
            <CardDescription>
              How "{activeScenario.name}" affects financial projections
            </CardDescription>
          </div>
          <Badge
            variant={
              activeScenario.type === 'bull'
                ? 'default'
                : activeScenario.type === 'bear'
                  ? 'destructive'
                  : 'secondary'
            }
          >
            {activeScenario.type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {scenarioImpact && (
          <>
            {/* Revenue Growth Impact */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Revenue Growth Trajectory</Label>
              <div className="flex items-center gap-2">
                {scenarioImpact.revenue.growthRates.map((rate: number, i: number) => (
                  <div key={i} className="flex items-center">
                    <Badge variant="outline" className="font-mono">
                      Y{i + 1}: {rate.toFixed(1)}%
                    </Badge>
                    {i < scenarioImpact.revenue.growthRates.length - 1 && (
                      <ArrowRight className="mx-1 h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
              {scenarioImpact.revenue.drivers.length > 0 && (
                <div className="mt-2 space-y-1">
                  {scenarioImpact.revenue.drivers.map((driver: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span>
                        {driver.type}: {driver.value}%
                      </span>
                      <span className="text-xs">({driver.impact})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Margin Impact */}
            {scenarioImpact.margins.ebitdaMargin && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Operating Margins</Label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-sm">
                    <div className="text-muted-foreground">Gross</div>
                    <div className="font-mono font-semibold">
                      {scenarioImpact.margins.grossMargin?.toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="text-muted-foreground">EBITDA</div>
                    <div className="font-mono font-semibold">
                      {scenarioImpact.margins.ebitdaMargin?.toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="text-muted-foreground">Net</div>
                    <div className="font-mono font-semibold">
                      {scenarioImpact.margins.netMargin?.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Working Capital Impact */}
            {scenarioImpact.workingCapital.dso && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Working Capital Cycle</Label>
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-sm">
                    <div className="text-muted-foreground">DSO</div>
                    <div className="font-mono font-semibold">
                      {scenarioImpact.workingCapital.dso} days
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="text-muted-foreground">DIO</div>
                    <div className="font-mono font-semibold">
                      {scenarioImpact.workingCapital.dio} days
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="text-muted-foreground">DPO</div>
                    <div className="font-mono font-semibold">
                      {scenarioImpact.workingCapital.dpo} days
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="text-muted-foreground">CCC</div>
                    <div className="font-mono font-semibold text-primary">
                      {scenarioImpact.workingCapital.cashConversionCycle} days
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Balance Sheet Metrics */}
            {scenarioImpact.balanceSheet.debtToEquity && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Balance Sheet Metrics</Label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-sm">
                    <div className="text-muted-foreground">D/E Ratio</div>
                    <div className="font-mono font-semibold">
                      {scenarioImpact.balanceSheet.debtToEquity}x
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="text-muted-foreground">Current</div>
                    <div className="font-mono font-semibold">
                      {scenarioImpact.balanceSheet.currentRatio}x
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="text-muted-foreground">Interest Cov</div>
                    <div className="font-mono font-semibold">
                      {scenarioImpact.balanceSheet.interestCoverage}x
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                This scenario will update revenue growth rates, operating margins, working capital
                assumptions, and balance sheet targets across all projection periods.
              </AlertDescription>
            </Alert>

            <Button onClick={applyScenarioToProjections} disabled={isApplying} className="w-full">
              {isApplying ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Applying Scenario...
                </>
              ) : (
                <>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Apply Scenario to All Projections
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
