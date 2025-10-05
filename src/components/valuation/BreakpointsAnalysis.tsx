import React, { useState, useEffect } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import {
  BarChart3,
  Calculator,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Activity,
  Layers,
  Target,
  Zap,
  RotateCcw,
  X,
  TrendingUp,
  Clock,
  Database,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import dynamic from 'next/dynamic'

const OptimizedDataTable = dynamic(
  () =>
    import('@/components/ui/optimized-data-table').then((mod) => ({
      default: mod.OptimizedDataTable,
    })),
  {
    loading: () => <LoadingSpinner size="md" className="p-4" />,
    ssr: false,
  }
)
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { CapTableConfig } from '@/types'
import { formatCurrency, formatNumber, formatRVPS } from '@/lib/utils'

interface BreakpointsAnalysisProps {
  valuationId: string
  companyId?: string
  capTableConfig?: CapTableConfig
}

// Breakpoint type configurations with icons and colors
const BREAKPOINT_TYPES = {
  liquidation_preference: {
    label: 'Liquidation Preference',
    icon: Target,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  pro_rata_distribution: {
    label: 'Pro-rata Distribution',
    icon: Layers,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  option_exercise: {
    label: 'Option Exercise',
    icon: Activity,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  participation_cap: {
    label: 'Participation Cap',
    icon: Zap,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  voluntary_conversion: {
    label: 'Conversion',
    icon: RotateCcw,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
  },
}

interface Participant {
  securityName: string
  securityType: string
  participatingShares: number
  participationPercentage: number
  rvpsAtBreakpoint: number
  cumulativeRVPS: number
  sectionValue: number
  cumulativeValue: number
  participationStatus: string
  participationNotes: string
}

interface Breakpoint {
  breakpointType: string
  breakpointOrder: number
  rangeFrom: number
  rangeTo: number | null
  exitValue: number
  isOpenEnded: boolean
  affectedSecurities: string[]
  calculationMethod: string
  priorityOrder: number
  explanation: string
  mathematicalDerivation: string
  dependencies: string[]
  totalParticipatingShares: number
  sectionRVPS: number
  redemptionValuePerShare: number
  participants: Participant[]
}

interface ValidationResult {
  testName: string
  passed: boolean
  expected: any
  actual: any
  message: string
}

interface RVPSData {
  securityName: string
  sectionRVPS: number
  cumulativeRVPS: number
  shares: number
  percentage: string
  sectionValue: number
  cumulativeValue: number
}

interface BreakpointAnalysisData {
  totalBreakpoints: number
  breakpointsByType: Record<string, number>
  sortedBreakpoints: Breakpoint[]
  criticalValues: Array<{
    value: number
    description: string
    affectedSecurities: string[]
    triggers: string[]
  }>
  auditSummary: string
  validationResults: ValidationResult[]
  performanceMetrics: {
    analysisTimeMs: number
    iterationsUsed: Record<string, number>
    cacheHits: number
  }
  // Persistence metadata
  from_cache?: boolean
  analysis_timestamp?: string
  saved_to_database?: boolean
}

// V3 API Response Format
interface V3BreakpointResponse {
  success: boolean
  version: 'v3'
  data: any[] // RangeBasedBreakpoint[]
  validation: {
    capTable: any
    breakpoints: any
    consistency: any
  }
  metadata: {
    totalBreakpoints: number
    breakpointTypes: Record<string, number>
    executionOrder: string[]
  }
  errors: string[]
  warnings: string[]
  from_cache: boolean
}

export default function BreakpointsAnalysis({
  valuationId,
  companyId,
  capTableConfig,
}: BreakpointsAnalysisProps) {
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysisData, setAnalysisData] = useState<BreakpointAnalysisData | null>(null)
  const [currentExitValue] = useState(10000000) // Default to $10M exit value

  const runBreakpointAnalysis = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/valuations/${valuationId}/breakpoints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          includeOptions: true,
          analysisType: 'comprehensive',
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: V3BreakpointResponse = await response.json()

      console.log(`[Breakpoints UI] Received ${result.data?.length || 0} breakpoints from API`)
      console.log(`[Breakpoints UI] Analysis success:`, result.success)

      if (result.success) {
        // Transform V3 response to component format
        const transformedData = transformV3Response(result)
        console.log(
          `[Breakpoints UI] Transformed to ${transformedData.sortedBreakpoints.length} breakpoints`
        )
        setAnalysisData(transformedData)
        setAnalysisComplete(true)
      } else {
        // Log detailed error information
        console.error('[Breakpoints UI] Analysis failed with errors:', result.errors)
        console.error('[Breakpoints UI] Validation results:', result.validation)

        // Create detailed error message
        const errorDetails = [
          ...result.errors,
          ...(result.validation?.consistency?.tests
            ?.filter((t: any) => !t.passed && t.severity === 'error')
            .map((t: any) => `  - ${t.message}`) || []),
        ].join('\n')

        throw new Error(errorDetails || 'Analysis failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run analysis')
      setAnalysisComplete(false)
    } finally {
      setLoading(false)
    }
  }

  const transformV3Response = (result: V3BreakpointResponse): BreakpointAnalysisData => {
    // Transform V3 range-based breakpoints to component format
    const sortedBreakpoints = result.data
      .map((bp: any, index: number) => ({
        breakpointType: bp.breakpointType || 'liquidation_preference',
        breakpointOrder: bp.breakpointOrder || index + 1,
        rangeFrom: parseFloat(bp.rangeFrom) || 0,
        rangeTo: bp.rangeTo ? parseFloat(bp.rangeTo) : null,
        exitValue: parseFloat(bp.rangeFrom) || 0,
        isOpenEnded: bp.isOpenEnded || false,
        affectedSecurities: bp.affectedSecurities || [],
        calculationMethod: bp.calculationMethod || '',
        priorityOrder: bp.priorityOrder || 0,
        explanation: bp.explanation || '',
        mathematicalDerivation: bp.mathematicalDerivation || '',
        dependencies: bp.dependencies || [],
        totalParticipatingShares: parseFloat(bp.totalParticipatingShares) || 0,
        sectionRVPS: parseFloat(bp.sectionRVPS) || 0,
        redemptionValuePerShare: parseFloat(bp.redemptionValuePerShare) || 0,
        participants: (bp.participants || []).map((p: any) => ({
          securityName: p.securityName,
          securityType: p.securityType,
          participatingShares: parseFloat(p.participatingShares) || 0,
          participationPercentage: parseFloat(p.participationPercentage) || 0,
          rvpsAtBreakpoint: parseFloat(p.rvpsAtBreakpoint) || 0,
          cumulativeRVPS: parseFloat(p.cumulativeRVPS) || 0,
          sectionValue: parseFloat(p.sectionValue) || 0,
          cumulativeValue: parseFloat(p.cumulativeValue) || 0,
          participationStatus: p.participationStatus || 'active',
          participationNotes: p.participationNotes || '',
        })),
      }))
      .sort((a, b) => a.breakpointOrder - b.breakpointOrder) // Sort by breakpoint order

    return {
      totalBreakpoints: result.metadata.totalBreakpoints,
      breakpointsByType: result.metadata.breakpointTypes,
      sortedBreakpoints,
      criticalValues: [],
      auditSummary: '',
      validationResults: [],
      performanceMetrics: {
        analysisTimeMs: 0,
        iterationsUsed: {},
        cacheHits: 0,
      },
      from_cache: result.from_cache,
    }
  }

  // Load existing analysis on component mount
  useEffect(() => {
    const loadExistingAnalysis = async () => {
      try {
        const response = await fetch(`/api/valuations/${valuationId}/breakpoints`)
        if (response.ok) {
          const result: V3BreakpointResponse = await response.json()
          console.log(
            `[Breakpoints UI Load] Received ${result.data?.length || 0} breakpoints from API`
          )
          console.log(`[Breakpoints UI Load] Analysis success:`, result.success)

          if (result.success && result.data) {
            // Transform V3 response
            const transformedData = transformV3Response(result)
            console.log(
              `[Breakpoints UI Load] Transformed to ${transformedData.sortedBreakpoints.length} breakpoints`
            )
            setAnalysisData(transformedData)
            setAnalysisComplete(true)
          } else if (!result.success) {
            // Log error details for failed analysis on load
            console.error('[Breakpoints UI Load] Analysis failed:', result.errors)
            console.error('[Breakpoints UI Load] Validation:', result.validation)
          }
        }
      } catch (err) {
        // Silently fail - analysis just won't be loaded
      }
    }

    if (valuationId) {
      loadExistingAnalysis()
    }
  }, [valuationId])

  // Helper function to get breakpoint type configuration
  const getBreakpointTypeConfig = (breakpointType: string | undefined) => {
    if (!breakpointType) return BREAKPOINT_TYPES.liquidation_preference // fallback for undefined

    // Direct match first (V3 returns exact enum values)
    if (breakpointType === 'liquidation_preference') return BREAKPOINT_TYPES.liquidation_preference
    if (breakpointType === 'pro_rata_distribution') return BREAKPOINT_TYPES.pro_rata_distribution
    if (breakpointType === 'option_exercise') return BREAKPOINT_TYPES.option_exercise
    if (breakpointType === 'participation_cap') return BREAKPOINT_TYPES.participation_cap
    if (breakpointType === 'voluntary_conversion') return BREAKPOINT_TYPES.voluntary_conversion

    // Fallback to substring matching for legacy formats
    if (breakpointType.includes('liquidation')) return BREAKPOINT_TYPES.liquidation_preference
    if (breakpointType.includes('pro_rata')) return BREAKPOINT_TYPES.pro_rata_distribution
    if (breakpointType.includes('option')) return BREAKPOINT_TYPES.option_exercise
    if (breakpointType.includes('participation')) return BREAKPOINT_TYPES.participation_cap
    if (breakpointType.includes('conversion')) return BREAKPOINT_TYPES.voluntary_conversion

    return BREAKPOINT_TYPES.liquidation_preference // final fallback
  }

  // Transform breakpoints into waterfall ranges using V3 data directly
  const waterfallRanges = analysisData?.sortedBreakpoints
    ? analysisData.sortedBreakpoints.map((breakpoint, index, array) => {
        // Use V3's rangeFrom and rangeTo instead of recalculating
        const rangeStart = breakpoint.rangeFrom
        const rangeEnd = breakpoint.rangeTo
        const isLastRange = breakpoint.isOpenEnded || breakpoint.rangeTo === null

        // Map V3 participants to display format for the table
        const participatingShares = (breakpoint.participants || []).map((p: Participant) => ({
          name: p.securityName,
          shares: p.participatingShares,
          percentage: `${(p.participationPercentage * 100).toFixed(2)}%`,
        }))

        return {
          ...breakpoint,
          rangeStart,
          rangeEnd,
          isLastRange,
          participatingShares,
          // CRITICAL: Pass through V3 participants for RVPS popups
          participants: breakpoint.participants,
        }
      })
    : []

  // Calculate participating shares and percentages for each range
  function calculateParticipatingShares(breakpoint: any, capTableConfig: any) {
    const shareClasses = capTableConfig?.shareClasses || []
    const options = capTableConfig?.options || []
    const participants: Array<{ name: string; shares: number; percentage: string }> = []

    switch (breakpoint.breakpointType) {
      case 'liquidation_preference':
        // Only the specific preferred class participates in LP
        const lpClass = shareClasses.find((sc: any) =>
          breakpoint.affectedSecurities.includes(sc.name)
        )
        if (lpClass) {
          participants.push({
            name: lpClass.name,
            shares: lpClass.sharesOutstanding,
            percentage: '100.00%',
          })
        }
        break

      case 'pro_rata_distribution':
      case 'option_exercise':
      case 'participation_cap':
      case 'voluntary_conversion':
        // All participating securities share pro-rata
        let totalShares = 0

        // Add common shares (founders)
        const commonShares = shareClasses
          .filter((sc: any) => sc.shareType === 'common')
          .reduce((sum: number, sc: any) => sum + sc.sharesOutstanding, 0)
        if (commonShares > 0) {
          totalShares += commonShares
          participants.push({
            name: 'Founders',
            shares: commonShares,
            percentage: '0.00%', // Will calculate below
          })
        }

        // Add participating preferred
        shareClasses
          .filter(
            (sc: any) =>
              sc.shareType === 'preferred' &&
              (sc.preferenceType === 'participating' ||
                sc.preferenceType === 'participating-with-cap')
          )
          .forEach((sc: any) => {
            const convertedShares = sc.sharesOutstanding * (sc.conversionRatio || 1)
            totalShares += convertedShares
            participants.push({
              name: sc.name,
              shares: convertedShares,
              percentage: '0.00%',
            })
          })

        // Add exercised options (if breakpoint includes them)
        if (breakpoint.breakpointType === 'option_exercise' || breakpoint.exitValue >= 28382344) {
          // $1.25 option threshold
          options.forEach((opt: any) => {
            const exerciseThreshold = opt.exercisePrice === 1.25 ? 28382344 : 29675728
            if (breakpoint.exitValue >= exerciseThreshold) {
              totalShares += opt.numOptions
              participants.push({
                name: `Options @ $${opt.exercisePrice}`,
                shares: opt.numOptions,
                percentage: '0.00%',
              })
            }
          })
        }

        // Calculate percentages
        participants.forEach((p) => {
          p.percentage =
            totalShares > 0 ? ((p.shares / totalShares) * 100).toFixed(2) + '%' : '0.00%'
        })
        break
    }

    return participants
  }

  // Get RVPS data directly from V3 breakpoint participants (NO RECALCULATION)
  function calculateRVPSData(range: any, exitValue: number, previousRanges: any[]): RVPSData[] {
    // Use the participant data that V3 already calculated correctly
    const participants = range.participants || []

    return participants.map((participant: Participant) => {
      return {
        securityName: participant.securityName,
        sectionRVPS: participant.rvpsAtBreakpoint, // Section RVPS from V3
        cumulativeRVPS: participant.cumulativeRVPS, // Cumulative RVPS from V3
        shares: participant.participatingShares,
        percentage: `${(participant.participationPercentage * 100).toFixed(2)}%`,
        sectionValue: participant.sectionValue, // Section value from V3
        cumulativeValue: participant.cumulativeValue, // Cumulative value from V3
      }
    })
  }

  // RVPS Modal Component
  const RVPSModal = ({
    range,
    type,
    rangeIndex,
  }: {
    range: any
    type: 'section' | 'cumulative'
    rangeIndex: number
  }) => {
    const previousRanges = waterfallRanges.slice(0, rangeIndex)
    const rvpsData = calculateRVPSData(range, currentExitValue, previousRanges)

    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="link" size="sm" className="hover:text-primary/80 p-0 text-primary">
            View Details
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {type === 'section' ? 'Section RVPS' : 'Cumulative RVPS'} - Range #{rangeIndex + 1}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>
                Range: {formatCurrency(range.rangeStart)} to{' '}
                {range.isLastRange ? '∞' : formatCurrency(range.rangeEnd)}
              </p>
              <p>Exit Value: {formatCurrency(currentExitValue)}</p>
            </div>

            <div className="overflow-hidden rounded-lg border">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr className="text-sm">
                    <th className="p-3 text-left font-medium">Security</th>
                    <th className="p-3 text-right font-medium">Shares</th>
                    <th className="p-3 text-right font-medium">% Participation</th>
                    <th className="p-3 text-right font-medium">
                      {type === 'section' ? 'Section RVPS' : 'Cumulative RVPS'}
                    </th>
                    <th className="p-3 text-right font-medium">
                      {type === 'section' ? 'Section Value' : 'Cumulative Value'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rvpsData.map((data, idx) => (
                    <tr key={idx} className="border-t text-sm">
                      <td className="p-3 font-medium">{data.securityName}</td>
                      <td className="p-3 text-right font-mono">{formatNumber(data.shares)}</td>
                      <td className="p-3 text-right">{data.percentage}</td>
                      <td className="p-3 text-right font-mono">
                        {formatRVPS(type === 'section' ? data.sectionRVPS : data.cumulativeRVPS)}
                      </td>
                      <td className="p-3 text-right font-mono">
                        {formatCurrency(
                          type === 'section' ? data.sectionValue : data.cumulativeValue
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/30 border-t">
                  <tr className="text-sm font-medium">
                    <td className="p-3">Total</td>
                    <td className="p-3 text-right font-mono">
                      {formatNumber(rvpsData.reduce((sum, d) => sum + d.shares, 0))}
                    </td>
                    <td className="p-3 text-right">100.00%</td>
                    <td className="p-3 text-right">-</td>
                    <td className="p-3 text-right font-mono">
                      {formatCurrency(
                        rvpsData.reduce(
                          (sum, d) =>
                            sum + (type === 'section' ? d.sectionValue : d.cumulativeValue),
                          0
                        )
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="space-y-1 text-xs text-muted-foreground">
              <p>
                <strong>Section RVPS:</strong> Residual Value Per Share attributed to this specific
                exit value range
              </p>
              <p>
                <strong>Cumulative RVPS:</strong> Total Residual Value Per Share accumulated across
                all ranges up to this exit value
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Define columns for DataTable
  const breakpointColumns: ColumnDef<(typeof waterfallRanges)[0]>[] = [
    {
      id: 'rangeId',
      header: 'Range',
      accessorFn: (_, index) => index + 1,
      cell: ({ getValue }) => (
        <span className="font-medium text-muted-foreground">#{getValue() as number}</span>
      ),
    },
    {
      id: 'fromValue',
      header: 'From ($)',
      accessorKey: 'rangeStart',
      cell: ({ getValue }) => (
        <span className="font-mono text-foreground">{formatCurrency(getValue() as number)}</span>
      ),
    },
    {
      id: 'toValue',
      header: 'To ($)',
      accessorFn: (range) => (range.isLastRange ? '∞' : formatCurrency(range.rangeEnd || 0)),
      cell: ({ getValue }) => (
        <span className="font-mono text-foreground">{getValue() as string}</span>
      ),
    },
    {
      id: 'eventType',
      header: 'Range Event',
      accessorKey: 'breakpointType',
      cell: ({ row }) => {
        const range = row.original
        const config = getBreakpointTypeConfig(range.breakpointType)
        const IconComponent = config.icon

        return (
          <div className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${config.bgColor}`}
            >
              <IconComponent className={`h-4 w-4 ${config.color}`} />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-foreground">
                {range.breakpointType
                  ? range.breakpointType.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())
                  : 'Unknown Type'}
              </span>
              <span
                className="max-w-48 truncate text-xs text-muted-foreground"
                title={range.explanation || ''}
              >
                {range.explanation || ''}
              </span>
            </div>
          </div>
        )
      },
    },
    {
      id: 'participatingSecurities',
      header: 'Participating Securities',
      accessorKey: 'participatingShares',
      cell: ({ row }) => {
        const range = row.original
        const participatingShares = range.participatingShares || []

        return (
          <div className="space-y-1">
            {participatingShares.map((participant, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
                <span className="text-foreground">{participant.name}</span>
                <span className="text-muted-foreground">({participant.percentage})</span>
              </div>
            ))}
          </div>
        )
      },
    },
    {
      id: 'shares',
      header: 'Total Participating Shares',
      accessorKey: 'totalParticipatingShares',
      cell: ({ getValue }) => (
        <span className="font-mono text-foreground">{formatNumber(getValue() as number)}</span>
      ),
    },
    {
      id: 'sectionRVPS',
      header: 'Section RVPS',
      cell: ({ row }) => {
        const range = row.original
        const rangeIndex = waterfallRanges.findIndex((r) => r === range)
        return <RVPSModal range={range} type="section" rangeIndex={rangeIndex} />
      },
    },
    {
      id: 'cumulativeRVPS',
      header: 'Cumulative RVPS',
      cell: ({ row }) => {
        const range = row.original
        const rangeIndex = waterfallRanges.findIndex((r) => r === range)
        return <RVPSModal range={range} type="cumulative" rangeIndex={rangeIndex} />
      },
    },
  ]

  return (
    <TooltipProvider>
      <Card className="border-primary/20 bg-card">
        <CardHeader className="border-primary/20 bg-primary/5 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-primary" />
              <div>
                <CardTitle className="text-xl font-semibold text-foreground">
                  Breakpoints Analysis
                </CardTitle>
              </div>
            </div>
            <Button onClick={runBreakpointAnalysis} disabled={loading} variant="outline" size="sm">
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              {loading ? 'Refreshing...' : 'Refresh Analysis'}
            </Button>
          </div>

          {/* Analysis Metadata */}
          {analysisData && (
            <div className="border-primary/10 mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
              {/* Cache Status Badge */}
              {analysisData.from_cache !== undefined && (
                <Badge
                  variant={analysisData.from_cache ? 'secondary' : 'default'}
                  className="flex items-center gap-1"
                >
                  {analysisData.from_cache ? (
                    <>
                      <Database className="h-3 w-3" />
                      Loaded from Cache
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3" />
                      Freshly Calculated
                    </>
                  )}
                </Badge>
              )}

              {/* Timestamp */}
              {analysisData.analysis_timestamp && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(analysisData.analysis_timestamp).toLocaleString()}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Analysis last run at this time</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Performance Metrics */}
              {analysisData.performanceMetrics && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      {analysisData.performanceMetrics.analysisTimeMs}ms
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1 text-xs">
                      <p>
                        <strong>Analysis Time:</strong>{' '}
                        {analysisData.performanceMetrics.analysisTimeMs}
                        ms
                      </p>
                      {analysisData.performanceMetrics.cacheHits > 0 && (
                        <p>
                          <strong>Cache Hits:</strong> {analysisData.performanceMetrics.cacheHits}
                        </p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Breakpoint Count */}
              <Badge variant="outline">
                {analysisData.totalBreakpoints} breakpoint
                {analysisData.totalBreakpoints !== 1 ? 's' : ''}
              </Badge>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {analysisComplete && analysisData ? (
            <OptimizedDataTable
              key="waterfall-ranges-table"
              tableId="waterfall-ranges-table"
              columns={breakpointColumns as any}
              data={waterfallRanges}
              enableColumnReordering={true}
              enableColumnVisibility={true}
              enableSorting={true}
              enablePagination={false}
              enableColumnFilters={true}
              enableColumnPinning={true}
              searchPlaceholder="Search waterfall ranges..."
              className="border-0"
            />
          ) : (
            <div className="p-8 text-center">
              <div className="flex flex-col items-center gap-4">
                {loading ? (
                  <>
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <div className="space-y-2">
                      <p className="text-lg font-medium text-foreground">Running Analysis...</p>
                      <p className="text-muted-foreground">
                        Calculating breakpoints and RVPS values
                      </p>
                    </div>
                  </>
                ) : error ? (
                  <>
                    <AlertTriangle className="h-12 w-12 text-destructive" />
                    <div className="space-y-2">
                      <p className="text-lg font-medium text-destructive">Analysis Error</p>
                      <p className="text-muted-foreground">{error}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <Calculator className="h-12 w-12 text-muted-foreground" />
                    <div className="space-y-2">
                      <p className="text-lg font-medium text-foreground">Ready to Analyze</p>
                      <p className="text-muted-foreground">
                        Click "Refresh Analysis" to calculate breakpoints
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
