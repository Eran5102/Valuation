import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageHeader } from '@/components/layout/PageHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LineChart, ChevronUp, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'

export default function EarningsBased() {
  // PE Ratio inputs
  const [earnings, setEarnings] = useState<number>(1000000)
  const [peRatio, setPeRatio] = useState<number>(15)
  const [peValue, setPeValue] = useState<number | null>(null)

  // Normalized earnings inputs
  const [historicalEarnings, setHistoricalEarnings] = useState([
    { year: 'Year 1', amount: 800000 },
    { year: 'Year 2', amount: 950000 },
    { year: 'Year 3', amount: 1100000 },
    { year: 'Year 4', amount: 920000 },
    { year: 'Year 5', amount: 1050000 },
  ])
  const [selectedYears, setSelectedYears] = useState<number[]>([0, 1, 2, 3, 4])
  const [weightedMethod, setWeightedMethod] = useState<boolean>(true)
  const [normalizedPeRatio, setNormalizedPeRatio] = useState<number>(14)
  const [normalizedValue, setNormalizedValue] = useState<number | null>(null)

  const handleCalculatePE = () => {
    if (earnings && peRatio) {
      const value = earnings * peRatio
      setPeValue(value)
      toast.success('PE-based value calculated successfully')
    } else {
      toast.error('Please enter earnings and PE ratio')
    }
  }

  const handleToggleYearSelection = (index: number) => {
    setSelectedYears((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index)
      } else {
        return [...prev, index]
      }
    })
  }

  const handleCalculateNormalized = () => {
    if (selectedYears.length === 0) {
      toast.error('Please select at least one year')
      return
    }

    let normalizedEarnings: number

    if (weightedMethod) {
      // Calculate weighted average (more recent years have higher weights)
      let totalWeight = 0
      let weightedSum = 0

      selectedYears.forEach((index) => {
        const weight = index + 1 // Year 1 has weight 1, Year 2 has weight 2, etc.
        totalWeight += weight
        weightedSum += historicalEarnings[index].amount * weight
      })

      normalizedEarnings = weightedSum / totalWeight
    } else {
      // Simple average
      const sum = selectedYears.reduce((acc, index) => acc + historicalEarnings[index].amount, 0)
      normalizedEarnings = sum / selectedYears.length
    }

    const value = normalizedEarnings * normalizedPeRatio
    setNormalizedValue(value)

    toast.success('Normalized earnings-based value calculated successfully')
  }

  const handleUpdateEarnings = (index: number, value: number) => {
    setHistoricalEarnings((prev) => {
      const updated = [...prev]
      updated[index].amount = value
      return updated
    })
  }

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(Math.round(num))
  }

  return (
    <div className="w-full">
      <PageHeader
        title="Earnings-Based Valuation"
        icon={<LineChart className="h-5 w-5" />}
        description="Value a company based on its earnings and appropriate multiples"
      />

      <div className="px-4 pb-4">
        <p className="mb-4 text-muted-foreground">
          Earnings-based valuation methods determine company value by applying appropriate multiples
          to company earnings, whether using the current period or normalized over time.
        </p>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <Tabs defaultValue="simple-pe" className="space-y-4">
          <TabsList>
            <TabsTrigger value="simple-pe">Simple P/E Method</TabsTrigger>
            <TabsTrigger value="normalized">Normalized Earnings</TabsTrigger>
            <TabsTrigger value="explanation">Methodology</TabsTrigger>
          </TabsList>

          <TabsContent value="simple-pe" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>P/E Ratio Valuation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Apply a price-to-earnings (P/E) ratio to the company's latest annual earnings to
                  determine its value.
                </p>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="earnings">Annual Earnings (Net Income)</Label>
                    <Input
                      id="earnings"
                      type="number"
                      value={earnings || ''}
                      onChange={(e) => setEarnings(Number(e.target.value))}
                      placeholder="Enter annual earnings"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="peRatio">P/E Ratio</Label>
                    <Input
                      id="peRatio"
                      type="number"
                      step="0.1"
                      value={peRatio || ''}
                      onChange={(e) => setPeRatio(Number(e.target.value))}
                      placeholder="Enter P/E ratio"
                    />
                  </div>
                </div>

                <Button onClick={handleCalculatePE} className="mt-4">
                  Calculate P/E Value
                </Button>

                {peValue !== null && (
                  <div className="mt-6 rounded-md bg-muted p-4">
                    <h3 className="text-lg font-medium">Calculated Company Value (P/E Method)</h3>
                    <p className="mt-2 text-2xl font-bold text-primary">${formatNumber(peValue)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Formula: Company Value = Earnings × P/E Ratio = ${formatNumber(earnings)} ×{' '}
                      {peRatio}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="normalized" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Normalized Earnings Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Calculate a normalized earnings figure based on historical performance, then apply
                  an appropriate multiple.
                </p>

                <h3 className="text-md mt-4 font-medium">Historical Earnings</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 text-left">Period</th>
                        <th className="py-2 text-left">Earnings</th>
                        <th className="py-2 text-left">Include</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historicalEarnings.map((year, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2">{year.year}</td>
                          <td className="py-2">
                            <Input
                              type="number"
                              value={year.amount || ''}
                              onChange={(e) => handleUpdateEarnings(index, Number(e.target.value))}
                              className="w-full"
                            />
                          </td>
                          <td className="py-2">
                            <Button
                              variant={selectedYears.includes(index) ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleToggleYearSelection(index)}
                            >
                              {selectedYears.includes(index) ? (
                                <>
                                  <ChevronDown className="mr-1 h-4 w-4" /> Included
                                </>
                              ) : (
                                <>
                                  <ChevronUp className="mr-1 h-4 w-4" /> Excluded
                                </>
                              )}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="averageMethod">Calculation Method</Label>
                    <Select
                      value={weightedMethod ? 'weighted' : 'simple'}
                      onValueChange={(value) => setWeightedMethod(value === 'weighted')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select calculation method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weighted">
                          Weighted Average (Recent Years Weighted Higher)
                        </SelectItem>
                        <SelectItem value="simple">Simple Average</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="normalizedPeRatio">P/E Multiple for Normalized Earnings</Label>
                    <Input
                      id="normalizedPeRatio"
                      type="number"
                      step="0.1"
                      value={normalizedPeRatio || ''}
                      onChange={(e) => setNormalizedPeRatio(Number(e.target.value))}
                      placeholder="Enter P/E ratio for normalized earnings"
                    />
                  </div>
                </div>

                <Button onClick={handleCalculateNormalized} className="mt-4">
                  Calculate Normalized Value
                </Button>

                {normalizedValue !== null && (
                  <div className="mt-6 rounded-md bg-muted p-4">
                    <h3 className="text-lg font-medium">
                      Calculated Company Value (Normalized Earnings)
                    </h3>
                    <p className="mt-2 text-2xl font-bold text-primary">
                      ${formatNumber(normalizedValue)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="explanation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>About Earnings-Based Valuation Methods</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="mb-2 text-lg font-medium">Overview</h3>
                  <p>
                    Earnings-based valuation methods determine a company's value by applying
                    appropriate multiples to earnings metrics. These approaches are widely used due
                    to their simplicity and effectiveness, especially for comparing similar
                    companies.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-medium">Simple P/E Method</h3>
                  <p className="mb-2">
                    The P/E (Price-to-Earnings) method applies an industry-appropriate multiple to a
                    company's earnings.
                  </p>
                  <p className="rounded bg-muted p-2 font-mono">
                    Company Value = Earnings × P/E Ratio
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-medium">Normalized Earnings Method</h3>
                  <p className="mb-2">
                    Normalizes earnings by adjusting for unusual or non-recurring items and
                    averaging over multiple years. This smooths out cyclicality and one-time events
                    to provide a more stable earnings metric.
                  </p>
                  <p className="rounded bg-muted p-2 font-mono">
                    Company Value = Normalized Earnings × Selected Multiple
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-medium">When to Use</h3>
                  <ul className="list-disc space-y-1 pl-6">
                    <li>Established companies with consistent earnings</li>
                    <li>Industry comparisons</li>
                    <li>Companies in mature industries</li>
                    <li>Quick valuation estimates</li>
                  </ul>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-medium">Limitations</h3>
                  <ul className="list-disc space-y-1 pl-6">
                    <li>May not be appropriate for growth companies not yet profitable</li>
                    <li>Can be skewed by accounting choices</li>
                    <li>Doesn't explicitly account for future growth potential</li>
                    <li>Doesn't consider balance sheet strength or capital structure</li>
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
