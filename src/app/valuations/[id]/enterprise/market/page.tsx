'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'

export default function MarketApproachPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Market Approach</h1>
        <p className="mt-1 text-muted-foreground">
          Value the company based on comparable transactions and public companies
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Comparable Company Analysis
          </CardTitle>
          <CardDescription>Analyze trading multiples and transaction comparables</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Market approach analysis coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )
}
