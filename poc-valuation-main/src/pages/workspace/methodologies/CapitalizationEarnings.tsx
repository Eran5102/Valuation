import { useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function CapitalizationEarnings() {
  const [normalizedEarnings, setNormalizedEarnings] = useState<number>(0)
  const [capRate, setCapRate] = useState<number>(0.15)
  const [notes, setNotes] = useState<string>('')

  // Simple calculation for business value based on capitalization of earnings method
  const businessValue = normalizedEarnings / capRate

  return (
    <div className="w-full">
      <PageHeader
        title="Capitalization of Earnings"
        icon={<TrendingUp className="h-5 w-5" />}
        description="Calculate business value based on normalized earnings and capitalization rate"
      />
      <div className="px-4">
        <p className="mb-4 text-muted-foreground">
          Value a business by dividing its normalized earnings by an appropriate capitalization
          rate. This approach is well-suited for stable businesses with predictable earnings and
          modest growth expectations.
        </p>

        <div className="mx-auto max-w-6xl space-y-6 py-4">
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Calculation Inputs</h2>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <Label htmlFor="normalized-earnings" required>
                  Normalized Annual Earnings ($)
                </Label>
                <Input
                  id="normalized-earnings"
                  type="number"
                  min="0"
                  value={normalizedEarnings || ''}
                  onChange={(e) => setNormalizedEarnings(parseFloat(e.target.value) || 0)}
                  className="mt-2"
                  required
                />
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter the business's annual earnings after adjusting for non-recurring items
                </p>
              </div>

              <div>
                <Label htmlFor="cap-rate" required>
                  Capitalization Rate (%)
                </Label>
                <Input
                  id="cap-rate"
                  type="number"
                  min="0.01"
                  max="1"
                  step="0.01"
                  value={capRate || ''}
                  onChange={(e) => setCapRate(parseFloat(e.target.value) || 0)}
                  className="mt-2"
                  required
                />
                <p className="mt-1 text-sm text-muted-foreground">
                  Higher rates are used for riskier businesses or uncertain earnings
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-muted/30 p-6">
            <h2 className="mb-4 text-lg font-semibold">Calculation Result</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Business Value</p>
                <p className="text-3xl font-bold">
                  $
                  {isFinite(businessValue)
                    ? businessValue.toLocaleString('en-US', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })
                    : 'N/A'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Normalized Earnings ÷ Capitalization Rate
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm font-medium">Formula</p>
                <p className="text-lg">
                  ${normalizedEarnings.toLocaleString()} ÷ {(capRate * 100).toFixed(1)}% = $
                  {isFinite(businessValue) ? businessValue.toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Analysis Notes</h2>
            <Textarea
              placeholder="Add notes about your capitalization rate selection, earnings normalization process, and other relevant factors..."
              className="min-h-[100px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="mt-4 flex justify-end">
              <Button variant="outline" className="mr-2">
                Reset
              </Button>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                Save Analysis
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
