'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  TrendingUp,
  Calculator,
  BarChart3,
  Activity,
  DollarSign,
  Percent,
  AlertCircle,
  Settings,
} from 'lucide-react'
import { useValuationWorkspace } from '@/contexts/ValuationWorkspaceContext'
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts'

interface DCFProjection {
  year: number
  revenue: number
  ebitda: number
  ebit: number
  taxes: number
  capex: number
  nwcChange: number
  fcf: number
  discountFactor: number
  pvFcf: number
}

export default function DCFAnalysisPage() {
  const params = useParams()
  const valuationId = params?.id as string
  const { valuation, updateAssumptions } = useValuationWorkspace()

  // DCF Parameters
  const [forecastPeriod, setForecastPeriod] = useState(5)
  const [discountRate, setDiscountRate] = useState(12)
  const [terminalGrowthRate, setTerminalGrowthRate] = useState(2.5)
  const [taxRate, setTaxRate] = useState(25)

  // Financial Projections
  const [baseRevenue, setBaseRevenue] = useState(10000000)
  const [revenueGrowthRate, setRevenueGrowthRate] = useState(20)
  const [ebitdaMargin, setEbitdaMargin] = useState(25)
  const [depreciationRate, setDepreciationRate] = useState(5)
  const [capexPercent, setCapexPercent] = useState(3)
  const [nwcPercent, setNwcPercent] = useState(2)

  // Calculated values
  const [projections, setProjections] = useState<DCFProjection[]>([])
  const [terminalValue, setTerminalValue] = useState(0)
  const [enterpriseValue, setEnterpriseValue] = useState(0)

  // Load saved assumptions
  useEffect(() => {
    if (valuation?.assumptions?.dcf) {
      const dcfAssumptions = valuation.assumptions.dcf
      setForecastPeriod(dcfAssumptions.forecastPeriod || 5)
      setDiscountRate(dcfAssumptions.discountRate || 12)
      setTerminalGrowthRate(dcfAssumptions.terminalGrowthRate || 2.5)
      setTaxRate(dcfAssumptions.taxRate || 25)
      setBaseRevenue(dcfAssumptions.baseRevenue || 10000000)
      setRevenueGrowthRate(dcfAssumptions.revenueGrowthRate || 20)
      setEbitdaMargin(dcfAssumptions.ebitdaMargin || 25)
      setDepreciationRate(dcfAssumptions.depreciationRate || 5)
      setCapexPercent(dcfAssumptions.capexPercent || 3)
      setNwcPercent(dcfAssumptions.nwcPercent || 2)
    }
  }, [valuation])

  // Calculate DCF projections
  useEffect(() => {
    const newProjections: DCFProjection[] = []
    let revenue = baseRevenue

    for (let year = 1; year <= forecastPeriod; year++) {
      revenue = year === 1 ? revenue : revenue * (1 + revenueGrowthRate / 100)
      const ebitda = revenue * (ebitdaMargin / 100)
      const depreciation = revenue * (depreciationRate / 100)
      const ebit = ebitda - depreciation
      const taxes = ebit * (taxRate / 100)
      const capex = revenue * (capexPercent / 100)
      const nwcChange = year === 1 ? 0 : revenue * (nwcPercent / 100)
      const fcf = ebit - taxes + depreciation - capex - nwcChange
      const discountFactor = 1 / Math.pow(1 + discountRate / 100, year)
      const pvFcf = fcf * discountFactor

      newProjections.push({
        year,
        revenue,
        ebitda,
        ebit,
        taxes,
        capex,
        nwcChange,
        fcf,
        discountFactor,
        pvFcf,
      })
    }

    setProjections(newProjections)

    // Calculate terminal value
    if (newProjections.length > 0) {
      const lastFcf = newProjections[newProjections.length - 1].fcf
      const terminalFcf = lastFcf * (1 + terminalGrowthRate / 100)
      const terminalValueCalc = terminalFcf / (discountRate / 100 - terminalGrowthRate / 100)
      const pvTerminalValue = terminalValueCalc / Math.pow(1 + discountRate / 100, forecastPeriod)
      setTerminalValue(pvTerminalValue)

      // Calculate enterprise value
      const sumPvFcf = newProjections.reduce((sum, p) => sum + p.pvFcf, 0)
      setEnterpriseValue(sumPvFcf + pvTerminalValue)
    }
  }, [
    forecastPeriod,
    discountRate,
    terminalGrowthRate,
    taxRate,
    baseRevenue,
    revenueGrowthRate,
    ebitdaMargin,
    depreciationRate,
    capexPercent,
    nwcPercent,
  ])

  const saveAssumptions = async () => {
    await updateAssumptions({
      dcf: {
        forecastPeriod,
        discountRate,
        terminalGrowthRate,
        taxRate,
        baseRevenue,
        revenueGrowthRate,
        ebitdaMargin,
        depreciationRate,
        capexPercent,
        nwcPercent,
        enterpriseValue,
      },
    })
  }

  const chartData = projections.map((p) => ({
    year: `Year ${p.year}`,
    Revenue: p.revenue / 1000000,
    EBITDA: p.ebitda / 1000000,
    'Free Cash Flow': p.fcf / 1000000,
  }))

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Discounted Cash Flow Analysis</h1>
          <p className="text-muted-foreground">
            Project future cash flows and discount to present value
          </p>
        </div>
        <Button onClick={saveAssumptions}>Save Assumptions</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enterprise Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(enterpriseValue / 1000000).toFixed(1)}M</div>
            <p className="text-xs text-muted-foreground">Based on DCF methodology</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PV of Cash Flows</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(projections.reduce((sum, p) => sum + p.pvFcf, 0) / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-muted-foreground">{forecastPeriod}-year forecast</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terminal Value</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(terminalValue / 1000000).toFixed(1)}M</div>
            <p className="text-xs text-muted-foreground">{terminalGrowthRate}% perpetual growth</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Discount Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{discountRate}%</div>
            <p className="text-xs text-muted-foreground">WACC / Required return</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="assumptions" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="assumptions">Assumptions</TabsTrigger>
          <TabsTrigger value="projections">Projections</TabsTrigger>
          <TabsTrigger value="chart">Chart View</TabsTrigger>
          <TabsTrigger value="sensitivity">Sensitivity</TabsTrigger>
        </TabsList>

        {/* Assumptions Tab */}
        <TabsContent value="assumptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Valuation Parameters</CardTitle>
              <CardDescription>Configure key assumptions for the DCF model</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>Forecast Period (Years)</Label>
                  <Input
                    type="number"
                    value={forecastPeriod}
                    onChange={(e) => setForecastPeriod(Number(e.target.value))}
                    min={3}
                    max={10}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Discount Rate (%)</Label>
                  <Input
                    type="number"
                    value={discountRate}
                    onChange={(e) => setDiscountRate(Number(e.target.value))}
                    min={5}
                    max={30}
                    step={0.5}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Terminal Growth Rate (%)</Label>
                  <Input
                    type="number"
                    value={terminalGrowthRate}
                    onChange={(e) => setTerminalGrowthRate(Number(e.target.value))}
                    min={0}
                    max={5}
                    step={0.5}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tax Rate (%)</Label>
                  <Input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    min={0}
                    max={40}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Base Revenue ($)</Label>
                  <Input
                    type="number"
                    value={baseRevenue}
                    onChange={(e) => setBaseRevenue(Number(e.target.value))}
                    min={0}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Revenue Growth Rate (%)</Label>
                  <Input
                    type="number"
                    value={revenueGrowthRate}
                    onChange={(e) => setRevenueGrowthRate(Number(e.target.value))}
                    min={-50}
                    max={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label>EBITDA Margin (%)</Label>
                  <Input
                    type="number"
                    value={ebitdaMargin}
                    onChange={(e) => setEbitdaMargin(Number(e.target.value))}
                    min={-50}
                    max={50}
                  />
                </div>

                <div className="space-y-2">
                  <Label>CapEx as % of Revenue</Label>
                  <Input
                    type="number"
                    value={capexPercent}
                    onChange={(e) => setCapexPercent(Number(e.target.value))}
                    min={0}
                    max={20}
                  />
                </div>

                <div className="space-y-2">
                  <Label>NWC as % of Revenue</Label>
                  <Input
                    type="number"
                    value={nwcPercent}
                    onChange={(e) => setNwcPercent(Number(e.target.value))}
                    min={0}
                    max={20}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projections Tab */}
        <TabsContent value="projections">
          <Card>
            <CardHeader>
              <CardTitle>Financial Projections</CardTitle>
              <CardDescription>Projected cash flows and present value calculations</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Year</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">EBITDA</TableHead>
                    <TableHead className="text-right">EBIT</TableHead>
                    <TableHead className="text-right">Taxes</TableHead>
                    <TableHead className="text-right">CapEx</TableHead>
                    <TableHead className="text-right">NWC Δ</TableHead>
                    <TableHead className="text-right">FCF</TableHead>
                    <TableHead className="text-right">PV Factor</TableHead>
                    <TableHead className="text-right">PV of FCF</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projections.map((p) => (
                    <TableRow key={p.year}>
                      <TableCell>{p.year}</TableCell>
                      <TableCell className="text-right">
                        ${(p.revenue / 1000000).toFixed(1)}M
                      </TableCell>
                      <TableCell className="text-right">
                        ${(p.ebitda / 1000000).toFixed(1)}M
                      </TableCell>
                      <TableCell className="text-right">
                        ${(p.ebit / 1000000).toFixed(1)}M
                      </TableCell>
                      <TableCell className="text-right">
                        ${(p.taxes / 1000000).toFixed(1)}M
                      </TableCell>
                      <TableCell className="text-right">
                        ${(p.capex / 1000000).toFixed(1)}M
                      </TableCell>
                      <TableCell className="text-right">
                        ${(p.nwcChange / 1000000).toFixed(1)}M
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${(p.fcf / 1000000).toFixed(1)}M
                      </TableCell>
                      <TableCell className="text-right">{p.discountFactor.toFixed(3)}</TableCell>
                      <TableCell className="text-right font-medium">
                        ${(p.pvFcf / 1000000).toFixed(1)}M
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-medium">
                    <TableCell colSpan={9}>Sum of PV Cash Flows</TableCell>
                    <TableCell className="text-right">
                      ${(projections.reduce((sum, p) => sum + p.pvFcf, 0) / 1000000).toFixed(1)}M
                    </TableCell>
                  </TableRow>
                  <TableRow className="font-medium">
                    <TableCell colSpan={9}>Terminal Value (PV)</TableCell>
                    <TableCell className="text-right">
                      ${(terminalValue / 1000000).toFixed(1)}M
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-muted font-bold">
                    <TableCell colSpan={9}>Enterprise Value</TableCell>
                    <TableCell className="text-right">
                      ${(enterpriseValue / 1000000).toFixed(1)}M
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chart Tab */}
        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle>Projections Chart</CardTitle>
              <CardDescription>Visual representation of financial projections</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <ChartTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Revenue" stroke="#8884d8" strokeWidth={2} />
                  <Line type="monotone" dataKey="EBITDA" stroke="#82ca9d" strokeWidth={2} />
                  <Line type="monotone" dataKey="Free Cash Flow" stroke="#ffc658" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sensitivity Tab */}
        <TabsContent value="sensitivity">
          <Card>
            <CardHeader>
              <CardTitle>Sensitivity Analysis</CardTitle>
              <CardDescription>Impact of key assumptions on enterprise value</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Adjust the sliders to see how changes in key assumptions affect the enterprise
                    value
                  </AlertDescription>
                </Alert>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <div className="mb-2 flex justify-between">
                        <Label>Discount Rate</Label>
                        <span className="text-sm font-medium">{discountRate}%</span>
                      </div>
                      <Slider
                        value={[discountRate]}
                        onValueChange={([value]) => setDiscountRate(value)}
                        min={5}
                        max={30}
                        step={0.5}
                      />
                      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                        <span>5%</span>
                        <span>30%</span>
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 flex justify-between">
                        <Label>Terminal Growth Rate</Label>
                        <span className="text-sm font-medium">{terminalGrowthRate}%</span>
                      </div>
                      <Slider
                        value={[terminalGrowthRate]}
                        onValueChange={([value]) => setTerminalGrowthRate(value)}
                        min={0}
                        max={5}
                        step={0.25}
                      />
                      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                        <span>0%</span>
                        <span>5%</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="mb-2 flex justify-between">
                        <Label>Revenue Growth Rate</Label>
                        <span className="text-sm font-medium">{revenueGrowthRate}%</span>
                      </div>
                      <Slider
                        value={[revenueGrowthRate]}
                        onValueChange={([value]) => setRevenueGrowthRate(value)}
                        min={-10}
                        max={50}
                        step={1}
                      />
                      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                        <span>-10%</span>
                        <span>50%</span>
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 flex justify-between">
                        <Label>EBITDA Margin</Label>
                        <span className="text-sm font-medium">{ebitdaMargin}%</span>
                      </div>
                      <Slider
                        value={[ebitdaMargin]}
                        onValueChange={([value]) => setEbitdaMargin(value)}
                        min={0}
                        max={40}
                        step={1}
                      />
                      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                        <span>0%</span>
                        <span>40%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-muted p-4">
                  <div className="text-center">
                    <p className="mb-2 text-sm text-muted-foreground">Resulting Enterprise Value</p>
                    <p className="text-3xl font-bold text-primary">
                      ${(enterpriseValue / 1000000).toFixed(1)}M
                    </p>
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
