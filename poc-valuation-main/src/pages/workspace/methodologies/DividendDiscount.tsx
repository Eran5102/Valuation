import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/layout/PageHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PieChart } from 'lucide-react'
import { toast } from 'sonner'

export default function DividendDiscount() {
  const [currentDividend, setCurrentDividend] = useState<number>(1)
  const [growthRate, setGrowthRate] = useState<number>(3)
  const [discountRate, setDiscountRate] = useState<number>(10)
  const [calculatedValue, setCalculatedValue] = useState<number | null>(null)

  // For multi-stage DDM
  const [initialDividend, setInitialDividend] = useState<number>(1)
  const [highGrowthRate, setHighGrowthRate] = useState<number>(15)
  const [highGrowthYears, setHighGrowthYears] = useState<number>(5)
  const [terminalGrowthRate, setTerminalGrowthRate] = useState<number>(3)
  const [multiStageValue, setMultiStageValue] = useState<number | null>(null)

  const handleCalculateGordon = () => {
    if (currentDividend && discountRate && growthRate) {
      if (discountRate <= growthRate) {
        toast.error('Discount rate must be greater than growth rate')
        return
      }

      // Gordon Growth Model: P = D1 / (r - g)
      const nextYearDividend = currentDividend * (1 + growthRate / 100)
      const value = nextYearDividend / (discountRate / 100 - growthRate / 100)
      setCalculatedValue(value)
      toast.success('Value calculated successfully')
    } else {
      toast.error('Please enter all required values')
    }
  }

  const handleCalculateMultiStage = () => {
    if (
      initialDividend &&
      highGrowthRate &&
      discountRate &&
      highGrowthYears &&
      terminalGrowthRate
    ) {
      if (discountRate <= terminalGrowthRate) {
        toast.error('Discount rate must be greater than terminal growth rate')
        return
      }

      // Multi-stage DDM calculation
      let presentValue = 0
      let currentDividendValue = initialDividend
      const r = discountRate / 100

      // Calculate PV of dividends during high growth phase
      for (let year = 1; year <= highGrowthYears; year++) {
        currentDividendValue *= 1 + highGrowthRate / 100
        presentValue += currentDividendValue / Math.pow(1 + r, year)
      }

      // Calculate terminal value using Gordon Growth Model
      const terminalDividend = currentDividendValue * (1 + terminalGrowthRate / 100)
      const terminalValue = terminalDividend / (r - terminalGrowthRate / 100)

      // Discount terminal value back to present
      const presentTerminalValue = terminalValue / Math.pow(1 + r, highGrowthYears)

      // Add present value of high growth dividends and terminal value
      const totalValue = presentValue + presentTerminalValue

      setMultiStageValue(totalValue)
      toast.success('Multi-stage DDM value calculated successfully')
    } else {
      toast.error('Please enter all required values')
    }
  }

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(Math.round(num * 100) / 100)
  }

  return (
    <div className="w-full">
      <PageHeader
        title="Dividend Discount Model (DDM)"
        icon={<PieChart className="h-5 w-5" />}
        description="Value a company based on the present value of expected future dividends"
      />

      <div className="px-4 pb-4">
        <p className="mb-4 text-muted-foreground">
          The Dividend Discount Model (DDM) determines stock value by calculating the present value
          of expected future dividends. It's particularly useful for valuing dividend-paying stocks
          and financial institutions.
        </p>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <Tabs defaultValue="gordon-growth" className="space-y-4">
          <TabsList>
            <TabsTrigger value="gordon-growth">Gordon Growth Model</TabsTrigger>
            <TabsTrigger value="multi-stage">Multi-Stage DDM</TabsTrigger>
            <TabsTrigger value="explanation">Methodology</TabsTrigger>
          </TabsList>

          <TabsContent value="gordon-growth" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gordon Growth Model</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  The Gordon Growth Model assumes dividends grow at a constant rate forever. It
                  works best for stable, mature companies.
                </p>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="currentDividend">Current Annual Dividend</Label>
                    <Input
                      id="currentDividend"
                      type="number"
                      step="0.01"
                      value={currentDividend || ''}
                      onChange={(e) => setCurrentDividend(Number(e.target.value))}
                      placeholder="Enter annual dividend"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="growthRate">Expected Growth Rate (%)</Label>
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
                    <Label htmlFor="discountRate">Required Return Rate (%)</Label>
                    <Input
                      id="discountRate"
                      type="number"
                      step="0.1"
                      value={discountRate || ''}
                      onChange={(e) => setDiscountRate(Number(e.target.value))}
                      placeholder="Enter discount rate"
                    />
                  </div>
                </div>

                <Button onClick={handleCalculateGordon} className="mt-4">
                  Calculate Value
                </Button>

                {calculatedValue !== null && (
                  <div className="mt-6 rounded-md bg-muted p-4">
                    <h3 className="text-lg font-medium">Calculated Stock Value</h3>
                    <p className="mt-2 text-2xl font-bold text-primary">
                      ${formatNumber(calculatedValue)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Formula: P = D₁ / (r - g) = $
                      {(currentDividend * (1 + growthRate / 100)).toFixed(2)} / (
                      {(discountRate / 100).toFixed(3)} - {(growthRate / 100).toFixed(3)})
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="multi-stage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Multi-Stage DDM</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  The multi-stage model accounts for different growth phases. It's ideal for
                  companies with high initial growth rates that eventually stabilize.
                </p>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="initialDividend">Current Annual Dividend</Label>
                    <Input
                      id="initialDividend"
                      type="number"
                      step="0.01"
                      value={initialDividend || ''}
                      onChange={(e) => setInitialDividend(Number(e.target.value))}
                      placeholder="Enter annual dividend"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="highGrowthRate">Initial Growth Rate (%)</Label>
                    <Input
                      id="highGrowthRate"
                      type="number"
                      step="0.1"
                      value={highGrowthRate || ''}
                      onChange={(e) => setHighGrowthRate(Number(e.target.value))}
                      placeholder="Enter high growth rate"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discountRateMulti">Required Return Rate (%)</Label>
                    <Input
                      id="discountRateMulti"
                      type="number"
                      step="0.1"
                      value={discountRate || ''}
                      onChange={(e) => setDiscountRate(Number(e.target.value))}
                      placeholder="Enter discount rate"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="highGrowthYears">High Growth Period (Years)</Label>
                    <Input
                      id="highGrowthYears"
                      type="number"
                      value={highGrowthYears || ''}
                      onChange={(e) => setHighGrowthYears(Number(e.target.value))}
                      placeholder="Enter years"
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

                <Button onClick={handleCalculateMultiStage} className="mt-4">
                  Calculate Multi-Stage Value
                </Button>

                {multiStageValue !== null && (
                  <div className="mt-6 rounded-md bg-muted p-4">
                    <h3 className="text-lg font-medium">Calculated Stock Value (Multi-Stage)</h3>
                    <p className="mt-2 text-2xl font-bold text-primary">
                      ${formatNumber(multiStageValue)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="explanation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>About the Dividend Discount Model</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="mb-2 text-lg font-medium">Overview</h3>
                  <p>
                    The Dividend Discount Model (DDM) values a stock based on the present value of
                    all future dividend payments. It's based on the principle that an investment's
                    value is the sum of its future cash flows, discounted to present value.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-medium">Gordon Growth Model</h3>
                  <p className="mb-2">
                    The simplest form of DDM, assuming constant dividend growth forever.
                  </p>
                  <p className="rounded bg-muted p-2 font-mono">Stock Value = D₁ / (r - g)</p>
                  <p className="mt-2 text-sm">
                    Where:
                    <br />
                    D₁ = Expected dividend one year from now
                    <br />
                    r = Required rate of return (discount rate)
                    <br />g = Expected constant dividend growth rate
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-medium">Multi-Stage DDM</h3>
                  <p>
                    Accounts for different growth phases by breaking dividend growth into distinct
                    periods (e.g., high initial growth followed by stable growth).
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-medium">Best Used For</h3>
                  <ul className="list-disc space-y-1 pl-6">
                    <li>Mature companies with stable dividend histories</li>
                    <li>Financial institutions like banks</li>
                    <li>Utility companies</li>
                    <li>Companies with predictable cash flows and dividend policies</li>
                  </ul>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-medium">Limitations</h3>
                  <ul className="list-disc space-y-1 pl-6">
                    <li>Not suitable for non-dividend paying stocks</li>
                    <li>Highly sensitive to growth rate and discount rate assumptions</li>
                    <li>Assumes dividends are the only source of shareholder returns</li>
                    <li>May not account for share repurchases, which are increasingly common</li>
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
