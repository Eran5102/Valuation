import React from 'react'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { CompsStatistics } from './CompsStatistics'
import { usePublicCompsData } from '@/hooks/usePublicCompsData'
import { useParams } from 'react-router-dom'

export function CompanyMetricsDisplay() {
  const { projectId } = useParams<{ projectId: string }>()
  const { compsData } = usePublicCompsData(projectId)

  // Mock data - replace with actual target company data
  const targetMetrics = {
    name: 'Target Company',
    revenue: 150000,
    ebitda: 45000,
    ebit: 35000,
    netIncome: 25000,
    marketCap: 300000,
    netDebt: 50000,
    enterpriseValue: 350000,
    evToRevenue: 2.3,
    evToEbitda: 7.8,
    evToEbit: 10.0,
    peRatio: 12.0,
    pToBookValue: 1.8,
    revenueGrowth: 15.0,
    ebitdaMargin: 30.0,
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Target Company Analysis</h3>

      {/* Show basic financial metrics in a table */}
      <Table className="rounded-md border">
        <TableHeader>
          <TableRow className="bg-muted/20">
            <TableHead>Company</TableHead>
            <TableHead className="text-right">Market Cap ($M)</TableHead>
            <TableHead className="text-right">Net Debt ($M)</TableHead>
            <TableHead className="text-right">Enterprise Value ($M)</TableHead>
            <TableHead className="text-right">Revenue ($M)</TableHead>
            <TableHead className="text-right">EBITDA ($M)</TableHead>
            <TableHead className="text-right">EBIT ($M)</TableHead>
            <TableHead className="text-right">Net Income ($M)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">{targetMetrics.name}</TableCell>
            <TableCell className="text-right">{targetMetrics.marketCap.toLocaleString()}</TableCell>
            <TableCell className="text-right">{targetMetrics.netDebt.toLocaleString()}</TableCell>
            <TableCell className="text-right">
              {targetMetrics.enterpriseValue.toLocaleString()}
            </TableCell>
            <TableCell className="text-right">{targetMetrics.revenue.toLocaleString()}</TableCell>
            <TableCell className="text-right">{targetMetrics.ebitda.toLocaleString()}</TableCell>
            <TableCell className="text-right">{targetMetrics.ebit.toLocaleString()}</TableCell>
            <TableCell className="text-right">{targetMetrics.netIncome.toLocaleString()}</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      {/* Show comparative statistics with target company integrated */}
      <CompsStatistics
        comps={compsData}
        targetMetrics={targetMetrics}
        title="Comparative Analysis"
        tableClassName="mt-6"
      />
    </div>
  )
}
