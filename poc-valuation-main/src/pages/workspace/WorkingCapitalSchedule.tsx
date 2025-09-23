import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { WorkingCapitalSchedule } from '@/components/workspace/supporting-schedules/WorkingCapitalSchedule'
import { useWorkingCapitalCalculations } from '@/hooks/useWorkingCapitalCalculations'
import { useProjectSettings } from '@/contexts/ProjectSettingsContext'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { generateFiscalYearLabels } from '@/utils/fiscalYearUtils'
import { UNIT_OPTIONS } from '@/constants/unitOptions'
import { Database } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'

const ASSUMPTIONS = {
  incomeCf: {
    'Sales Growth (%)': [8, 7, 6, 5, 4, 3, 2],
    'COGS (% of Sales)': [65, 65, 64.5, 64, 63.5, 63, 63],
    'SG&A (% of Sales)': [15, 14.8, 14.6, 14.4, 14.2, 14, 14],
    'Depreciation (% of Sales)': [3, 3, 3, 3, 3, 3, 3],
    'CapEx (% of Sales)': [5, 4.5, 4, 4, 4, 4, 4],
  },
  balanceSheet: {
    'Days Sales Outstanding (DSO)': [45, 45, 44, 43, 42, 42, 42],
    'Days Inventory Held (DIH)': [60, 59, 58, 57, 56, 55, 55],
    'Days Payable Outstanding (DPO)': [30, 31, 32, 33, 34, 35, 35],
    'Prepaid & Other Curr Assets (% Sales)': [2, 2, 2, 2, 2, 2, 2],
    'Accrued Liabilities (% Sales)': [3, 3, 3, 3, 3, 3, 3],
  },
}

const HISTORICALS = {
  lastActualRevenue: 1000,
  lastActualNwc: 150,
}

export default function WorkingCapitalSchedulePage() {
  const { settings } = useProjectSettings()
  const [unitMultiplier, setUnitMultiplier] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [scenarioName] = useState('Base Case')

  const forecastPeriod = settings.maxProjectionYears

  const workingCapitalResults = useWorkingCapitalCalculations(
    ASSUMPTIONS,
    HISTORICALS,
    forecastPeriod
  )

  console.log('Working capital results directly from hook:', workingCapitalResults)
  console.log('Current unit multiplier:', unitMultiplier)
  console.log('Current forecastPeriod from settings:', forecastPeriod)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!isLoading && workingCapitalResults.revenue.some((val) => val > 0)) {
      toast.success('Working capital projections loaded successfully')
    }
  }, [isLoading, workingCapitalResults])

  // Updated to use generateFiscalYearLabels instead of generateProjectionLabels for consistency
  const projectionYearLabels = generateFiscalYearLabels(
    settings.mostRecentFiscalYearEnd,
    settings.fiscalYearEnd,
    forecastPeriod
  )

  const handleUnitChange = (value: string) => {
    console.log('Changing unit multiplier to:', value)
    setUnitMultiplier(Number(value))
  }

  return (
    <div className="w-full">
      <PageHeader
        title="Working Capital Schedule"
        icon={<Database className="h-5 w-5" />}
        description="This schedule calculates the projected changes in working capital based on the key operating assumptions."
      />

      <div className="my-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
            Active Scenario: {scenarioName}
          </Badge>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Display Units:</span>
            <Select value={String(unitMultiplier)} onValueChange={handleUnitChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select units" />
              </SelectTrigger>
              <SelectContent>
                {UNIT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={String(option.value)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <WorkingCapitalSchedule
              workingCapitalData={workingCapitalResults}
              projectionYearLabels={projectionYearLabels}
              forecastPeriod={forecastPeriod}
              unitMultiplier={unitMultiplier}
              currency={settings.currency}
              assumptions={ASSUMPTIONS}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
