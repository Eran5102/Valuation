'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Percent } from 'lucide-react'

export default function MinorityDiscountPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Minority Interest Discount</h1>
        <p className="mt-1 text-muted-foreground">Apply discounts for lack of control</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Minority Discount Analysis
          </CardTitle>
          <CardDescription>Calculate appropriate minority interest discounts</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Minority discount module coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )
}
