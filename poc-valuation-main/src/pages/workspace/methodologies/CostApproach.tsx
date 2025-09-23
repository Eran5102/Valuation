import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, Save, Hammer } from 'lucide-react'
import { toast } from 'sonner'
import AssetCategoryTable from '@/components/workspace/cost-approach/AssetCategoryTable'
import LiabilityCategoryTable from '@/components/workspace/cost-approach/LiabilityCategoryTable'
import SummaryCalculation from '@/components/workspace/cost-approach/SummaryCalculation'
import { CostApproachProvider } from '@/contexts/CostApproachContext'
import { PageHeader } from '@/components/layout/PageHeader'

export interface CategoryItem {
  id: string
  name: string
  value: number
  justification: string
}

export interface Category {
  id: string
  name: string
  subItems: CategoryItem[]
}

export default function CostApproach() {
  return (
    <CostApproachProvider>
      <div className="w-full">
        <PageHeader
          title="Cost Approach"
          icon={<Hammer className="h-5 w-5" />}
          description="Estimate value by determining the fair value of assets and subtracting liabilities"
        />

        <div className="px-4 pb-4">
          <p className="mb-4 text-muted-foreground">
            Calculate company value by adjusting each asset and liability to fair market value. This
            asset-based approach is useful for companies with significant tangible assets or when
            earnings approaches are less applicable.
          </p>
        </div>

        <div className="mx-auto max-w-7xl space-y-6 p-6">
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Adjusted Asset Values</h2>
            <AssetCategoryTable />
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Adjusted Liability Values</h2>
            <LiabilityCategoryTable />
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Summary Calculation</h2>
            <SummaryCalculation />
          </Card>
        </div>
      </div>
    </CostApproachProvider>
  )
}
