import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/layout/PageHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AppWindow } from 'lucide-react'
import { toast } from 'sonner'

export default function ResidualIncome() {
  // Single period RI inputs
  const [netIncome, setNetIncome] = useState<number>(500000)
  const [bookValue, setBookValue] = useState<number>(3000000)
  const [costOfEquity, setCostOfEquity] = useState<number>(12)
  const [residualIncome, setResidualIncome] = useState<number | null>(null)

  // Multi-period RI inputs
  const [forecastYears, setForecastYears] = useState<number>(5)
  const [growthRate, setGrowthRate] = useState<number>(3)
  const [terminalGrowthRate, setTerminalGrowthRate] = useState<number>(2)
  const [multiPeriodValue, setMultiPeriodValue] = useState<number | null>(null)

  // Forecast data for multi-period
  const [forecastData, setForecastData] = useState<
    Array<{
      year: number
      netIncome: number
      bookValue: number
      residualIncome: number
      presentValue: number
    }>
  >([])

  const handleCalculateRI = () => {
    if (netIncome !== undefined && bookValue !== undefined && costOfEquity !== undefined) {
      const equityCharge = bookValue * (costOfEquity / 100)
      const calculatedRI = netIncome - equityCharge
      setResidualIncome(calculatedRI)
      toast.success('Residual Income calculated successfully')
    } else {
      toast.error('Please enter all required values')
    }
  }

  const handleCalculateMultiPeriod = () => {
    if (
      netIncome === undefined ||
      bookValue === undefined ||
      costOfEquity === undefined ||
      forecastYears === undefined ||
      growthRate === undefined ||
      terminalGrowthRate === undefined
    ) {
      toast.error('Please enter all required values')
      return
    }

    const forecast = []
    let currentNetIncome = netIncome
    let currentBookValue = bookValue
    let totalValue = bookValue // Start with current book value
    const discountRate = costOfEquity / 100

    for (let year = 1; year <= forecastYears; year++) {
      // Grow net income at specified rate
      currentNetIncome *= 1 + growthRate / 100

      // Calculate residual income
      const equityCharge = currentBookValue * discountRate
      const ri = currentNetIncome - equityCharge

      // Calculate present value of this year's RI
      const presentValue = ri / Math.pow(1 + discountRate, year)

      // Add to total value
      totalValue += presentValue

      // Update book value (assuming retention ratio of 50%)
      const retentionRatio = 0.5
      const retainedEarnings = currentNetIncome * retentionRatio
      currentBookValue += retainedEarnings

      // Store forecast data
      forecast.push({
        year,
        netIncome: currentNetIncome,
        bookValue: currentBookValue,
        residualIncome: ri,
        presentValue,
      })
    }

    // Calculate terminal value
    const terminalRI = forecast[forecastYears - 1].residualIncome * (1 + terminalGrowthRate / 100)
    const terminalValue = terminalRI / (discountRate - terminalGrowthRate / 100)
    const presentTerminalValue = terminalValue / Math.pow(1 + discountRate, forecastYears)

    // Add terminal value to total value
    totalValue += presentTerminalValue

    // Update state
    setForecastData(forecast)
    setMultiPeriodValue(totalValue)

    toast.success('Multi-period valuation completed successfully')
  }

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(Math.round(num))
  }

  return (
    <div className="w-full">
      <PageHeader
        title="Residual Income Valuation"
        icon={<AppWindow className="h-5 w-5" />}
        description="Value a company using the Residual Income model based on accounting profits and book value"
      />

      <div className="px-4 pb-4">
        <p className="mb-4 text-muted-foreground">
          Residual Income valuation determines a company's intrinsic value by adding the present
          value of expected future residual income to the current book value. It focuses on earnings
          in excess of required returns on equity.
        </p>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <Tabs defaultValue="single-period" className="space-y-4">
          <TabsList>
            <TabsTrigger value="single-period">Single-Period Model</TabsTrigger>
            <TabsTrigger value="multi-period">Multi-Period Model</TabsTrigger>
            <TabsTrigger value="explanation">Methodology</TabsTrigger>
          </TabsList>

          <TabsContent value="single-period" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Single-Period Residual Income Calculator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Calculate residual income for a single period by subtracting the equity charge
                  from net income.
                </p>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="netIncome">Net Income</Label>
                    <Input
                      id="netIncome"
                      type="number"
                      value={netIncome || ''}
                      onChange={(e) => setNetIncome(Number(e.target.value))}
                      placeholder="Enter net income"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bookValue">Book Value of Equity</Label>
                    <Input
                      id="bookValue"
                      type="number"
                      value={bookValue || ''}
                      onChange={(e) => setBookValue(Number(e.target.value))}
                      placeholder="Enter book value"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="costOfEquity">Cost of Equity (%)</Label>
                    <Input
                      id="costOfEquity"
                      type="number"
                      step="0.1"
                      value={costOfEquity || ''}
                      onChange={(e) => setCostOfEquity(Number(e.target.value))}
                      placeholder="Enter cost of equity percentage"
                    />
                  </div>
                </div>

                <Button onClick={handleCalculateRI} className="mt-4">
                  Calculate Residual Income
                </Button>

                {residualIncome !== null && (
                  <div className="mt-6 rounded-md bg-muted p-4">
                    <h3 className="text-lg font-medium">Residual Income</h3>
                    <p className="mt-2 text-2xl font-bold text-primary">
                      ${formatNumber(residualIncome)}
                    </p>
                    <div className="mt-2 text-sm">
                      <p>Net Income: ${formatNumber(netIncome)}</p>
                      <p>
                        Equity Charge: ${formatNumber(bookValue * (costOfEquity / 100))} (Book Value
                        × Cost of Equity)
                      </p>
                      <p>Residual Income = Net Income - Equity Charge</p>
                      <p className="mt-1 rounded bg-muted p-1 font-mono">
                        ${formatNumber(netIncome)} - $
                        {formatNumber(bookValue * (costOfEquity / 100))} = $
                        {formatNumber(residualIncome)}
                      </p>

                      <p className="mt-2">
                        {residualIncome > 0
                          ? '✅ Positive Residual Income: The company is generating returns above its cost of equity.'
                          : '❌ Negative Residual Income: The company is not covering its cost of equity.'}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="multi-period" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Multi-Period Residual Income Valuation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Calculate equity value based on current book value plus the present value of
                  future residual income.
                </p>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="netIncomeMulti">Current Net Income</Label>
                    <Input
                      id="netIncomeMulti"
                      type="number"
                      value={netIncome || ''}
                      onChange={(e) => setNetIncome(Number(e.target.value))}
                      placeholder="Enter net income"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bookValueMulti">Book Value of Equity</Label>
                    <Input
                      id="bookValueMulti"
                      type="number"
                      value={bookValue || ''}
                      onChange={(e) => setBookValue(Number(e.target.value))}
                      placeholder="Enter book value"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="costOfEquityMulti">Cost of Equity (%)</Label>
                    <Input
                      id="costOfEquityMulti"
                      type="number"
                      step="0.1"
                      value={costOfEquity || ''}
                      onChange={(e) => setCostOfEquity(Number(e.target.value))}
                      placeholder="Enter cost of equity percentage"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="forecastYears">Forecast Period (Years)</Label>
                    <Input
                      id="forecastYears"
                      type="number"
                      value={forecastYears || ''}
                      onChange={(e) => setForecastYears(Number(e.target.value))}
                      placeholder="Enter forecast years"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="growthRate">Net Income Growth Rate (%)</Label>
                    <Input
                      id="growthRate"
                      type="number"
                      step="0.1"
                      value={growthRate || ''}
                      onChange={(e) => setGrowthRate(Number(e.target.value))}
                      placeholder="Enter growth rate"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="terminalGrowthRate">Terminal Growth Rate (%)</Label>
                    <Input
                      id="terminalGrowthRate"
                      type="number"
                      step="0.1"
                      value={terminalGrowthRate || ''}
                      onChange={(e) => setTerminalGrowthRate(Number(e.target.value))}
                      placeholder="Enter terminal growth rate"
                    />
                  </div>
                </div>

                <Button onClick={handleCalculateMultiPeriod} className="mt-4">
                  Calculate Equity Value
                </Button>

                {multiPeriodValue !== null && forecastData.length > 0 && (
                  <div className="mt-6">
                    <h3 className="mb-4 text-lg font-medium">Valuation Results</h3>

                    <div className="mb-6 rounded-md bg-muted p-4">
                      <h4 className="text-lg font-medium">Calculated Equity Value</h4>
                      <p className="mt-2 text-2xl font-bold text-primary">
                        ${formatNumber(multiPeriodValue)}
                      </p>
                    </div>

                    <h4 className="text-md mb-2 font-medium">Forecast Details</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="py-2 text-left">Year</th>
                            <th className="py-2 text-left">Net Income</th>
                            <th className="py-2 text-left">Book Value</th>
                            <th className="py-2 text-left">Residual Income</th>
                            <th className="py-2 text-left">PV of RI</th>
                          </tr>
                        </thead>
                        <tbody>
                          {forecastData.map((year, index) => (
                            <tr key={index} className="border-b">
                              <td className="py-2">{year.year}</td>
                              <td className="py-2">${formatNumber(year.netIncome)}</td>
                              <td className="py-2">${formatNumber(year.bookValue)}</td>
                              <td className="py-2">${formatNumber(year.residualIncome)}</td>
                              <td className="py-2">${formatNumber(year.presentValue)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <p className="mt-4 text-sm text-muted-foreground">
                      Note: Terminal value is included in the final equity valuation.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="explanation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>About Residual Income Valuation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="mb-2 text-lg font-medium">What is Residual Income?</h3>
                  <p>
                    Residual Income is the income generated by a company that exceeds the required
                    return on its book value. It represents the economic profit after accounting for
                    the opportunity cost of equity capital.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-medium">Residual Income Formula</h3>
                  <p className="mb-2">The basic Residual Income formula is:</p>
                  <p className="rounded bg-muted p-2 font-mono">
                    Residual Income = Net Income - (Book Value of Equity × Cost of Equity)
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-medium">Residual Income Valuation Model</h3>
                  <p className="mb-2">
                    The Residual Income Valuation Model calculates equity value as:
                  </p>
                  <p className="rounded bg-muted p-2 font-mono">
                    Equity Value = Current Book Value + Present Value of Future Residual Income
                  </p>
                  <p className="mt-2 text-sm">
                    This model is often called the Edwards-Bell-Ohlson (EBO) model or the Abnormal
                    Earnings model.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-medium">Key Components</h3>
                  <ul className="list-disc space-y-1 pl-6">
                    <li>
                      <strong>Book Value:</strong> The accounting value of equity
                    </li>
                    <li>
                      <strong>Net Income:</strong> Accounting profits attributable to shareholders
                    </li>
                    <li>
                      <strong>Cost of Equity:</strong> Required rate of return on equity investments
                    </li>
                    <li>
                      <strong>Equity Charge:</strong> The opportunity cost of equity investment
                      (Book Value × Cost of Equity)
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-medium">Advantages</h3>
                  <ul className="list-disc space-y-1 pl-6">
                    <li>Uses readily available accounting data</li>
                    <li>
                      Works well for financial institutions and companies with significant tangible
                      assets
                    </li>
                    <li>Less sensitive to terminal value assumptions than DCF</li>
                    <li>Recognizes that book value already captures much of a company's value</li>
                    <li>Focuses on value creation above the cost of capital</li>
                  </ul>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-medium">Limitations</h3>
                  <ul className="list-disc space-y-1 pl-6">
                    <li>Sensitive to accounting choices and practices</li>
                    <li>May not work well for companies with significant intangible assets</li>
                    <li>Requires forecasting book values, which can be challenging</li>
                    <li>Clean surplus accounting assumption may not always hold</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
