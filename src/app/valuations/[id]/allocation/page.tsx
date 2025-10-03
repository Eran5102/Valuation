'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useValuationWorkspace } from '@/contexts/ValuationWorkspaceContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Calculator,
  GitBranch,
  DollarSign,
  Layers,
  Info,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AllocationMethod {
  id: 'opm' | 'pwerm' | 'cvm' | 'hybrid'
  name: string
  description: string
  icon: any
  color: string
  recommended?: boolean
  pros: string[]
  cons: string[]
  bestFor: string
}

const allocationMethods: AllocationMethod[] = [
  {
    id: 'opm',
    name: 'Option Pricing Model (OPM)',
    description: 'Black-Scholes based allocation using current equity structure',
    icon: Calculator,
    color: 'blue',
    recommended: true,
    pros: [
      'Most commonly used for 409A valuations',
      'Works well for early-stage companies',
      'Considers time value and volatility',
      'Handles complex capital structures',
    ],
    cons: [
      'Assumes single liquidity event',
      'May not capture all future scenarios',
      'Requires volatility assumptions',
    ],
    bestFor: 'Early to mid-stage companies with standard equity structures',
  },
  {
    id: 'pwerm',
    name: 'Probability-Weighted Expected Return Method',
    description: 'Allocates value based on probability-weighted exit scenarios',
    icon: GitBranch,
    color: 'green',
    pros: [
      'Captures multiple exit scenarios',
      'Reflects management expectations',
      'Good for companies near liquidity events',
      'More nuanced than OPM',
    ],
    cons: [
      'Requires detailed scenario planning',
      'Subjective probability assessments',
      'More complex to implement',
    ],
    bestFor: 'Late-stage companies or those with clear exit visibility',
  },
  {
    id: 'cvm',
    name: 'Current Value Method',
    description: 'Simple allocation based on current liquidation preferences',
    icon: DollarSign,
    color: 'purple',
    pros: [
      'Simplest method to implement',
      'Clear and transparent',
      'Works for immediate liquidation scenarios',
      'No complex assumptions needed',
    ],
    cons: [
      'Ignores time value and optionality',
      'May undervalue common stock',
      'Not suitable for most going concerns',
    ],
    bestFor: 'Companies in distress or immediate sale situations',
  },
  {
    id: 'hybrid',
    name: 'Hybrid Method',
    description: 'Combines OPM and PWERM for different scenario outcomes',
    icon: Layers,
    color: 'orange',
    pros: [
      'Most comprehensive approach',
      'Balances near and long-term scenarios',
      'Captures both optionality and specific outcomes',
      'Flexible weighting between methods',
    ],
    cons: [
      'Most complex to implement',
      'Requires extensive assumptions',
      'Potentially harder to audit',
    ],
    bestFor: 'Companies with both near-term exit scenarios and long-term optionality',
  },
]

export default function EquityAllocationPage() {
  const params = useParams()
  const router = useRouter()
  const valuationId = params?.id as string
  const { valuation, updateMethodologies } = useValuationWorkspace()
  const [selectedMethod, setSelectedMethod] = useState<'opm' | 'pwerm' | 'cvm' | 'hybrid'>(
    valuation?.methodologies?.allocation?.method || 'opm'
  )
  const [hybridComponents, setHybridComponents] = useState<('opm' | 'pwerm')[]>(
    valuation?.methodologies?.allocation?.hybridComponents || ['opm', 'pwerm']
  )

  const handleMethodSelect = async (methodId: 'opm' | 'pwerm' | 'cvm' | 'hybrid') => {
    setSelectedMethod(methodId)

    await updateMethodologies({
      allocation: {
        method: methodId,
        hybridComponents: methodId === 'hybrid' ? hybridComponents : undefined,
      },
    })
  }

  const selectedMethodDetails = allocationMethods.find((m) => m.id === selectedMethod)

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Equity Allocation Method</h1>
        <p className="mt-1 text-muted-foreground">
          Choose the methodology to allocate enterprise value across share classes
        </p>
      </div>

      {/* Important Note for 409A */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          For 409A valuations, the allocation method determines how the enterprise value is
          distributed among different equity classes. OPM is the most common method, while PWERM and
          Hybrid methods are often used for later-stage companies with clearer exit visibility.
        </AlertDescription>
      </Alert>

      {/* Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Allocation Method</CardTitle>
          <CardDescription>
            Choose the appropriate method based on your company's stage and circumstances
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={selectedMethod} onValueChange={handleMethodSelect}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {allocationMethods.map((method) => {
                const Icon = method.icon
                const isSelected = selectedMethod === method.id
                const colorClasses = {
                  blue: 'bg-blue-100 text-blue-600',
                  green: 'bg-green-100 text-green-600',
                  purple: 'bg-purple-100 text-purple-600',
                  orange: 'bg-orange-100 text-orange-600',
                }[method.color]

                return (
                  <div key={method.id} className="relative">
                    <label
                      htmlFor={method.id}
                      className={cn(
                        'flex cursor-pointer rounded-lg border p-4 transition-all',
                        isSelected
                          ? 'bg-primary/5 border-primary shadow-sm'
                          : 'hover:border-primary/50 border-border'
                      )}
                    >
                      <RadioGroupItem value={method.id} id={method.id} className="sr-only" />
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn('rounded-lg p-2', colorClasses)}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="font-medium">{method.name}</h3>
                              <p className="text-sm text-muted-foreground">{method.description}</p>
                            </div>
                          </div>
                          {method.recommended && (
                            <Badge variant="secondary" className="ml-2">
                              Recommended
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Best for:</span> {method.bestFor}
                        </div>
                      </div>
                    </label>
                    {isSelected && (
                      <div className="absolute -top-2 right-2">
                        <Badge className="gap-1" variant="default">
                          <CheckCircle2 className="h-3 w-3" />
                          Selected
                        </Badge>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Method Details */}
      {selectedMethodDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <selectedMethodDetails.icon className="h-5 w-5" />
              {selectedMethodDetails.name} Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <h4 className="mb-2 font-medium text-green-600">Advantages</h4>
                <ul className="space-y-1">
                  {selectedMethodDetails.pros.map((pro, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="mb-2 font-medium text-orange-600">Considerations</h4>
                <ul className="space-y-1">
                  {selectedMethodDetails.cons.map((con, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <AlertCircle className="mt-0.5 h-4 w-4 text-orange-600" />
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Special configuration for Hybrid method */}
            {selectedMethod === 'hybrid' && (
              <div className="bg-muted/30 mt-4 rounded-lg border p-4">
                <h4 className="mb-2 font-medium">Hybrid Method Components</h4>
                <p className="text-sm text-muted-foreground">
                  The hybrid method typically combines OPM for long-term scenarios with PWERM for
                  near-term exit scenarios. You can configure the specific scenarios and weightings
                  in the next step.
                </p>
                <div className="mt-3 flex gap-2">
                  <Badge variant="outline">
                    <Calculator className="mr-1 h-3 w-3" />
                    OPM Component
                  </Badge>
                  <Badge variant="outline">
                    <GitBranch className="mr-1 h-3 w-3" />
                    PWERM Component
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
          <CardDescription>
            Configure the selected allocation method with specific parameters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">Configure {selectedMethodDetails?.name}</p>
              <p className="text-sm text-muted-foreground">
                Set up the specific parameters and assumptions for your selected method
              </p>
            </div>
            <Button
              onClick={() => router.push(`/valuations/${valuationId}/allocation/${selectedMethod}`)}
            >
              Continue to Configuration
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
