import React from 'react'
import { formatCurrency } from '@/utils/formatters'

interface ValuationSummaryTableProps {
  dcf: any
  settings: any
}

export default function ValuationSummaryTable({ dcf, settings }: ValuationSummaryTableProps) {
  // Use 1 as the unitMultiplier to display in dollars, not millions
  const unitMultiplier = 1
  const currency = settings?.currency || 'USD'

  // Extract values from DCF results with null safety
  const enterpriseValue = dcf?.projections?.totalPV || 0
  const pvFcf = dcf?.projections?.pvFcf || []
  const sumPvFcf = Array.isArray(pvFcf) ? pvFcf.reduce((a, b) => a + b, 0) : 0
  const pvTerminalValue = dcf?.projections?.pvTerminalValue || 0
  const percentTerminalValue = enterpriseValue > 0 ? (pvTerminalValue / enterpriseValue) * 100 : 0

  // Extract stub period value if available
  const stubPeriodValue = dcf?.stubPeriod?.discountedFcf || 0
  const hasStubPeriod = dcf?.stubPeriod?.isStubPeriod || false

  // Calculate equity value
  const cashBalance = settings?.cashBalance || 0
  const debtBalance = settings?.debtBalance || 0
  const equityValue = enterpriseValue + cashBalance - debtBalance

  return (
    <div className="w-full">
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <h3 className="mb-2 text-lg font-medium">DCF Valuation Summary</h3>
          <table className="w-full text-sm">
            <tbody>
              {/* Show stub period value if applicable */}
              {hasStubPeriod && (
                <tr className="border-b">
                  <td className="py-2 font-medium">Present Value of Stub Period</td>
                  <td className="py-2 text-right">
                    {formatCurrency(stubPeriodValue, { unitMultiplier, currency })}
                  </td>
                </tr>
              )}
              <tr className="border-b">
                <td className="py-2 font-medium">Present Value of Forecast Period</td>
                <td className="py-2 text-right">
                  {formatCurrency(sumPvFcf, { unitMultiplier, currency })}
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 font-medium">Present Value of Terminal Value</td>
                <td className="py-2 text-right">
                  {formatCurrency(pvTerminalValue, { unitMultiplier, currency })}
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 font-medium">Terminal Value %</td>
                <td className="py-2 text-right">{percentTerminalValue.toFixed(1)}%</td>
              </tr>
              <tr className="border-b font-bold">
                <td className="py-2">Enterprise Value</td>
                <td className="py-2 text-right">
                  {formatCurrency(enterpriseValue, { unitMultiplier, currency })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-medium">DCF Inputs</h3>
          <table className="w-full text-sm">
            <tbody>
              {/* Show stub period info if applicable */}
              {hasStubPeriod && (
                <tr className="border-b">
                  <td className="py-2 font-medium">Stub Period</td>
                  <td className="py-2 text-right">
                    {(dcf?.stubPeriod?.stubPeriodFraction * 12).toFixed(1)} months (
                    {Math.round(dcf?.stubPeriod?.stubPeriodFraction * 100)}% of year)
                  </td>
                </tr>
              )}
              <tr className="border-b">
                <td className="py-2 font-medium">Forecast Period</td>
                <td className="py-2 text-right">{settings?.forecastPeriod || 5} years</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 font-medium">WACC</td>
                <td className="py-2 text-right">{settings?.discountRate || 0}%</td>
              </tr>
              {settings?.terminalValueMethod === 'PGM' ? (
                <tr className="border-b">
                  <td className="py-2 font-medium">Terminal Growth Rate</td>
                  <td className="py-2 text-right">{settings?.terminalGrowthRate || 0}%</td>
                </tr>
              ) : (
                <tr className="border-b">
                  <td className="py-2 font-medium">
                    Exit Multiple ({settings?.exitMultipleMetric})
                  </td>
                  <td className="py-2 text-right">{settings?.exitMultipleValue || 0}x</td>
                </tr>
              )}
              <tr className="border-b">
                <td className="py-2 font-medium">Tax Rate</td>
                <td className="py-2 text-right">{settings?.taxRate || 0}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-lg font-medium">Enterprise to Equity Value</h3>
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b">
              <td className="py-2 font-medium">Enterprise Value</td>
              <td className="py-2 text-right">
                {formatCurrency(enterpriseValue, { unitMultiplier, currency })}
              </td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-medium">+ Cash & Equivalents</td>
              <td className="py-2 text-right text-green-600">
                +{formatCurrency(cashBalance, { unitMultiplier, currency })}
              </td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-medium">- Total Debt</td>
              <td className="py-2 text-right text-red-600">
                -{formatCurrency(debtBalance, { unitMultiplier, currency })}
              </td>
            </tr>
            <tr className="border-b font-bold">
              <td className="py-2">Equity Value</td>
              <td className="py-2 text-right">
                {formatCurrency(equityValue, { unitMultiplier, currency })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
