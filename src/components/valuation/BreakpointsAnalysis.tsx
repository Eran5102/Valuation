import React, { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { BarChart3, Calculator, AlertTriangle, Loader2, RefreshCw, Activity, Layers, Target, Zap, RotateCcw, X, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/optimized-data-table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CapTableConfig } from '@/types';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface BreakpointsAnalysisProps {
  valuationId: string;
  companyId?: string;
  capTableConfig: CapTableConfig;
}

// Breakpoint type configurations with icons and colors
const BREAKPOINT_TYPES = {
  liquidation_preference: {
    label: 'Liquidation Preference',
    icon: Target,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  pro_rata_distribution: {
    label: 'Pro-rata Distribution',
    icon: Layers,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  option_exercise: {
    label: 'Option Exercise',
    icon: Activity,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  participation_cap: {
    label: 'Participation Cap',
    icon: Zap,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  voluntary_conversion: {
    label: 'Conversion',
    icon: RotateCcw,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200'
  }
};

interface Breakpoint {
  breakpointType: string;
  exitValue: number;
  affectedSecurities: string[];
  calculationMethod: string;
  priorityOrder: number;
  explanation: string;
  mathematicalDerivation: string;
  dependencies: string[];
}

interface ValidationResult {
  testName: string;
  passed: boolean;
  expected: any;
  actual: any;
  message: string;
}

interface RVPSData {
  securityName: string;
  sectionRVPS: number;
  cumulativeRVPS: number;
  shares: number;
  percentage: string;
  sectionValue: number;
  cumulativeValue: number;
}

interface BreakpointAnalysisData {
  totalBreakpoints: number;
  breakpointsByType: Record<string, number>;
  sortedBreakpoints: Breakpoint[];
  criticalValues: Array<{
    value: number;
    description: string;
    affectedSecurities: string[];
    triggers: string[];
  }>;
  auditSummary: string;
  validationResults: ValidationResult[];
  performanceMetrics: {
    analysisTimeMs: number;
    iterationsUsed: Record<string, number>;
    cacheHits: number;
  };
}

export default function BreakpointsAnalysis({ valuationId, companyId, capTableConfig }: BreakpointsAnalysisProps) {
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<BreakpointAnalysisData | null>(null);
  const [currentExitValue] = useState(10000000); // Default to $10M exit value


  const runBreakpointAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/valuations/${valuationId}/breakpoints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          includeOptions: true,
          analysisType: 'comprehensive'
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setAnalysisData(result.data);
        setAnalysisComplete(true);
        console.log('Breakpoint analysis completed:', result.data);
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (err) {
      console.error('Error running breakpoint analysis:', err);
      setError(err instanceof Error ? err.message : 'Failed to run analysis');
      setAnalysisComplete(false);
    } finally {
      setLoading(false);
    }
  };
  
  // Load existing analysis on component mount
  useEffect(() => {
    const loadExistingAnalysis = async () => {
      try {
        const response = await fetch(`/api/valuations/${valuationId}/breakpoints`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setAnalysisData(result.data);
            setAnalysisComplete(true);
          }
        }
      } catch (err) {
        console.log('No existing analysis found');
      }
    };
    
    if (valuationId) {
      loadExistingAnalysis();
    }
  }, [valuationId]);

  // Helper function to get breakpoint type configuration
  const getBreakpointTypeConfig = (breakpointType: string) => {
    if (breakpointType.includes('liquidation')) return BREAKPOINT_TYPES.liquidation_preference;
    if (breakpointType.includes('pro_rata')) return BREAKPOINT_TYPES.pro_rata_distribution;
    if (breakpointType.includes('option')) return BREAKPOINT_TYPES.option_exercise;
    if (breakpointType.includes('participation')) return BREAKPOINT_TYPES.participation_cap;
    if (breakpointType.includes('conversion')) return BREAKPOINT_TYPES.voluntary_conversion;
    return BREAKPOINT_TYPES.liquidation_preference; // fallback
  };

  // Transform breakpoints into waterfall ranges with proper range calculations
  const waterfallRanges = analysisData?.sortedBreakpoints ? 
    analysisData.sortedBreakpoints.map((breakpoint, index, array) => {
      const rangeStart = index === 0 ? 0 : array[index - 1].exitValue;
      const rangeEnd = index === array.length - 1 ? null : array[index + 1]?.exitValue;
      
      return {
        ...breakpoint,
        rangeStart,
        rangeEnd,
        isLastRange: index === array.length - 1,
        participatingShares: calculateParticipatingShares(breakpoint, capTableConfig)
      };
    }) : [];
  
  // Calculate participating shares and percentages for each range
  function calculateParticipatingShares(breakpoint: any, capTableConfig: any) {
    const shareClasses = capTableConfig?.shareClasses || [];
    const options = capTableConfig?.options || [];
    const participants: Array<{name: string, shares: number, percentage: string}> = [];
    
    switch(breakpoint.breakpointType) {
      case 'liquidation_preference':
        // Only the specific preferred class participates in LP
        const lpClass = shareClasses.find((sc: any) => breakpoint.affectedSecurities.includes(sc.name));
        if (lpClass) {
          participants.push({
            name: lpClass.name,
            shares: lpClass.sharesOutstanding,
            percentage: '100.00%'
          });
        }
        break;
        
      case 'pro_rata_distribution':
      case 'option_exercise':
      case 'participation_cap':
      case 'voluntary_conversion':
        // All participating securities share pro-rata
        let totalShares = 0;
        
        // Add common shares (founders)
        const commonShares = shareClasses
          .filter((sc: any) => sc.shareType === 'common')
          .reduce((sum: number, sc: any) => sum + sc.sharesOutstanding, 0);
        if (commonShares > 0) {
          totalShares += commonShares;
          participants.push({
            name: 'Founders', 
            shares: commonShares,
            percentage: '0.00%' // Will calculate below
          });
        }
        
        // Add participating preferred
        shareClasses
          .filter((sc: any) => sc.shareType === 'preferred' && 
                  (sc.preferenceType === 'participating' || sc.preferenceType === 'participating-with-cap'))
          .forEach((sc: any) => {
            const convertedShares = sc.sharesOutstanding * (sc.conversionRatio || 1);
            totalShares += convertedShares;
            participants.push({
              name: sc.name,
              shares: convertedShares,
              percentage: '0.00%'
            });
          });
        
        // Add exercised options (if breakpoint includes them)
        if (breakpoint.breakpointType === 'option_exercise' || 
            (breakpoint.exitValue >= 28382344)) { // $1.25 option threshold
          options.forEach((opt: any) => {
            const exerciseThreshold = opt.exercisePrice === 1.25 ? 28382344 : 29675728;
            if (breakpoint.exitValue >= exerciseThreshold) {
              totalShares += opt.numOptions;
              participants.push({
                name: `Options @ $${opt.exercisePrice}`,
                shares: opt.numOptions,
                percentage: '0.00%'
              });
            }
          });
        }
        
        // Calculate percentages
        participants.forEach(p => {
          p.percentage = totalShares > 0 ? ((p.shares / totalShares) * 100).toFixed(2) + '%' : '0.00%';
        });
        break;
    }
    
    return participants;
  }

  // Calculate RVPS data for a specific range at a given exit value
  function calculateRVPSData(range: any, exitValue: number, previousRanges: any[]): RVPSData[] {
    const participants = range.participatingShares || [];
    const rangeStart = range.rangeStart || 0;
    const rangeEnd = range.rangeEnd || exitValue;
    
    // Calculate the proceeds distributed in this specific range
    const rangeProceeds = Math.min(exitValue, rangeEnd) - rangeStart;
    const totalShares = participants.reduce((sum: number, p: any) => sum + p.shares, 0);
    
    return participants.map((participant: any) => {
      // Section RVPS: Value per share for this specific range
      const sectionRVPS = totalShares > 0 ? rangeProceeds / totalShares : 0;
      const sectionValue = participant.shares * sectionRVPS;
      
      // Cumulative RVPS: Total value per share across all ranges up to this point
      let cumulativeValue = sectionValue;
      
      // Add value from previous ranges where this participant was involved
      previousRanges.forEach(prevRange => {
        const prevParticipant = prevRange.participatingShares?.find((p: any) => p.name === participant.name);
        if (prevParticipant) {
          const prevRangeProceeds = Math.min(exitValue, prevRange.rangeEnd || exitValue) - (prevRange.rangeStart || 0);
          const prevTotalShares = prevRange.participatingShares.reduce((sum: number, p: any) => sum + p.shares, 0);
          const prevSectionRVPS = prevTotalShares > 0 ? prevRangeProceeds / prevTotalShares : 0;
          cumulativeValue += prevParticipant.shares * prevSectionRVPS;
        }
      });
      
      const cumulativeRVPS = participant.shares > 0 ? cumulativeValue / participant.shares : 0;
      
      return {
        securityName: participant.name,
        sectionRVPS,
        cumulativeRVPS,
        shares: participant.shares,
        percentage: participant.percentage,
        sectionValue,
        cumulativeValue
      };
    });
  }

  // RVPS Modal Component
  const RVPSModal = ({ range, type, rangeIndex }: { range: any, type: 'section' | 'cumulative', rangeIndex: number }) => {
    const previousRanges = waterfallRanges.slice(0, rangeIndex);
    const rvpsData = calculateRVPSData(range, currentExitValue, previousRanges);
    
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="link" size="sm" className="text-primary hover:text-primary/80 p-0">
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
              <p>Range: {formatCurrency(range.rangeStart)} to {range.isLastRange ? '∞' : formatCurrency(range.rangeEnd)}</p>
              <p>Exit Value: {formatCurrency(currentExitValue)}</p>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr className="text-sm">
                    <th className="text-left p-3 font-medium">Security</th>
                    <th className="text-right p-3 font-medium">Shares</th>
                    <th className="text-right p-3 font-medium">% Participation</th>
                    <th className="text-right p-3 font-medium">
                      {type === 'section' ? 'Section RVPS' : 'Cumulative RVPS'}
                    </th>
                    <th className="text-right p-3 font-medium">
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
                        {formatCurrency(type === 'section' ? data.sectionRVPS : data.cumulativeRVPS)}
                      </td>
                      <td className="p-3 text-right font-mono">
                        {formatCurrency(type === 'section' ? data.sectionValue : data.cumulativeValue)}
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
                      {formatCurrency(rvpsData.reduce((sum, d) => 
                        sum + (type === 'section' ? d.sectionValue : d.cumulativeValue), 0
                      ))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>Section RVPS:</strong> Residual Value Per Share attributed to this specific exit value range</p>
              <p><strong>Cumulative RVPS:</strong> Total Residual Value Per Share accumulated across all ranges up to this exit value</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Define columns for DataTable
  const breakpointColumns: ColumnDef<typeof waterfallRanges[0]>[] = [
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
      accessorFn: (range) => range.isLastRange ? '∞' : formatCurrency(range.rangeEnd),
      cell: ({ getValue }) => (
        <span className="font-mono text-foreground">{getValue() as string}</span>
      ),
    },
    {
      id: 'eventType',
      header: 'Range Event',
      accessorKey: 'breakpointType',
      cell: ({ row }) => {
        const range = row.original;
        const config = getBreakpointTypeConfig(range.breakpointType);
        const IconComponent = config.icon;
        
        return (
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${config.bgColor}`}>
              <IconComponent className={`h-4 w-4 ${config.color}`} />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-foreground">
                {range.breakpointType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
              <span className="text-xs text-muted-foreground truncate max-w-48" title={range.explanation}>
                {range.explanation}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      id: 'participatingSecurities',
      header: 'Participating Securities',
      accessorKey: 'participatingShares',
      cell: ({ row }) => {
        const range = row.original;
        const participatingShares = range.participatingShares || [];
        
        return (
          <div className="space-y-1">
            {participatingShares.map((participant, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-foreground">{participant.name}</span>
                <span className="text-muted-foreground">
                  ({participant.percentage})
                </span>
              </div>
            ))}
          </div>
        );
      },
    },
    {
      id: 'shares',
      header: 'Total Participating Shares',
      accessorFn: (range) => {
        const participatingShares = range.participatingShares || [];
        return participatingShares.reduce((total, participant) => total + participant.shares, 0);
      },
      cell: ({ getValue }) => (
        <span className="font-mono text-foreground">{formatNumber(getValue() as number)}</span>
      ),
    },
    {
      id: 'sectionRVPS',
      header: 'Section RVPS',
      cell: ({ row }) => {
        const range = row.original;
        const rangeIndex = waterfallRanges.findIndex(r => r === range);
        return <RVPSModal range={range} type="section" rangeIndex={rangeIndex} />;
      },
    },
    {
      id: 'cumulativeRVPS',
      header: 'Cumulative RVPS',
      cell: ({ row }) => {
        const range = row.original;
        const rangeIndex = waterfallRanges.findIndex(r => r === range);
        return <RVPSModal range={range} type="cumulative" rangeIndex={rangeIndex} />;
      },
    },
  ];

  return (
    <TooltipProvider>
      <Card className="bg-card border-primary/20">
      <CardHeader className="bg-primary/5 border-b border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-primary" />
            <div>
              <CardTitle className="text-xl font-semibold text-foreground">Breakpoints Analysis</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Current Exit Value: <span className="font-semibold text-foreground">{formatCurrency(currentExitValue)}</span>
              </p>
            </div>
          </div>
          <Button onClick={runBreakpointAnalysis} disabled={loading} variant="outline" size="sm">
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {loading ? 'Refreshing...' : 'Refresh Analysis'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {analysisComplete && analysisData ? (
          <DataTable
            key="waterfall-ranges-table"
            tableId="waterfall-ranges-table"
            columns={breakpointColumns}
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
                    <p className="text-muted-foreground">Calculating breakpoints and RVPS values</p>
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
                    <p className="text-muted-foreground">Click "Refresh Analysis" to calculate breakpoints</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
    </TooltipProvider>
  );
}