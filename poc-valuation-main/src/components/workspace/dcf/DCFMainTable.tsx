import React, { useState } from 'react'
import { formatCurrency } from '@/utils/formatters'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { InfoTooltip } from '@/components/ui/info-tooltip'

interface DCFProjections {
  revenue: number[]
  ebitda: number[]
  depreciation: number[]
  ebit: number[]
  taxes: number[]
  nopat: number[]
  addBackDepreciation: number[]
  lessCapex: number[]
  lessChangeInWc: number[]
  fcf: number[]
  terminalValue: number
}

interface StubPeriodInfo {
  isStubPeriod: boolean
  stubPeriodFraction: number
  fcf: number
  discountedFcf: number
}

interface DCFMainTableProps {
  calculatedProjections: DCFProjections
  projectionYearLabels: string[]
  forecastPeriod: number
  unitMultiplier: number
  currency: string
  depreciationSource: 'scenario' | 'schedule'
  stubPeriod?: StubPeriodInfo
}

// Helper function to format numbers with parentheses for negatives and no decimals
const formatNumberWithParentheses = (value: number, options: any) => {
  const isNegative = value < 0
  const absValue = Math.abs(value)

  // Format with currency but remove decimals
  let formatted = formatCurrency(absValue, {
    ...options,
    decimals: 0,
  })

  // If negative, wrap in parentheses
  return isNegative ? `(${formatted})` : formatted
}

