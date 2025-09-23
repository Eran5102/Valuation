'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign } from 'lucide-react'

export default function IncomeApproachPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Income Approach</h1>
        <p className="mt-1 text-muted-foreground">
          Value the company based on discounted cash flow analysis
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Discounted Cash Flow Analysis
          </CardTitle>
          <CardDescription>Project future cash flows and discount to present value</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">DCF analysis module coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )
}
