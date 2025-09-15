import React, { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { BarChart3, Calculator, AlertTriangle, Loader2, RefreshCw, Activity, Layers, Target, Zap, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
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

  // Define columns for DataTable
  const breakpointColumns: ColumnDef<Breakpoint>[] = [
    {
      id: 'id',
      header: 'ID',
      accessorFn: (_, index) => index + 1,
      cell: ({ getValue }) => (
        <span className="font-medium text-muted-foreground">{getValue() as number}</span>
      ),
    },
    {
      id: 'breakpointType',
      header: 'Breakpoint',
      accessorKey: 'breakpointType',
      cell: ({ row }) => {
        const breakpoint = row.original;
        const config = getBreakpointTypeConfig(breakpoint.breakpointType);
        const IconComponent = config.icon;
        
        return (
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${config.bgColor}`}>
              <IconComponent className={`h-4 w-4 ${config.color}`} />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-foreground">
                {breakpoint.breakpointType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
              <span className="text-xs text-muted-foreground truncate max-w-48" title={breakpoint.explanation}>
                {breakpoint.explanation}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      id: 'type',
      header: 'Type',
      accessorKey: 'breakpointType',
      cell: ({ row }) => {
        const config = getBreakpointTypeConfig(row.original.breakpointType);
        return (
          <Badge variant="outline" className={`${config.borderColor} ${config.bgColor} ${config.color}`}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      id: 'fromValue',
      header: 'From ($)',
      accessorFn: (breakpoint, index, data) => {
        return index === 0 ? 0 : (data && data[index - 1]?.exitValue) || 0;
      },
      cell: ({ getValue }) => (
        <span className="font-mono text-foreground">{formatCurrency(getValue() as number)}</span>
      ),
    },
    {
      id: 'exitValue',
      header: 'To ($)',
      accessorKey: 'exitValue',
      cell: ({ getValue }) => (
        <span className="font-mono text-foreground">{formatCurrency(getValue() as number)}</span>
      ),
    },
    {
      id: 'participatingSecurities',
      header: 'Participating Securities',
      accessorKey: 'affectedSecurities',
      cell: ({ getValue }) => {
        const securities = getValue() as string[];
        const mockPercentages: { [key: string]: string } = {
          'Series A': '100.00%',
          'Series B': '100.00%', 
          'Founders': '63.16%',
          'Options @ $1.25': '13.64%',
          'Options @ $1.36': '24.14%'
        };
        
        return (
          <div className="space-y-1">
            {securities.map((security, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-foreground">{security}</span>
                <span className="text-muted-foreground">
                  ({mockPercentages[security] || '0.00%'})
                </span>
              </div>
            ))}
          </div>
        );
      },
    },
    {
      id: 'shares',
      header: 'Shares',
      accessorFn: (_, index) => 200000 + (index * 150000), // Mock data
      cell: ({ getValue }) => (
        <span className="font-mono text-foreground">{formatNumber(getValue() as number)}</span>
      ),
    },
    {
      id: 'sectionRVPS',
      header: 'Section RVPS',
      cell: () => (
        <Button variant="link" size="sm" className="text-primary hover:text-primary/80 p-0">
          View Details
        </Button>
      ),
    },
    {
      id: 'cumulativeRVPS',
      header: 'Cumulative RVPS',
      cell: () => (
        <Button variant="link" size="sm" className="text-primary hover:text-primary/80 p-0">
          View Details
        </Button>
      ),
    },
  ];

  return (
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
            key="breakpoints-table"
            tableId="breakpoints-table"
            columns={breakpointColumns}
            data={analysisData.sortedBreakpoints || []}
            enableColumnReordering={true}
            enableColumnVisibility={true}
            enableSorting={true}
            enablePagination={false}
            enableColumnFilters={true}
            enableColumnPinning={true}
            searchPlaceholder="Search breakpoints..."
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
  );
}