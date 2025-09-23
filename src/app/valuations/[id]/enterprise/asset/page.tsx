'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileSpreadsheet } from 'lucide-react'

export default function AssetApproachPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Asset Approach</h1>
        <p className="mt-1 text-muted-foreground">Value the company based on net asset value</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Net Asset Value Analysis
          </CardTitle>
          <CardDescription>Analyze tangible and intangible assets</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Asset-based valuation module coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )
}
