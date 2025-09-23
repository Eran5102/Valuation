import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatPercent } from '@/utils/formatters'
import { Separator } from '@/components/ui/separator'

interface DCFModelOutputsProps {
  dcf: any
  settings: any
}

export function DCFModelOutputs({ dcf, settings }: DCFModelOutputsProps) {
  const hasDcfResults = dcf && dcf.results
  const terminalAssumptions = dcf?.results?.terminalYearAssumptions

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">DCF Model Outputs</h2>

      {!hasDcfResults ? (
        <p className="text-sm text-muted-foreground">Run the DCF model to generate outputs.</p>
      ) : (
        <>
          {/* Main valuation metrics */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Enterprise Value</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatCurrency(dcf.results.enterpriseValue, { decimals: 0 })}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Equity Value</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatCurrency(dcf.results.equityValue, { decimals: 0 })}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Implied EV/EBITDA Multiple</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{dcf.results.impliedMultiple.toFixed(2)}x</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">WACC</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatPercent(settings.wacc || 0.1)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Terminal Year PGM Assumptions Section */}
          {settings.terminalValueMethod === 'PGM' && terminalAssumptions && (
            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Terminal Year Assumptions (PGM)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Terminal NOPAT Margin</p>
                    <p className="text-lg font-semibold">
                      {formatPercent(terminalAssumptions.nopatMargin / 100)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Terminal Reinvestment Rate</p>
                    <p className="text-lg font-semibold">
                      {formatPercent(terminalAssumptions.reinvestmentRate / 100)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Implied Terminal ROIC</p>
                    <p className="text-lg font-semibold">
                      {formatPercent(terminalAssumptions.impliedRoic / 100)}
                    </p>
                    <p className="text-xs text-muted-foreground">(g / Reinvestment Rate)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
