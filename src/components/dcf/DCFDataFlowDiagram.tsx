'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  ArrowRight,
  Calculator,
  TrendingUp,
  DollarSign,
  BarChart3,
  FileSpreadsheet,
  PieChart,
  Activity,
  Target,
  CheckCircle,
  Circle,
  AlertCircle,
} from 'lucide-react'
import { useDCFModel } from '@/contexts/DCFModelContext'

export function DCFDataFlowDiagram() {
  const {
    assumptions,
    historicalData,
    workingCapital,
    capexDepreciation,
    debtSchedule,
    wacc,
    financialStatements,
    dcfValuation,
  } = useDCFModel()

  // Define the data flow components
  const dataFlowComponents = [
    {
      id: 'scenarios',
      name: 'Scenarios',
      icon: Target,
      status: 'active',
      description: 'Market assumptions & growth drivers',
      outputs: ['Revenue Growth', 'Margins', 'Operating Metrics'],
      completed: true,
    },
    {
      id: 'historical',
      name: 'Historical Data',
      icon: FileSpreadsheet,
      status: historicalData ? 'complete' : 'pending',
      description: '3-5 years of historical financials',
      outputs: ['Base Revenue', 'Historical Margins', 'Growth Trends'],
      completed: !!historicalData,
    },
    {
      id: 'projections',
      name: 'Financial Projections',
      icon: TrendingUp,
      status: financialStatements ? 'complete' : 'pending',
      description: 'Integrated P&L, BS, and CF projections',
      outputs: ['Revenue', 'EBITDA', 'Net Income'],
      completed: !!financialStatements,
    },
    {
      id: 'working-capital',
      name: 'Working Capital',
      icon: Activity,
      status: workingCapital ? 'complete' : 'pending',
      description: 'DSO, DPO, DIO, and NWC changes',
      outputs: ['Change in NWC', 'Cash Conversion Cycle'],
      completed: !!workingCapital,
    },
    {
      id: 'capex',
      name: 'Capex & Depreciation',
      icon: BarChart3,
      status: capexDepreciation ? 'complete' : 'pending',
      description: 'Capital expenditures and depreciation schedule',
      outputs: ['Capex', 'Depreciation', 'Net PP&E'],
      completed: !!capexDepreciation,
    },
    {
      id: 'debt',
      name: 'Debt Schedule',
      icon: PieChart,
      status: debtSchedule ? 'complete' : 'pending',
      description: 'Debt balances and interest expense',
      outputs: ['Interest Expense', 'Debt Balances', 'Principal Payments'],
      completed: !!debtSchedule,
    },
    {
      id: 'wacc',
      name: 'WACC Calculation',
      icon: Calculator,
      status: wacc ? 'complete' : 'pending',
      description: 'Cost of capital and discount rate',
      outputs: ['Discount Rate', 'Cost of Equity', 'Cost of Debt'],
      completed: !!wacc,
    },
    {
      id: 'dcf',
      name: 'DCF Valuation',
      icon: DollarSign,
      status: dcfValuation ? 'complete' : 'pending',
      description: 'Enterprise and equity value calculation',
      outputs: ['Enterprise Value', 'Equity Value', 'Value per Share'],
      completed: !!dcfValuation,
      isFinal: true,
    },
  ]

  // Calculate overall completion
  const completedSteps = dataFlowComponents.filter((c) => c.completed).length
  const totalSteps = dataFlowComponents.length
  const completionPercentage = (completedSteps / totalSteps) * 100

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>DCF Data Flow & Integration</CardTitle>
            <CardDescription>
              How supporting schedules flow into the final DCF valuation
            </CardDescription>
          </div>
          <Badge variant={completionPercentage === 100 ? 'default' : 'secondary'}>
            {completedSteps}/{totalSteps} Complete
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Completion</span>
            <span className="font-semibold">{Math.round(completionPercentage)}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>

        {/* Data Flow Visualization */}
        <div className="space-y-4">
          {dataFlowComponents.map((component, index) => (
            <div key={component.id}>
              <div className="flex items-start gap-4">
                {/* Status Icon */}
                <div className="mt-1">
                  {component.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : component.status === 'active' ? (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>

                {/* Component Card */}
                <div className="flex-1">
                  <div
                    className={`rounded-lg border p-4 ${component.isFinal ? 'border-primary bg-primary/5' : 'border-border'} ${component.completed ? 'bg-muted/30' : ''} `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <component.icon className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold">{component.name}</h4>
                      </div>
                      {component.isFinal && <Badge variant="default">Final Output</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{component.description}</p>
                    {component.outputs && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {component.outputs.map((output) => (
                          <Badge key={output} variant="outline" className="text-xs">
                            {output}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Connector Arrow */}
              {index < dataFlowComponents.length - 1 && (
                <div className="ml-2.5 flex h-8 items-center">
                  <div className="h-full w-0.5 bg-border" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Key Integration Points */}
        <div className="mt-6 space-y-3 rounded-lg bg-muted/50 p-4">
          <h4 className="flex items-center gap-2 font-semibold">
            <Activity className="h-4 w-4" />
            Key Integration Points
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <ArrowRight className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <strong>Scenarios → Projections:</strong> Growth rates and margins drive revenue and
                expense forecasts
              </div>
            </div>
            <div className="flex items-start gap-2">
              <ArrowRight className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <strong>Working Capital → Cash Flow:</strong> NWC changes directly impact free cash
                flow
              </div>
            </div>
            <div className="flex items-start gap-2">
              <ArrowRight className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <strong>WACC → Discount Rate:</strong> Calculated WACC becomes the DCF discount rate
              </div>
            </div>
            <div className="flex items-start gap-2">
              <ArrowRight className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <strong>Debt Schedule → Interest:</strong> Interest expense flows to P&L and affects
                taxes
              </div>
            </div>
          </div>
        </div>

        {/* Current Values Display */}
        {(wacc || dcfValuation) && (
          <div className="grid grid-cols-2 gap-4">
            {wacc && (
              <div className="rounded-lg border p-3">
                <div className="text-sm text-muted-foreground">Current WACC</div>
                <div className="text-2xl font-bold">{(wacc.calculatedWACC * 100).toFixed(2)}%</div>
              </div>
            )}
            {dcfValuation && (
              <div className="rounded-lg border p-3">
                <div className="text-sm text-muted-foreground">Enterprise Value</div>
                <div className="text-2xl font-bold">
                  ${(dcfValuation.enterpriseValue / 1000000).toFixed(1)}M
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
