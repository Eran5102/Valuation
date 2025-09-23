'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Layers } from 'lucide-react'

export default function HybridPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Hybrid Method</h1>
        <p className="mt-1 text-muted-foreground">
          Combine OPM and PWERM for comprehensive allocation
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Hybrid Allocation
          </CardTitle>
          <CardDescription>Weighted combination of multiple allocation methods</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Hybrid allocation module coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )
}
