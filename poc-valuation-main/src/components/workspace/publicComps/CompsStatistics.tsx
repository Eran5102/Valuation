import { Table, TableBody } from '@/components/ui/table'
import { calculateStatisticalSummary } from '@/lib/utils'
import { StatisticsHeader } from './StatisticsHeader'
import { StatisticsRow, StatisticData } from './StatisticsRow'
import { cn } from '@/lib/utils'

interface CompanyData {
  ticker: string
  name: string
  date: string
  revenue: number
  ebitda: number
  ebit: number
  netIncome: number
  marketCap: number
  netDebt: number
  enterpriseValue: number
  evToRevenue: number
  evToEbitda: number
  evToEbit: number
  peRatio: number
  pToBookValue: number
  revenueGrowth: number
  ebitdaMargin: number
  source: string
  isEdited?: boolean
  includeInStats: boolean
}

interface TargetMetrics {
  name: string
  evToRevenue?: number
  evToEbitda?: number
  evToEbit?: number
  peRatio?: number
  pToBookValue?: number
  revenueGrowth?: number
  ebitdaMargin?: number
  [key: string]: string | number | undefined
}

interface CompsStatisticsProps {
  comps: CompanyData[]
  targetMetrics?: TargetMetrics
  title?: string
  showHeader?: boolean
  className?: string
  tableClassName?: string
  rowClassName?: string
  compact?: boolean
  striped?: boolean
}

export function CompsStatistics({
  comps,
  targetMetrics,
  title = 'Summary Statistics',
  showHeader = true,
  className = '',
  tableClassName = '',
  rowClassName = '',
  compact = false,
  striped = true,
}: CompsStatisticsProps) {
  // Filter to only include comps that are marked for inclusion in stats
  const includedComps = comps.filter((comp) => comp.includeInStats)

  // Skip calculations if no companies are included
  if (includedComps.length === 0) {
    return (
      <div className={cn('mt-6', className)}>
        <p className="italic text-muted-foreground">
          No companies are currently included in statistics. Toggle the "Include" checkbox to add
          companies.
        </p>
      </div>
    )
  }

  const evToRevenueStats = calculateStatisticalSummary(
    includedComps.map((comp) => comp.evToRevenue)
  )
  const evToEbitdaStats = calculateStatisticalSummary(includedComps.map((comp) => comp.evToEbitda))
  const evToEbitStats = calculateStatisticalSummary(includedComps.map((comp) => comp.evToEbit))
  const peRatioStats = calculateStatisticalSummary(includedComps.map((comp) => comp.peRatio))
  const pToBookValueStats = calculateStatisticalSummary(
    includedComps.map((comp) => comp.pToBookValue)
  )
  const revenueGrowthStats = calculateStatisticalSummary(
    includedComps.map((comp) => comp.revenueGrowth)
  )
  const ebitdaMarginStats = calculateStatisticalSummary(
    includedComps.map((comp) => comp.ebitdaMargin)
  )

  const percentFormatter = (value: number | null) => {
    if (value === null || value === undefined) return 'N/A'
    return `${value.toFixed(1)}%`
  }

  const multipleFormatter = (value: number | null) => {
    if (value === null || value === undefined) return 'N/A'
    return `${value.toFixed(1)}x`
  }

  // Default columns for standard view
  const defaultColumns = [
    { label: 'Metric' },
    { label: 'Mean', tooltip: 'Average of all values' },
    { label: '25th Percentile', tooltip: 'Value below which 25% of observations fall' },
    { label: 'Median', tooltip: 'Middle value (50th percentile)' },
    { label: '75th Percentile', tooltip: 'Value below which 75% of observations fall' },
  ]

  // Columns for compact view
  const compactColumns = [
    { label: 'Metric' },
    { label: 'Median', tooltip: 'Middle value (50th percentile)' },
    { label: 'Mean', tooltip: 'Average of all values' },
  ]

  // Check if we have target metrics to display
  const hasTargetMetrics = !!targetMetrics

  return (
    <div className={cn('mt-6', className)}>
      {showHeader && (
        <h3 className={cn('text-lg font-semibold', compact ? 'mb-2' : 'mb-4')}>
          {title} ({includedComps.length} companies included)
        </h3>
      )}
      <Table className={cn('overflow-hidden rounded-md border', tableClassName)}>
        <StatisticsHeader
          columns={compact ? compactColumns : defaultColumns}
          showTargetCompany={hasTargetMetrics}
        />
        <TableBody>
          <StatisticsRow
            label="EV/Revenue"
            data={evToRevenueStats}
            targetValue={targetMetrics?.evToRevenue}
            format={multipleFormatter}
            highlightOutliers
            className={rowClassName}
            compact={compact}
            striped={striped}
            index={0}
          />
          <StatisticsRow
            label="EV/EBITDA"
            data={evToEbitdaStats}
            targetValue={targetMetrics?.evToEbitda}
            format={multipleFormatter}
            highlightOutliers
            className={rowClassName}
            compact={compact}
            striped={striped}
            index={1}
          />
          <StatisticsRow
            label="EV/EBIT"
            data={evToEbitStats}
            targetValue={targetMetrics?.evToEbit}
            format={multipleFormatter}
            highlightOutliers
            className={rowClassName}
            compact={compact}
            striped={striped}
            index={2}
          />
          <StatisticsRow
            label="P/E Ratio"
            data={peRatioStats}
            targetValue={targetMetrics?.peRatio}
            format={multipleFormatter}
            highlightOutliers
            className={rowClassName}
            compact={compact}
            striped={striped}
            index={3}
          />
          <StatisticsRow
            label="P/Book Value"
            data={pToBookValueStats}
            targetValue={targetMetrics?.pToBookValue}
            format={multipleFormatter}
            highlightOutliers
            className={rowClassName}
            compact={compact}
            striped={striped}
            index={4}
          />
          <StatisticsRow
            label="LTM Revenue Growth"
            data={revenueGrowthStats}
            targetValue={targetMetrics?.revenueGrowth}
            format={percentFormatter}
            className={rowClassName}
            compact={compact}
            striped={striped}
            index={5}
          />
          <StatisticsRow
            label="LTM EBITDA Margin"
            data={ebitdaMarginStats}
            targetValue={targetMetrics?.ebitdaMargin}
            format={percentFormatter}
            className={rowClassName}
            compact={compact}
            striped={striped}
            index={6}
          />
        </TableBody>
      </Table>
    </div>
  )
}
