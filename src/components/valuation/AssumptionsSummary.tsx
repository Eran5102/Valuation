import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { AssumptionCategory } from './ValuationAssumptions'

interface AssumptionsSummaryProps {
  categories: AssumptionCategory[]
}

export function AssumptionsSummary({ categories }: AssumptionsSummaryProps) {
  // Handle undefined or empty categories
  if (!categories || categories.length === 0) {
    return null
  }

  const totalFilled = categories.reduce(
    (sum, cat) => sum + cat.assumptions.filter((a) => a.value).length,
    0
  )
  const totalAssumptions = categories.reduce((sum, cat) => sum + cat.assumptions.length, 0)
  const requiredMissing = categories.reduce(
    (sum, cat) => sum + cat.assumptions.filter((a) => a.required && !a.value).length,
    0
  )
  const completionPercentage =
    totalAssumptions > 0 ? Math.round((totalFilled / totalAssumptions) * 100) : 0

  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{totalFilled}</div>
            <div className="text-sm text-muted-foreground">Total Filled</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-muted-foreground">{totalAssumptions}</div>
            <div className="text-sm text-muted-foreground">Total Assumptions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{requiredMissing}</div>
            <div className="text-sm text-muted-foreground">Required Missing</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{completionPercentage}%</div>
            <div className="text-sm text-muted-foreground">Complete</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
