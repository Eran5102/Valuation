import React from 'react'
import { AssumptionTable } from './AssumptionTable'
import { useProjectSettings } from '@/contexts/ProjectSettingsContext'
import { generateFiscalYearLabels } from '@/utils/fiscalYearUtils'
import { ScenarioAssumptions, TerminalAssumptions } from '@/utils/scenarioUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Info } from 'lucide-react'

interface DCFAssumptionsTabProps {
  assumptions: ScenarioAssumptions
  terminalAssumptions?: TerminalAssumptions
  onAssumptionsChange: (
    category: 'incomeCf' | 'balanceSheet',
    label: string,
    values: number[]
  ) => void
  onTerminalAssumptionsChange?: (terminalAssumptions: Partial<TerminalAssumptions>) => void
  forecastPeriod: number
  readonly?: boolean
  showTerminalColumn?: boolean
  terminalValueMethod?: string
}

export function DCFAssumptionsTab({
  assumptions,
  terminalAssumptions,
  onAssumptionsChange,
  onTerminalAssumptionsChange,
  forecastPeriod,
  readonly = false,
  showTerminalColumn = true,
  terminalValueMethod = 'PGM',
}: DCFAssumptionsTabProps) {
  const { settings } = useProjectSettings()

  // Use fiscal year labels for consistency across the app
  const yearLabels = generateFiscalYearLabels(
    settings.mostRecentFiscalYearEnd,
    settings.fiscalYearEnd,
    forecastPeriod
  )

  // Get the keys from the assumptions object with proper type safety
  const incomeCfKeys = Object.keys(assumptions.incomeCf)
  const balanceSheetKeys = Object.keys(assumptions.balanceSheet)

  // Handle terminal assumption changes
  const handleTerminalAssumptionChange =
    (key: keyof TerminalAssumptions) => (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onTerminalAssumptionsChange) {
        const value = parseFloat(e.target.value)
        if (!isNaN(value)) {
          onTerminalAssumptionsChange({ [key]: value })
        }
      }
    }

  // Calculate implied ROIC if we have both growth rate and reinvestment rate
  const impliedRoic =
    terminalAssumptions?.terminalReinvestmentRate &&
    terminalAssumptions.terminalReinvestmentRate > 0
      ? (terminalAssumptions.terminalGrowthRate / terminalAssumptions.terminalReinvestmentRate) *
        100
      : 0

  return (
    <div className="space-y-6">
      <AssumptionTable
        title="Income Statement & Cash Flow Assumptions"
        yearLabels={yearLabels}
        assumptions={incomeCfKeys}
        values={assumptions.incomeCf}
        onChange={(label, values) => onAssumptionsChange('incomeCf', label, values)}
        disabled={readonly}
        showTerminalColumn={showTerminalColumn}
      />

      <AssumptionTable
        title="Balance Sheet Assumptions"
        yearLabels={yearLabels}
        assumptions={balanceSheetKeys}
        values={assumptions.balanceSheet}
        onChange={(label, values) => onAssumptionsChange('balanceSheet', label, values)}
        disabled={readonly}
        showTerminalColumn={showTerminalColumn}
      />

      {/* Terminal Year Assumptions Section */}
      {(terminalValueMethod === 'PGM' || !terminalValueMethod) && (
        <Card className="mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">
              Terminal Year Assumptions (for Perpetuity Growth Method)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="terminalGrowthRate">Terminal Growth Rate (g) (%)</Label>
                  <TooltipProvider>
                    <Tooltip content="The assumed constant rate FCF will grow indefinitely after the explicit forecast. Should generally be &lt;= long-term nominal GDP growth.">
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="terminalGrowthRate"
                  type="number"
                  step="0.1"
                  value={
                    terminalAssumptions?.terminalGrowthRate || settings.terminalGrowthRate || 2
                  }
                  onChange={handleTerminalAssumptionChange('terminalGrowthRate')}
                  disabled={readonly}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="terminalNopatMargin">Terminal NOPAT Margin (%)</Label>
                  <TooltipProvider>
                    <Tooltip content="The expected stable Net Operating Profit After Tax as a percentage of Revenue in the terminal year.">
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="terminalNopatMargin"
                  type="number"
                  step="0.1"
                  value={
                    terminalAssumptions?.terminalNopatMargin || settings.terminalNopatMargin || 15
                  }
                  onChange={handleTerminalAssumptionChange('terminalNopatMargin')}
                  disabled={readonly}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="terminalReinvestmentRate">Terminal Reinvestment Rate (%)</Label>
                  <TooltipProvider>
                    <Tooltip content="The percentage of NOPAT expected to be reinvested (CapEx - Depr + Change in NWC) / NOPAT to sustain the terminal growth rate 'g'. Alternatively calculated as g / ROIC.">
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="terminalReinvestmentRate"
                  type="number"
                  step="0.1"
                  value={
                    terminalAssumptions?.terminalReinvestmentRate ||
                    settings.terminalReinvestmentRate ||
                    40
                  }
                  onChange={handleTerminalAssumptionChange('terminalReinvestmentRate')}
                  disabled={readonly}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="impliedRoic">Implied Terminal ROIC (%)</Label>
                <Input
                  id="impliedRoic"
                  type="number"
                  value={impliedRoic.toFixed(1)}
                  disabled={true}
                  className="bg-gray-50"
                />
                <p className="text-xs text-muted-foreground">g / Reinvestment Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