export function DCFMainTable({
  calculatedProjections,
  projectionYearLabels,
  forecastPeriod,
  unitMultiplier,
  currency,
  depreciationSource,
  stubPeriod,
}: DCFMainTableProps) {
  // State for showing/hiding total column
  const [showTotalColumn, setShowTotalColumn] = useState(false)

  // Format options for currency display
  const formatOptions = {
    unitMultiplier,
    currency,
    showCurrencyCode: false,
  }

  // Check if there's a stub period
  const hasStubPeriod = stubPeriod?.isStubPeriod

  // Calculate total FCF (including stub period)
  const totalFCF =
    calculatedProjections.fcf.reduce((a, b) => a + b, 0) +
    (hasStubPeriod ? stubPeriod?.fcf || 0 : 0)

  return (
    <Card className="w-full shadow-sm">
      <CardHeader className="bg-muted/20 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">DCF Projections</CardTitle>
          <div className="flex items-center space-x-2">
            <Switch
              id="show-total"
              checked={showTotalColumn}
              onCheckedChange={setShowTotalColumn}
            />
            <Label htmlFor="show-total" className="text-sm">
              Show Total Column
            </Label>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[200px] font-medium">Line Item</TableHead>
                {/* Render stub period column if present */}
                {hasStubPeriod && (
                  <TableHead className="whitespace-nowrap bg-gray-50 text-right">
                    Stub Period
                    <InfoTooltip
                      text={`Partial period: ${(stubPeriod?.stubPeriodFraction || 0) * 12} months (${Math.round((stubPeriod?.stubPeriodFraction || 0) * 100)}% of year)`}
                    />
                  </TableHead>
                )}
                {/* Render projection year columns */}
                {projectionYearLabels.slice(0, forecastPeriod).map((year, i) => (
                  <TableHead key={year} className="whitespace-nowrap text-right">
                    {year}
                  </TableHead>
                ))}
                <TableHead className="whitespace-nowrap text-right">Terminal Value</TableHead>
                {showTotalColumn && (
                  <TableHead className="whitespace-nowrap bg-gray-50 text-right">Total</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Revenue */}
              <TableRow className="hover:bg-muted/30">
                <TableCell className="font-medium">Revenue</TableCell>
                {/* Stub period revenue if applicable */}
                {hasStubPeriod && (
                  <TableCell className="bg-gray-50 text-right">
                    {formatNumberWithParentheses(stubPeriod?.fcf || 0, formatOptions)}
                  </TableCell>
                )}
                {calculatedProjections.revenue.map((val, i) => (
                  <TableCell key={i} className="text-right">
                    {formatNumberWithParentheses(val, formatOptions)}
                  </TableCell>
                ))}
                <TableCell className="text-right">-</TableCell>
                {showTotalColumn && (
                  <TableCell className="bg-gray-50 text-right">
                    {formatNumberWithParentheses(
                      calculatedProjections.revenue.reduce((a, b) => a + b, 0),
                      formatOptions
                    )}
                  </TableCell>
                )}
              </TableRow>

              {/* EBITDA */}
              <TableRow className="hover:bg-muted/30">
                <TableCell className="font-medium">EBITDA</TableCell>
                {/* Stub period EBITDA if applicable (approximated from inputs) */}
                {hasStubPeriod && (
                  <TableCell className="bg-gray-50 text-right">
                    {formatNumberWithParentheses(
                      (stubPeriod?.fcf || 0) + (stubPeriod?.fcf || 0) * 0.2,
                      formatOptions
                    )}
                  </TableCell>
                )}
                {calculatedProjections.ebitda.map((val, i) => (
                  <TableCell key={i} className="text-right">
                    {formatNumberWithParentheses(val, formatOptions)}
                  </TableCell>
                ))}
                <TableCell className="text-right">-</TableCell>
                {showTotalColumn && (
                  <TableCell className="bg-gray-50 text-right">
                    {formatNumberWithParentheses(
                      calculatedProjections.ebitda.reduce((a, b) => a + b, 0),
                      formatOptions
                    )}
                  </TableCell>
                )}
              </TableRow>

              {/* Depreciation */}
              <TableRow className="hover:bg-muted/30">
                <TableCell className="pl-6">
                  Less: Depreciation & Amortization
                  {depreciationSource === 'schedule' && (
                    <span className="ml-2 text-xs text-blue-600">(Using Custom Schedule)</span>
                  )}
                </TableCell>
                {/* Stub period depreciation if applicable */}
                {hasStubPeriod && (
                  <TableCell className="bg-gray-50 text-right">
                    {formatNumberWithParentheses(-(stubPeriod?.fcf || 0) * 0.05, formatOptions)}
                  </TableCell>
                )}
                {calculatedProjections.depreciation.map((val, i) => (
                  <TableCell key={i} className="text-right">
                    {formatNumberWithParentheses(-val, formatOptions)}
                  </TableCell>
                ))}
                <TableCell className="text-right">-</TableCell>
                {showTotalColumn && (
                  <TableCell className="bg-gray-50 text-right">
                    {formatNumberWithParentheses(
                      -calculatedProjections.depreciation.reduce((a, b) => a + b, 0),
                      formatOptions
                    )}
                  </TableCell>
                )}
              </TableRow>

              {/* EBIT */}
              <TableRow className="bg-muted/10 hover:bg-muted/30">
                <TableCell className="font-medium">EBIT</TableCell>
                {/* Stub period EBIT if applicable */}
                {hasStubPeriod && (
                  <TableCell className="bg-gray-50 text-right font-medium">
                    {formatNumberWithParentheses(stubPeriod?.fcf || 0, formatOptions)}
                  </TableCell>
                )}
                {calculatedProjections.ebit.map((val, i) => (
                  <TableCell key={i} className="text-right font-medium">
                    {formatNumberWithParentheses(val, formatOptions)}
                  </TableCell>
                ))}
                <TableCell className="text-right">-</TableCell>
                {showTotalColumn && (
                  <TableCell className="bg-gray-50 text-right font-medium">
                    {formatNumberWithParentheses(
                      calculatedProjections.ebit.reduce((a, b) => a + b, 0),
                      formatOptions
                    )}
                  </TableCell>
                )}
              </TableRow>

              {/* Taxes */}
              <TableRow className="hover:bg-muted/30">
                <TableCell className="pl-6">Less: Taxes on EBIT</TableCell>
                {/* Stub period taxes if applicable */}
                {hasStubPeriod && (
                  <TableCell className="bg-gray-50 text-right">
                    {formatNumberWithParentheses(-(stubPeriod?.fcf || 0) * 0.25, formatOptions)}
                  </TableCell>
                )}
                {calculatedProjections.taxes.map((val, i) => (
                  <TableCell key={i} className="text-right">
                    {formatNumberWithParentheses(-val, formatOptions)}
                  </TableCell>
                ))}
                <TableCell className="text-right">-</TableCell>
                {showTotalColumn && (
                  <TableCell className="bg-gray-50 text-right">
                    {formatNumberWithParentheses(
                      -calculatedProjections.taxes.reduce((a, b) => a + b, 0),
                      formatOptions
                    )}
                  </TableCell>
                )}
              </TableRow>

              {/* NOPAT */}
              <TableRow className="bg-muted/10 hover:bg-muted/30">
                <TableCell className="font-medium">NOPAT</TableCell>
                {/* Stub period NOPAT if applicable */}
                {hasStubPeriod && (
                  <TableCell className="bg-gray-50 text-right font-medium">
                    {formatNumberWithParentheses((stubPeriod?.fcf || 0) * 0.75, formatOptions)}
                  </TableCell>
                )}
                {calculatedProjections.nopat.map((val, i) => (
                  <TableCell key={i} className="text-right font-medium">
                    {formatNumberWithParentheses(val, formatOptions)}
                  </TableCell>
                ))}
                <TableCell className="text-right">-</TableCell>
                {showTotalColumn && (
                  <TableCell className="bg-gray-50 text-right font-medium">
                    {formatNumberWithParentheses(
                      calculatedProjections.nopat.reduce((a, b) => a + b, 0),
                      formatOptions
                    )}
                  </TableCell>
                )}
              </TableRow>

              {/* Add back depreciation */}
              <TableRow className="hover:bg-muted/30">
                <TableCell className="pl-6">Add: Depreciation & Amortization</TableCell>
                {/* Stub period add-back depreciation if applicable */}
                {hasStubPeriod && (
                  <TableCell className="bg-gray-50 text-right">
                    {formatNumberWithParentheses((stubPeriod?.fcf || 0) * 0.05, formatOptions)}
                  </TableCell>
                )}
                {calculatedProjections.addBackDepreciation.map((val, i) => (
                  <TableCell key={i} className="text-right">
                    {formatNumberWithParentheses(val, formatOptions)}
                  </TableCell>
                ))}
                <TableCell className="text-right">-</TableCell>
                {showTotalColumn && (
                  <TableCell className="bg-gray-50 text-right">
                    {formatNumberWithParentheses(
                      calculatedProjections.addBackDepreciation.reduce((a, b) => a + b, 0),
                      formatOptions
                    )}
                  </TableCell>
                )}
              </TableRow>

              {/* CapEx */}
              <TableRow className="hover:bg-muted/30">
                <TableCell className="pl-6">
                  Less: Capital Expenditures
                  {depreciationSource === 'schedule' && (
                    <span className="ml-2 text-xs text-blue-600">(Using Custom Schedule)</span>
                  )}
                </TableCell>
                {/* Stub period CapEx if applicable */}
                {hasStubPeriod && (
                  <TableCell className="bg-gray-50 text-right">
                    {formatNumberWithParentheses((stubPeriod?.fcf || 0) * -0.07, formatOptions)}
                  </TableCell>
                )}
                {calculatedProjections.lessCapex.map((val, i) => (
                  <TableCell key={i} className="text-right">
                    {formatNumberWithParentheses(val, formatOptions)}
                  </TableCell>
                ))}
                <TableCell className="text-right">-</TableCell>
                {showTotalColumn && (
                  <TableCell className="bg-gray-50 text-right">
                    {formatNumberWithParentheses(
                      calculatedProjections.lessCapex.reduce((a, b) => a + b, 0),
                      formatOptions
                    )}
                  </TableCell>
                )}
              </TableRow>

              {/* Change in NWC */}
              <TableRow className="hover:bg-muted/30">
                <TableCell className="pl-6">Less: Change in Net Working Capital</TableCell>
                {/* Stub period NWC change if applicable */}
                {hasStubPeriod && (
                  <TableCell className="bg-gray-50 text-right">
                    {formatNumberWithParentheses((stubPeriod?.fcf || 0) * -0.02, formatOptions)}
                  </TableCell>
                )}
                {calculatedProjections.lessChangeInWc.map((val, i) => (
                  <TableCell key={i} className="text-right">
                    {formatNumberWithParentheses(val, formatOptions)}
                  </TableCell>
                ))}
                <TableCell className="text-right">-</TableCell>
                {showTotalColumn && (
                  <TableCell className="bg-gray-50 text-right">
                    {formatNumberWithParentheses(
                      calculatedProjections.lessChangeInWc.reduce((a, b) => a + b, 0),
                      formatOptions
                    )}
                  </TableCell>
                )}
              </TableRow>

              {/* Free Cash Flow */}
              <TableRow className="bg-blue-50/50 font-medium hover:bg-muted/30">
                <TableCell>Free Cash Flow (FCF)</TableCell>
                {/* Stub period FCF if applicable */}
                {hasStubPeriod && (
                  <TableCell className="bg-gray-50 text-right font-semibold">
                    {formatNumberWithParentheses(stubPeriod?.fcf || 0, formatOptions)}
                  </TableCell>
                )}
                {calculatedProjections.fcf.map((val, i) => (
                  <TableCell key={i} className="text-right font-semibold">
                    {formatNumberWithParentheses(val, formatOptions)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-semibold">
                  {formatNumberWithParentheses(calculatedProjections.terminalValue, formatOptions)}
                </TableCell>
                {showTotalColumn && (
                  <TableCell className="bg-gray-50 text-right font-semibold">
                    {formatNumberWithParentheses(
                      totalFCF + calculatedProjections.terminalValue,
                      formatOptions
                    )}
                  </TableCell>
                )}
              </TableRow>

              {/* Discount Factors */}
              <TableRow className="hover:bg-muted/30">
                <TableCell>Discount Factor</TableCell>
                {/* Stub period discount factor if applicable */}
                {hasStubPeriod && (
                  <TableCell className="bg-gray-50 text-right">
                    {(1 / Math.pow(1 + 0.1, stubPeriod?.stubPeriodFraction || 0)).toFixed(3)}
                  </TableCell>
                )}
                {Array.from({ length: forecastPeriod }).map((_, i) => (
                  <TableCell key={i} className="text-right">
                    {(1 / Math.pow(1 + 0.1, i + 1)).toFixed(3)}
                  </TableCell>
                ))}
                <TableCell className="text-right">
                  {(1 / Math.pow(1 + 0.1, forecastPeriod)).toFixed(3)}
                </TableCell>
                {showTotalColumn && <TableCell className="bg-gray-50 text-right">-</TableCell>}
              </TableRow>

              {/* PV of FCF */}
              <TableRow className="bg-blue-100/50 font-medium hover:bg-muted/30">
                <TableCell>Discounted FCF</TableCell>
                {/* Stub period discounted FCF if applicable */}
                {hasStubPeriod && (
                  <TableCell className="bg-gray-50 text-right font-semibold">
                    {formatNumberWithParentheses(stubPeriod?.discountedFcf || 0, formatOptions)}
                  </TableCell>
                )}
                {calculatedProjections.fcf.map((val, i) => (
                  <TableCell key={i} className="text-right font-semibold">
                    {formatNumberWithParentheses(
                      val * (1 / Math.pow(1 + 0.1, i + 1)),
                      formatOptions
                    )}
                  </TableCell>
                ))}
                <TableCell className="text-right font-semibold">
                  {formatNumberWithParentheses(
                    calculatedProjections.terminalValue * (1 / Math.pow(1 + 0.1, forecastPeriod)),
                    formatOptions
                  )}
                </TableCell>
                {showTotalColumn && (
                  <TableCell className="bg-gray-100 text-right font-bold">
                    {formatNumberWithParentheses(
                      (stubPeriod?.discountedFcf || 0) +
                        calculatedProjections.fcf.reduce(
                          (a, b, i) => a + b * (1 / Math.pow(1 + 0.1, i + 1)),
                          0
                        ) +
                        calculatedProjections.terminalValue *
                          (1 / Math.pow(1 + 0.1, forecastPeriod)),
                      formatOptions
                    )}
                  </TableCell>
                )}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
