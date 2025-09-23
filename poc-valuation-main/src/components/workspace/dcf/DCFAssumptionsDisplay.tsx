import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatPercent } from '@/utils/formatters'
import { ScenarioAssumptions, TerminalAssumptions } from '@/utils/scenarioUtils'
import { Slider } from '@/components/ui/slider'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface DCFAssumptionsDisplayProps {
  assumptions: ScenarioAssumptions
  terminalAssumptions?: TerminalAssumptions
  forecastPeriod: number
  yearLabels: string[]
  editable?: boolean
  onAssumptionChange?: (
    category: 'incomeCf' | 'balanceSheet',
    key: string,
    yearIndex: number,
    value: number
  ) => void
}

export function DCFAssumptionsDisplay({
  assumptions,
  terminalAssumptions,
  forecastPeriod,
  yearLabels,
  editable = false,
  onAssumptionChange,
}: DCFAssumptionsDisplayProps) {
  // Ensure we're only using the forecasted period years
  const displayYears = yearLabels.slice(0, forecastPeriod)
  const [editingAssumption, setEditingAssumption] = useState<{
    category: 'incomeCf' | 'balanceSheet'
    key: string
    yearIndex: number
  } | null>(null)

  // Add some spacing below the collapsible component
  const [isOpen, setIsOpen] = useState(true)

  // Format assumption values (most are percentages)
  const formatAssumptionValue = (value: number) => {
    return formatPercent(value / 100)
  }

  // Handle slider change
  const handleSliderChange = (
    category: 'incomeCf' | 'balanceSheet',
    key: string,
    yearIndex: number,
    values: number[]
  ) => {
    if (onAssumptionChange) {
      onAssumptionChange(category, key, yearIndex, values[0])
    }
  }

  // Toggle editing state for an assumption value
  const toggleEditing = (category: 'incomeCf' | 'balanceSheet', key: string, yearIndex: number) => {
    if (!editable) return

    if (
      editingAssumption?.category === category &&
      editingAssumption?.key === key &&
      editingAssumption?.yearIndex === yearIndex
    ) {
      setEditingAssumption(null)
    } else {
      setEditingAssumption({ category, key, yearIndex })
    }
  }

  // Check if we have assumptions data to display
  if (!assumptions || !assumptions.incomeCf || !assumptions.balanceSheet) {
    return null
  }

  return (
    <div className="mb-4 space-y-4">
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="overflow-hidden rounded-md border"
      >
        <CollapsibleTrigger className="flex w-full items-center justify-between bg-muted/30 p-4 transition-colors hover:bg-muted/50">
          <h3 className="text-lg font-medium">Key Assumptions</h3>
          <div className="flex items-center">
            {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-4">
            <Tabs defaultValue="income-statement" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="income-statement">Income Statement</TabsTrigger>
                <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
              </TabsList>

              <TabsContent value="income-statement" className="pt-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-background">
                      <TableRow>
                        <TableHead className="w-[200px]">Assumption</TableHead>
                        {displayYears.map((year) => (
                          <TableHead key={year} className="text-right">
                            {year}
                          </TableHead>
                        ))}
                        {terminalAssumptions && (
                          <TableHead className="text-right">Terminal</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.keys(assumptions.incomeCf).map((key) => (
                        <TableRow key={key}>
                          <TableCell className="font-medium">{key}</TableCell>
                          {assumptions.incomeCf[key].slice(0, forecastPeriod).map((value, i) => (
                            <TableCell key={i} className="text-right">
                              {editingAssumption?.category === 'incomeCf' &&
                              editingAssumption?.key === key &&
                              editingAssumption?.yearIndex === i ? (
                                <div className="mx-auto w-24">
                                  <Slider
                                    value={[value]}
                                    min={0}
                                    max={key === 'Sales Growth (%)' ? 50 : 100}
                                    step={0.5}
                                    onValueChange={(values) =>
                                      handleSliderChange('incomeCf', key, i, values)
                                    }
                                    className="mb-2"
                                  />
                                  <div className="text-center text-xs">
                                    {formatAssumptionValue(value)}
                                  </div>
                                </div>
                              ) : (
                                <div
                                  className={
                                    editable ? 'cursor-pointer rounded p-1 hover:bg-muted' : ''
                                  }
                                  onClick={() => toggleEditing('incomeCf', key, i)}
                                >
                                  {formatAssumptionValue(value)}
                                </div>
                              )}
                            </TableCell>
                          ))}
                          {terminalAssumptions && (
                            <TableCell className="text-right">
                              {key === 'Sales Growth (%)'
                                ? formatAssumptionValue(terminalAssumptions.terminalGrowthRate)
                                : formatAssumptionValue(
                                    assumptions.incomeCf[key][forecastPeriod - 1]
                                  )}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="balance-sheet" className="pt-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-background">
                      <TableRow>
                        <TableHead className="w-[200px]">Assumption</TableHead>
                        {displayYears.map((year) => (
                          <TableHead key={year} className="text-right">
                            {year}
                          </TableHead>
                        ))}
                        {terminalAssumptions && (
                          <TableHead className="text-right">Terminal</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.keys(assumptions.balanceSheet).map((key) => (
                        <TableRow key={key}>
                          <TableCell className="font-medium">{key}</TableCell>
                          {assumptions.balanceSheet[key]
                            .slice(0, forecastPeriod)
                            .map((value, i) => (
                              <TableCell key={i} className="text-right">
                                {editingAssumption?.category === 'balanceSheet' &&
                                editingAssumption?.key === key &&
                                editingAssumption?.yearIndex === i ? (
                                  <div className="mx-auto w-24">
                                    <Slider
                                      value={[value]}
                                      min={0}
                                      max={key.includes('Days') ? 120 : 100}
                                      step={key.includes('Days') ? 1 : 0.5}
                                      onValueChange={(values) =>
                                        handleSliderChange('balanceSheet', key, i, values)
                                      }
                                      className="mb-2"
                                    />
                                    <div className="text-center text-xs">
                                      {key.includes('Days')
                                        ? value.toFixed(1)
                                        : formatAssumptionValue(value)}
                                    </div>
                                  </div>
                                ) : (
                                  <div
                                    className={
                                      editable ? 'cursor-pointer rounded p-1 hover:bg-muted' : ''
                                    }
                                    onClick={() => toggleEditing('balanceSheet', key, i)}
                                  >
                                    {key.includes('Days')
                                      ? value.toFixed(1)
                                      : formatAssumptionValue(value)}
                                  </div>
                                )}
                              </TableCell>
                            ))}
                          {terminalAssumptions && (
                            <TableCell className="text-right">
                              {key.includes('Days')
                                ? assumptions.balanceSheet[key][forecastPeriod - 1].toFixed(1)
                                : formatAssumptionValue(
                                    assumptions.balanceSheet[key][forecastPeriod - 1]
                                  )}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
