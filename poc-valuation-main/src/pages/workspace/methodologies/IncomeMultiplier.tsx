import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/layout/PageHeader'
import { Calculator } from 'lucide-react'
import { toast } from 'sonner'

export default function IncomeMultiplier() {
  const [income, setIncome] = useState<number>(0)
  const [multiplier, setMultiplier] = useState<number>(3)
  const [calculatedValue, setCalculatedValue] = useState<number | null>(null)

  const handleCalculate = () => {
    if (income && multiplier) {
      const value = income * multiplier
      setCalculatedValue(value)
      toast.success('Value calculated successfully')
    } else {
      toast.error('Please enter income and multiplier values')
    }
  }

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(Math.round(num))
  }

  return (
    <div className="w-full">
      <PageHeader
        title="Income Multiplier Method"
        icon={<Calculator className="h-5 w-5" />}
        description="Value a business using a multiple of its income or cash flow"
      />

      <div className="px-4 pb-4">
        <p className="mb-4 text-muted-foreground">
          The Income Multiplier Method uses rule-of-thumb multipliers to determine business value
          based on annual revenue or earnings. It's commonly used for small businesses and specific
          industries where standard multiples are well-established.
        </p>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <Tabs defaultValue="calculator" className="space-y-4">
          <TabsList>
            <TabsTrigger value="calculator">Calculator</TabsTrigger>
            <TabsTrigger value="industry-multipliers">Industry Multipliers</TabsTrigger>
            <TabsTrigger value="explanation">Methodology</TabsTrigger>
          </TabsList>

          <TabsContent value="calculator" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Income Multiplier Calculator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="income">Annual Income (Revenue/Profit/EBITDA)</Label>
                    <Input
                      id="income"
                      type="number"
                      value={income || ''}
                      onChange={(e) => setIncome(Number(e.target.value))}
                      placeholder="Enter annual income"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="multiplier">Multiplier</Label>
                    <Input
                      id="multiplier"
                      type="number"
                      step="0.1"
                      value={multiplier || ''}
                      onChange={(e) => setMultiplier(Number(e.target.value))}
                      placeholder="Enter multiplier"
                    />
                  </div>
                </div>

                <Button onClick={handleCalculate} className="mt-4">
                  Calculate Value
                </Button>

                {calculatedValue !== null && (
                  <div className="mt-6 rounded-md bg-muted p-4">
                    <h3 className="text-lg font-medium">Calculated Business Value</h3>
                    <p className="mt-2 text-2xl font-bold text-primary">
                      ${formatNumber(calculatedValue)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="industry-multipliers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Common Industry Multipliers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 text-left">Industry</th>
                        <th className="py-2 text-left">Revenue Multiplier</th>
                        <th className="py-2 text-left">EBITDA Multiplier</th>
                        <th className="py-2 text-left">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2">Retail</td>
                        <td className="py-2">0.3 - 0.5x</td>
                        <td className="py-2">3 - 5x</td>
                        <td className="py-2">Depends on inventory turnover</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Manufacturing</td>
                        <td className="py-2">0.5 - 1.5x</td>
                        <td className="py-2">4 - 8x</td>
                        <td className="py-2">Higher for proprietary products</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Professional Services</td>
                        <td className="py-2">0.7 - 1.3x</td>
                        <td className="py-2">2 - 4x</td>
                        <td className="py-2">Based on client retention</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Software/SaaS</td>
                        <td className="py-2">3 - 8x</td>
                        <td className="py-2">8 - 15x</td>
                        <td className="py-2">Depends on growth rate</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Restaurants</td>
                        <td className="py-2">0.3 - 0.5x</td>
                        <td className="py-2">2 - 4x</td>
                        <td className="py-2">Location-dependent</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  Note: These multipliers are general ranges and should be adjusted based on
                  specific business factors including size, growth rate, customer concentration, and
                  market conditions.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="explanation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>About the Income Multiplier Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="mb-2 text-lg font-medium">Overview</h3>
                  <p>
                    The Income Multiplier Method is a simple valuation approach that multiplies a
                    company's income (revenue, profit, or cash flow) by an industry-specific
                    multiplier to determine business value.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-medium">Formula</h3>
                  <p className="rounded bg-muted p-2 font-mono">
                    Business Value = Annual Income × Industry Multiplier
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-medium">When to Use</h3>
                  <ul className="list-disc space-y-1 pl-6">
                    <li>Small to medium-sized businesses</li>
                    <li>Industries with established "rule-of-thumb" multipliers</li>
                    <li>Quick valuation estimates</li>
                    <li>Businesses with consistent income patterns</li>
                  </ul>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-medium">Limitations</h3>
                  <ul className="list-disc space-y-1 pl-6">
                    <li>Does not account for growth potential or risks</li>
                    <li>May oversimplify complex businesses</li>
                    <li>Highly dependent on selecting the appropriate multiplier</li>
                    <li>Does not consider balance sheet items like excess cash or debt</li>
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
