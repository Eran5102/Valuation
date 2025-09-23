import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { DCFSensitivityTable } from './DCFSensitivityTable'
import { DCFTornadoChart } from './DCFTornadoChart'
import { formatCurrency } from '@/utils/formatters'
import { Calculator, Sliders } from 'lucide-react'

interface DCFSensitivityProps {
  baseResult: number
  unitMultiplier: number
  currency: string
  waccRate: number
  growthRate: number
  exitMultiple: number
  terminalValueMethod: string
  exitMultipleMetric: string
  sensitivityMatrix: any
  baseValueIndices: {
    waccIdx: number
    secondaryIdx: number
  }
  discountRate: number
  runSensitivityAnalysis: (param: string, rangePercent: number) => any
}

export function DCFSensitivity({
  baseResult,
  unitMultiplier,
  currency,
  waccRate,
  growthRate,
  exitMultiple,
  terminalValueMethod,
  exitMultipleMetric,
  sensitivityMatrix,
  baseValueIndices,
  discountRate,
  runSensitivityAnalysis,
}: DCFSensitivityProps) {
  const [sensitivityView, setSensitivityView] = useState<'matrix' | 'tornado'>('matrix')
  const [selectedParameter, setSelectedParameter] = useState<string>('wacc')
  const [rangePercent, setRangePercent] = useState<number>(20)

  // Generate tornado data for the selected parameter
  const tornadoData = useCallback(() => {
    return runSensitivityAnalysis(selectedParameter, rangePercent)
  }, [selectedParameter, rangePercent, runSensitivityAnalysis])

  // Calculate data for tornado chart
  const sensitivityData = tornadoData()

  // Parameter mapping for display
  const paramLabels: Record<string, string> = {
    wacc: 'WACC',
    growth: 'Terminal Growth Rate',
    exitMultiple: `${exitMultipleMetric} Multiple`,
    revenue: 'Revenue Growth',
    margin: 'EBITDA Margin',
  }

  // Prepare data for tornado chart
  const tornadoResults = [
    {
      variableName: 'WACC',
      lowOutputValue: baseResult * 1.1, // simulate higher value with lower WACC
      highOutputValue: baseResult * 0.9, // simulate lower value with higher WACC
      baseOutputValue: baseResult,
      swing: baseResult * 0.2,
    },
    {
      variableName: 'Terminal Growth',
      lowOutputValue: baseResult * 0.93,
      highOutputValue: baseResult * 1.08,
      baseOutputValue: baseResult,
      swing: baseResult * 0.15,
    },
    {
      variableName: 'Revenue Growth',
      lowOutputValue: baseResult * 0.95,
      highOutputValue: baseResult * 1.05,
      baseOutputValue: baseResult,
      swing: baseResult * 0.1,
    },
    {
      variableName: 'EBITDA Margin',
      lowOutputValue: baseResult * 0.9,
      highOutputValue: baseResult * 1.12,
      baseOutputValue: baseResult,
      swing: baseResult * 0.22,
    },
  ]

  return (
    <div className="space-y-6">
      <Tabs
        value={sensitivityView}
        onValueChange={(v) => setSensitivityView(v as 'matrix' | 'tornado')}
      >
        <TabsList className="mb-6 w-full">
          <TabsTrigger value="matrix" className="flex-1">
            <Calculator className="mr-2 h-4 w-4" />
            Sensitivity Matrix
          </TabsTrigger>
          <TabsTrigger value="tornado" className="flex-1">
            <Sliders className="mr-2 h-4 w-4" />
            Tornado Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matrix">
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 text-xl font-medium">Two-Way Sensitivity Matrix</h3>
              <p className="mb-6 text-muted-foreground">
                This matrix shows enterprise values based on different combinations of WACC and
                {terminalValueMethod === 'PGM' ? ' terminal growth rates.' : ' exit multiples.'}
                <br />
                The current case is highlighted.
              </p>

              {sensitivityMatrix && (
                <DCFSensitivityTable
                  sensitivityMatrix={{
                    wacc: sensitivityMatrix.waccRange.map((w: number) => w * 100),
                    growth:
                      terminalValueMethod === 'PGM'
                        ? sensitivityMatrix.growthRange.map((g: number) => g * 100)
                        : sensitivityMatrix.growthRange.map((g: number) => g), // Exit multiples
                    exitMultiple: [
                      exitMultiple - 2,
                      exitMultiple - 1,
                      exitMultiple,
                      exitMultiple + 1,
                      exitMultiple + 2,
                    ],
                    values: sensitivityMatrix.values,
                  }}
                  baseValueIndices={baseValueIndices}
                  terminalValueMethod={terminalValueMethod}
                  unitMultiplier={unitMultiplier}
                  currency={currency}
                  exitMultipleMetric={exitMultipleMetric}
                />
              )}

              <div className="mt-6 text-sm text-muted-foreground">
                <p>
                  <strong>How to interpret:</strong> The matrix displays enterprise values under
                  different assumptions. The current case is highlighted. This analysis helps
                  identify how sensitive the valuation is to changes in key inputs.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tornado">
          <Card>
            <CardContent className="p-6">
              <div className="mb-6 flex flex-wrap items-center justify-between">
                <div>
                  <h3 className="text-xl font-medium">Tornado Analysis</h3>
                  <p className="mt-1 text-muted-foreground">
                    Analyzing the sensitivity of enterprise value to changes in key parameters
                  </p>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-4 sm:mt-0">
                  <div className="w-48">
                    <Label htmlFor="parameter" className="mb-1 block">
                      Parameter
                    </Label>
                    <Select
                      value={selectedParameter}
                      onValueChange={(value) => setSelectedParameter(value)}
                    >
                      <SelectTrigger id="parameter">
                        <SelectValue placeholder="Select parameter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wacc">WACC</SelectItem>
                        {terminalValueMethod === 'PGM' ? (
                          <SelectItem value="growth">Terminal Growth Rate</SelectItem>
                        ) : (
                          <SelectItem value="exitMultiple">Exit Multiple</SelectItem>
                        )}
                        <SelectItem value="revenue">Revenue Growth</SelectItem>
                        <SelectItem value="margin">EBITDA Margin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="range" className="mb-1 block">
                      Range (±{rangePercent}%)
                    </Label>
                    <Slider
                      id="range"
                      min={5}
                      max={50}
                      step={5}
                      value={[rangePercent]}
                      onValueChange={(values) => setRangePercent(values[0])}
                      className="w-48"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center bg-card">
                <div className="w-full">
                  <DCFTornadoChart
                    unitMultiplier={unitMultiplier}
                    currency={currency}
                    baseResult={baseResult}
                    sensitivityData={sensitivityData}
                    paramLabels={paramLabels}
                    tornadoResults={tornadoResults}
                  />
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    <strong>Base case enterprise value:</strong>{' '}
                    {formatCurrency(baseResult, { unitMultiplier, currency })}
                  </div>
                  <div className="text-sm">
                    <span className="inline-flex items-center rounded bg-primary/10 px-2 py-1 text-primary">
                      Varying each parameter by ±{rangePercent}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
