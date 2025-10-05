'use client'

import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calculator, TrendingUp } from 'lucide-react'
import { OPMBacksolve } from '../OPMBacksolve'
import { HybridScenarioManager } from './HybridScenarioManager'

interface OPMMainPanelProps {
  valuationId: string
  assumptions?: any
}

export function OPMMainPanel({ valuationId, assumptions }: OPMMainPanelProps) {
  const [activeTab, setActiveTab] = useState<'single' | 'hybrid'>('single')

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'single' | 'hybrid')}>
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="single" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Single OPM
              </TabsTrigger>
              <TabsTrigger value="hybrid" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Hybrid PWERM
              </TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="mt-6 space-y-6">
              <div className="bg-muted/30 rounded-lg border p-4">
                <h3 className="text-lg font-semibold">Single Scenario OPM</h3>
                <p className="text-sm text-muted-foreground">
                  Calculate equity allocation for a single enterprise value scenario using the
                  Black-Scholes option pricing model
                </p>
              </div>

              <OPMBacksolve valuationId={valuationId} assumptions={assumptions} />
            </TabsContent>

            <TabsContent value="hybrid" className="mt-6 space-y-6">
              <div className="bg-muted/30 rounded-lg border p-4">
                <h3 className="text-lg font-semibold">Hybrid Scenario PWERM</h3>
                <p className="text-sm text-muted-foreground">
                  Analyze multiple liquidity scenarios with probability-weighted expected return
                  method (PWERM) to calculate a weighted fair market value
                </p>
              </div>

              <HybridScenarioManager valuationId={valuationId} assumptions={assumptions} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Educational Information */}
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="text-base">About OPM</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>Single OPM:</strong> Uses the Black-Scholes option pricing formula to allocate
            enterprise value across equity classes based on their liquidation preferences,
            participation rights, and conversion features.
          </p>
          <p>
            <strong>Hybrid PWERM:</strong> Combines multiple scenarios (e.g., IPO, acquisition, down
            round) weighted by their probabilities to calculate a single probability-weighted fair
            market value.
          </p>
          <p className="text-xs">
            Parameters are automatically pulled from the Assumptions page but can be overridden
            here.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
