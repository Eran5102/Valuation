import { useState } from 'react'
import { useCostApproach } from '@/contexts/CostApproachContext'
import { Input } from '@/components/ui/input'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function SummaryCalculation() {
  const { calculations } = useCostApproach()
  const [sharesOutstanding, setSharesOutstanding] = useState<number>(0)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value)
  }

  const pricePerShare =
    sharesOutstanding > 0 ? calculations.impliedEquityValue / sharesOutstanding : 0

  const handleSave = () => {
    toast.success(
      'Cost approach valuation has been saved and will be available in the valuation synthesis.'
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Total Adjusted Assets</label>
          <div className="text-lg font-semibold">{formatCurrency(calculations.totalAssets)}</div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Less: Total Adjusted Liabilities</label>
          <div className="text-lg font-semibold text-red-500">
            ({formatCurrency(calculations.totalLiabilities)})
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="space-y-2">
          <label className="text-lg font-medium">Implied Equity Value</label>
          <div className="text-2xl font-bold text-primary">
            {formatCurrency(calculations.impliedEquityValue)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t pt-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Number of Ordinary Shares</label>
          <Input
            type="number"
            min="0"
            value={sharesOutstanding || ''}
            onChange={(e) => setSharesOutstanding(parseFloat(e.target.value) || 0)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Implied Price Per Share</label>
          <div className="text-lg font-semibold">{formatCurrency(pricePerShare)}</div>
        </div>
      </div>

      <Button onClick={handleSave} className="w-full">
        <Save className="mr-2 h-4 w-4" />
        Save Valuation
      </Button>
    </div>
  )
}
