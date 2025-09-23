import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { BreakpointDetail } from '@/lib/opmBacksolveCalculator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface BreakpointAnalysisTableProps {
  breakpointDetails: BreakpointDetail[]
  securityClasses: string[]
}

export function BreakpointAnalysisTable({
  breakpointDetails,
  securityClasses,
}: BreakpointAnalysisTableProps) {
  // Format numbers for display
  const formatNumber = (num: number): string => {
    if (num === 0) return '0'
    if (Math.abs(num) < 0.01) return '~0'
    if (num === Number.MAX_SAFE_INTEGER) return '∞'

    return num.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })
  }

  const formatPercent = (num: number): string => {
    if (num === 0) return '0%'
    if (Math.abs(num) < 0.01) return '<0.01%'
    return `${num.toFixed(2)}%`
  }

  // Calculate total FMV values for each security class
  const calculateTotalValues = () => {
    const totals: Record<string, { totalValue: number; shares: number }> = {}

    // Initialize totals object
    securityClasses.forEach((className) => {
      totals[className] = { totalValue: 0, shares: 0 }
    })

    // Calculate initial shares for each security class
    if (breakpointDetails.length > 0) {
      breakpointDetails[0].sharesParticipation.forEach((participation) => {
        if (totals[participation.className]) {
          totals[participation.className].shares = participation.shares
        }
      })
    }

    // Sum up incremental values across all breakpoints
    breakpointDetails.forEach((detail) => {
      detail.sharesParticipation.forEach((participation) => {
        if (totals[participation.className]) {
          totals[participation.className].totalValue += participation.incrementalValue
        }
      })
    })

    return totals
  }

  const totalValues = calculateTotalValues()

  // Calculate total call option value across all breakpoints
  const totalCallOptionValue = breakpointDetails.reduce(
    (sum, detail) => sum + detail.incrementalValue,
    0
  )

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Breakpoint Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead rowSpan={2} className="bg-muted">
                  Security
                </TableHead>
                <TableHead rowSpan={2} className="bg-muted">
                  Shares Outstanding
                </TableHead>
                <TableHead colSpan={breakpointDetails.length} className="bg-muted text-center">
                  Breakpoint
                </TableHead>
                <TableHead rowSpan={2} className="bg-muted text-right">
                  Total Value
                </TableHead>
                <TableHead rowSpan={2} className="bg-muted text-right">
                  FMV/Share
                </TableHead>
              </TableRow>
              <TableRow>
                {breakpointDetails.map((detail, idx) => (
                  <TableHead key={`bp-${idx}`} className="bg-muted text-center">
                    {idx + 1}
                    <br />
                    <span className="text-xs">
                      From: ${formatNumber(detail.from)}
                      <br />
                      To: ${formatNumber(detail.to)}
                    </span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Participation percentages for each security class */}
              {securityClasses.map((className, classIdx) => (
                <TableRow key={`class-${classIdx}`}>
                  <TableCell>{className}</TableCell>
                  <TableCell>
                    {formatNumber(
                      breakpointDetails[0]?.sharesParticipation.find(
                        (sp) => sp.className === className
                      )?.shares || 0
                    )}
                  </TableCell>
                  {breakpointDetails.map((detail, detailIdx) => {
                    const participation = detail.sharesParticipation.find(
                      (sp) => sp.className === className
                    )
                    return (
                      <TableCell key={`class-${classIdx}-bp-${detailIdx}`} className="text-center">
                        {formatPercent(participation?.percentOfTotal || 0)}
                      </TableCell>
                    )
                  })}
                  <TableCell className="text-right font-medium">
                    ${formatNumber(totalValues[className]?.totalValue || 0)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    $
                    {(totalValues[className]?.shares > 0
                      ? totalValues[className]?.totalValue / totalValues[className]?.shares
                      : 0
                    ).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}

              {/* Total row */}
              <TableRow className="bg-muted/50">
                <TableCell className="font-semibold">Total</TableCell>
                <TableCell className="font-semibold">
                  {formatNumber(
                    breakpointDetails[0]?.sharesParticipation.reduce(
                      (sum, item) => sum + item.shares,
                      0
                    ) || 0
                  )}
                </TableCell>
                {breakpointDetails.map((detail, idx) => (
                  <TableCell key={`total-${idx}`} className="text-center font-semibold">
                    100.0%
                  </TableCell>
                ))}
                <TableCell className="text-right font-semibold">
                  $
                  {formatNumber(
                    Object.values(totalValues).reduce((sum, item) => sum + item.totalValue, 0)
                  )}
                </TableCell>
                <TableCell className="text-right">-</TableCell>
              </TableRow>

              {/* Incremental allocation rows */}
              {securityClasses.map((className, classIdx) => (
                <TableRow key={`inc-${classIdx}`}>
                  <TableCell>{className} (Incremental %)</TableCell>
                  <TableCell>-</TableCell>
                  {breakpointDetails.map((detail, detailIdx) => {
                    const participation = detail.sharesParticipation.find(
                      (sp) => sp.className === className
                    )
                    return (
                      <TableCell key={`inc-${classIdx}-bp-${detailIdx}`} className="text-center">
                        {formatPercent(participation?.incrementalPercent || 0)}
                      </TableCell>
                    )
                  })}
                  <TableCell colSpan={2}></TableCell>
                </TableRow>
              ))}

              {/* Call Option Values section - Modified as requested */}
              <TableRow className="border-t-2">
                <TableCell colSpan={2} className="font-semibold">
                  Call Option Values
                </TableCell>
                {breakpointDetails.map((detail, idx) => (
                  <TableCell key={`opt-val-${idx}`} className="text-center font-medium">
                    ${formatNumber(detail.incrementalValue)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-semibold">
                  ${formatNumber(totalCallOptionValue)}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>

              {/* Allocated Call Option Values rows */}
              {securityClasses.map((className, classIdx) => (
                <TableRow key={`call-${classIdx}`}>
                  <TableCell>{className}</TableCell>
                  <TableCell>-</TableCell>
                  {breakpointDetails.map((detail, detailIdx) => {
                    const participation = detail.sharesParticipation.find(
                      (sp) => sp.className === className
                    )
                    // Calculate the allocated option value for this security in this breakpoint
                    const allocatedValue =
                      (detail.incrementalValue * (participation?.incrementalPercent || 0)) / 100

                    return (
                      <TableCell key={`call-${classIdx}-bp-${detailIdx}`} className="text-center">
                        ${formatNumber(allocatedValue)}
                      </TableCell>
                    )
                  })}
                  <TableCell className="text-right font-medium">
                    ${formatNumber(totalValues[className]?.totalValue || 0)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    $
                    {(totalValues[className]?.shares > 0
                      ? totalValues[className]?.totalValue / totalValues[className]?.shares
                      : 0
                    ).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}

              {/* Black-Scholes Option Value section */}
              <TableRow className="border-t-2">
                <TableCell className="font-semibold">d1</TableCell>
                <TableCell>-</TableCell>
                {breakpointDetails.map((detail, idx) => (
                  <TableCell key={`d1-${idx}`} className="text-center">
                    {detail.d1.toFixed(2)}
                  </TableCell>
                ))}
                <TableCell colSpan={2}></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">d2</TableCell>
                <TableCell>-</TableCell>
                {breakpointDetails.map((detail, idx) => (
                  <TableCell key={`d2-${idx}`} className="text-center">
                    {detail.d2.toFixed(2)}
                  </TableCell>
                ))}
                <TableCell colSpan={2}></TableCell>
              </TableRow>
              <TableRow className="bg-muted/50">
                <TableCell className="font-semibold" colSpan={2}>
                  Black-Scholes Option Value
                </TableCell>
                {breakpointDetails.map((detail, idx) => (
                  <TableCell key={`opt-${idx}`} className="text-center font-semibold">
                    ${formatNumber(detail.optionValue)}
                  </TableCell>
                ))}
                <TableCell colSpan={2}></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold" colSpan={2}>
                  Incremental Black-Scholes Option Value
                </TableCell>
                {breakpointDetails.map((detail, idx) => (
                  <TableCell key={`inc-opt-${idx}`} className="text-center">
                    ${formatNumber(detail.incrementalValue)}
                  </TableCell>
                ))}
                <TableCell colSpan={2}></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
