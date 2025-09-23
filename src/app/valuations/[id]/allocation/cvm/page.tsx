'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign } from 'lucide-react'

export default function CVMPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Current Value Method (CVM)</h1>
        <p className="mt-1 text-muted-foreground">
          Allocate value based on current liquidation preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Current Value Allocation
          </CardTitle>
          <CardDescription>Waterfall analysis based on current liquidation</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">CVM allocation module coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )
}
