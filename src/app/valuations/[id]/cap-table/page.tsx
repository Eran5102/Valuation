'use client'

import { useParams } from 'next/navigation'
import { UnifiedCapTable } from '@/components/valuation/UnifiedCapTable'
import BreakpointsAnalysis from '@/components/valuation/BreakpointsAnalysis'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, Target } from 'lucide-react'

export default function CapTablePage() {
  const params = useParams()
  const valuationId = params?.id as string

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Capitalization Table</h1>
        <p className="mt-1 text-muted-foreground">
          Manage share classes, options, and ownership structure
        </p>
      </div>

      <Tabs defaultValue="share-classes" className="space-y-6">
        <TabsList>
          <TabsTrigger value="share-classes" className="flex items-center gap-2">
            <Table className="h-4 w-4" />
            Share Classes
          </TabsTrigger>
          <TabsTrigger value="breakpoints" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Breakpoints
          </TabsTrigger>
        </TabsList>

        <TabsContent value="share-classes" className="space-y-6">
          <UnifiedCapTable valuationId={valuationId} />
        </TabsContent>

        <TabsContent value="breakpoints" className="space-y-6">
          <BreakpointsAnalysis valuationId={valuationId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
