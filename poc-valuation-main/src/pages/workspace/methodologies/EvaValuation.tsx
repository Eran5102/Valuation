import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/layout/PageHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart } from 'lucide-react'
import { toast } from 'sonner'

export default function EvaValuation() {
  // EVA Calculator inputs
  const [nopat, setNopat] = useState<number>(500000)
  const [investedCapital, setInvestedCapital] = useState<number>(3000000)
  const [wacc, setWacc] = useState<number>(10)
  const [eva, setEva] = useState<number | null>(null)

  // MVA Calculator inputs
  const [evaGrowthRate, setEvaGrowthRate] = useState<number>(3)
  const [forecastPeriod, setForecastPeriod] = useState<number>(5)
  const [bookValue, setBookValue] = useState<number>(3000000)
  const [mva, setMva] = useState<number | null>(null)
  const [calculatedValue, setCalculatedValue] = useState<number | null>(null)

  const handleCalculateEVA = () => {
    if (nopat !== undefined && investedCapital !== undefined && wacc !== undefined) {
      const capitalCharge = investedCapital * (wacc / 100)
      const calculatedEva = nopat - capitalCharge
      setEva(calculatedEva)
      toast.success('EVA calculated successfully')
    } else {
      toast.error('Please enter all required values')
    }
  }

  const handleCalculateMVA = () => {
    if (eva === null) {
      toast.error('Please calculate EVA first')
      return
    }

    if (
      eva !== undefined &&
      wacc !== undefined &&
      evaGrowthRate !== undefined &&
      forecastPeriod !== undefined
    ) {
      let presentValueSum = 0
      let currentEva = eva

      // Calculate present value of EVA for the explicit forecast period
      for (let year = 1; year <= forecastPeriod; year++) {
        currentEva *= 1 + evaGrowthRate / 100
        presentValueSum += currentEva / Math.pow(1 + wacc / 100, year)
      }

      // Calculate continuing value (terminal value)
      const terminalEva = currentEva * (1 + evaGrowthRate / 100)
      const terminalValue = terminalEva / (wacc / 100 - evaGrowthRate / 100)
      const discountedTerminalValue = terminalValue / Math.pow(1 + wacc / 100, forecastPeriod)

      const calculatedMva = presentValueSum + discountedTerminalValue
      setMva(calculatedMva)

      // Company value = Book value + MVA
      if (bookValue !== undefined) {
        setCalculatedValue(bookValue + calculatedMva)
      }

      toast.success('Market Value Added (MVA) calculated successfully')
    } else {
      toast.error('Please enter all required values')
    }
  }

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(Math.round(num))
  }

  return (
    <div className="w-full">
      <PageHeader
        title="Economic Value Added (EVA) Valuation"
        icon={<BarChart className="h-5 w-5" />}
        description="Measure and value a company based on economic profit and value creation"
      />

      <div className="px-4 pb-4">
        <p className="mb-4 text-muted-foreground">
          Economic Value Added (EVA) measures a company's true economic profit by subtracting the
          cost of all capital from operating profit. This method shows whether a company is
          generating returns above its cost of capital.
        </p>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <Tabs defaultValue="eva-calculator" className="space-y-4">
          <TabsList>
            <TabsTrigger value="eva-calculator">EVA Calculator</TabsTrigger>
            <TabsTrigger value="mva-calculator">MVA & Valuation</TabsTrigger>
            <TabsTrigger value="explanation">Methodology</TabsTrigger>
          </TabsList>

          <TabsContent value="eva-calculator" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Economic Value Added Calculator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Calculate EVA by subtracting the cost of capital from Net Operating Profit After
                  Tax (NOPAT).
                </p>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="nopat">NOPAT (Net Operating Profit After Tax)</Label>
                    <Input
                      id="nopat"
                      type="number"
                      value={nopat || ''}
                      onChange={(e) => setNopat(Number(e.target.value))}
                      placeholder="Enter NOPAT"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="investedCapital">Invested Capital</Label>
                    <Input
                      id="investedCapital"
                      type="number"
                      value={investedCapital || ''}
                      onChange={(e) => setInvestedCapital(Number(e.target.value))}
                      placeholder="Enter invested capital"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wacc">WACC (Weighted Average Cost of Capital) %</Label>
                    <Input
                      id="wacc"
                      type="number"
                      step="0.1"
                      value={wacc || ''}
                      onChange={(e) => setWacc(Number(e.target.value))}
                      placeholder="Enter WACC percentage"
                    />
                  </div>
                </div>

                <Button onClick={handleCalculateEVA} className="mt-4">
                  Calculate EVA
                </Button>

                {eva !== null && (
                  <div className="mt-6 rounded-md bg-muted p-4">
                    <h3 className="text-lg font-medium">Economic Value Added (EVA)</h3>
                    <p className="mt-2 text-2xl font-bold text-primary">${formatNumber(eva)}</p>
                    <div className="mt-2 text-sm">
                      <p>NOPAT: ${formatNumber(nopat)}</p>
                      <p>
                        Capital Charge: ${formatNumber(investedCapital * (wacc / 100))} (Invested
                        Capital × WACC)
                      </p>
                      <p>EVA = NOPAT - Capital Charge</p>
                      <p className="mt-1 rounded bg-muted p-1 font-mono">
                        ${formatNumber(nopat)} - ${formatNumber(investedCapital * (wacc / 100))} = $
                        {formatNumber(eva)}
                      </p>

                      <p className="mt-2">
                        {eva > 0
                          ? '✅ Positive EVA: The company is creating shareholder value.'
                          : '❌ Negative EVA: The company is destroying shareholder value.'}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mva-calculator" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Market Value Added & Valuation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Calculate Market Value Added (MVA) as the present value of all future EVA, and
                  determine company value.
                </p>

                {eva === null ? (
                  <div className="my-4 border-l-4 border-yellow-400 bg-yellow-50 p-4">
                    <p className="text-yellow-700">
                      Please calculate EVA first in the EVA Calculator tab.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="font-medium">Current EVA: ${formatNumber(eva)}</p>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="evaGrowthRate">Expected EVA Growth Rate (%)</Label>
                        <Input
                          id="evaGrowthRate"
                          type="number"
                          step="0.1"
                          value={evaGrowthRate || ''}
                          onChange={(e) => setEvaGrowthRate(Number(e.target.value))}
                          placeholder="Enter growth rate"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="forecastPeriod">Explicit Forecast Period (Years)</Label>
                        <Input
                          id="forecastPeriod"
                          type="number"
                          value={forecastPeriod || ''}
                          onChange={(e) => setForecastPeriod(Number(e.target.value))}
                          placeholder="Enter forecast period"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bookValue">Current Book Value (Invested Capital)</Label>
                        <Input
                          id="bookValue"
                          type="number"
                          value={bookValue || ''}
                          onChange={(e) => setBookValue(Number(e.target.value))}
                          placeholder="Enter book value"
                        />
                      </div>
                    </div>

                    <Button onClick={handleCalculateMVA} className="mt-4">
                      Calculate MVA & Company Value
                    </Button>

                    {mva !== null && calculatedValue !== null && (
                      <div className="mt-6 rounded-md bg-muted p-4">
                        <div className="space-y-3">
                          <div>
                            <h3 className="text-md font-medium">Market Value Added (MVA)</h3>
                            <p className="text-xl font-bold text-primary">${formatNumber(mva)}</p>
                          </div>

                          <div>
                            <h3 className="text-lg font-medium">Calculated Company Value</h3>
                            <p className="text-2xl font-bold text-primary">
                              ${formatNumber(calculatedValue)}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Company Value = Book Value + MVA
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="explanation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>About EVA Valuation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="mb-2 text-lg font-medium">What is Economic Value Added (EVA)?</h3>
                  <p>
                    EVA is a financial performance measure that calculates a company's true economic
                    profit after accounting for the opportunity cost of all capital. It represents
                    the value created in excess of the required return of the company's investors
                    (both debt and equity).
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-medium">EVA Formula</h3>
                  <p className="mb-2">The basic EVA formula is:</p>
                  <p className="rounded bg-muted p-2 font-mono">
                    EVA = NOPAT - (Invested Capital × WACC)
                  </p>
                  <p className="mt-2 text-sm">
                    Where:
                    <br />
                    NOPAT = Net Operating Profit After Tax
                    <br />
                    Invested Capital = Total assets - Non-interest-bearing current liabilities
                    <br />
                    WACC = Weighted Average Cost of Capital
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-medium">Market Value Added (MVA)</h3>
                  <p className="mb-2">
                    MVA represents the difference between the market value of a company and the
                    capital invested in it. It can be calculated as the present value of all future
                    EVA values:
                  </p>
                  <p className="rounded bg-muted p-2 font-mono">
                    MVA = Present Value of All Future EVA
                  </p>
                  <p className="mt-2 text-sm">Company Value = Book Value + MVA</p>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-medium">Benefits of EVA Analysis</h3>
                  <ul className="list-disc space-y-1 pl-6">
                    <li>Accounts for the full cost of capital, not just debt</li>
                    <li>Aligns managers' incentives with shareholder value creation</li>
                    <li>Provides a clear metric for value creation</li>
                    <li>Can be applied at various business unit levels</li>
                    <li>Correlates well with stock market performance over time</li>
                  </ul>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-medium">Limitations</h3>
                  <ul className="list-disc space-y-1 pl-6">
                    <li>Complex to calculate accurately with many accounting adjustments</li>
                    <li>Short-term focus may discourage long-term investments</li>
                    <li>Sensitive to accounting choices and capital structure</li>
                    <li>Difficult to apply to startups or high-growth companies</li>
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
