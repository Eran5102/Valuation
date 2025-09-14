import React, { useState } from 'react';
import { BarChart3, Calculator, TrendingUp, Target, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CapTableConfig } from '@/types';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface BreakpointsAnalysisProps {
  valuationId: string;
  companyId?: string;
  capTableConfig: CapTableConfig;
}

export default function BreakpointsAnalysis({ valuationId, companyId, capTableConfig }: BreakpointsAnalysisProps) {
  const [analysisComplete, setAnalysisComplete] = useState(false);

  const mockBreakpoints = [
    {
      id: 1,
      name: "Series A Liquidation Preference",
      type: "Liquidation Preference",
      from: 0,
      to: 3000000,
      participatingSecurities: ["Series A Preferred"],
      shares: 300000,
      sectionRVPS: 10.00,
      cumulativeRVPS: 10.00
    },
    {
      id: 2,
      name: "Series B Liquidation Preference", 
      type: "Liquidation Preference",
      from: 3000000,
      to: 5000000,
      participatingSecurities: ["Series B Preferred"],
      shares: 128571,
      sectionRVPS: 15.56,
      cumulativeRVPS: 12.50
    },
    {
      id: 3,
      name: "Pro Rata Distribution",
      type: "Pro Rata",
      from: 5000000,
      to: 10000000,
      participatingSecurities: ["Common Stock", "Series A Preferred", "Series B Preferred"],
      shares: 1428571,
      sectionRVPS: 3.50,
      cumulativeRVPS: 7.00
    },
    {
      id: 4,
      name: "Series A Participation Cap",
      type: "Cap Reached",
      from: 10000000,
      to: 15000000,
      participatingSecurities: ["Common Stock", "Series B Preferred"],
      shares: 1128571,
      sectionRVPS: 4.43,
      cumulativeRVPS: 9.06
    }
  ];


  const runBreakpointAnalysis = () => {
    setAnalysisComplete(true);
    console.log('Running breakpoint analysis with cap table config:', capTableConfig);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Breakpoints Analysis</h2>
          <p className="text-muted-foreground">Analyzing participation thresholds and value breakpoints</p>
        </div>
        <Button onClick={runBreakpointAnalysis}>
          <Calculator className="h-4 w-4 mr-2" />
          Run Analysis
        </Button>
      </div>

      {/* Analysis Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            {analysisComplete ? (
              <>
                <div className="p-2 bg-green-100 rounded-full">
                  <Target className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-700">Analysis Complete</p>
                  <p className="text-sm text-muted-foreground">Found {mockBreakpoints.length} breakpoints</p>
                </div>
              </>
            ) : (
              <>
                <div className="p-2 bg-yellow-100 rounded-full">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium text-yellow-700">Analysis Pending</p>
                  <p className="text-sm text-muted-foreground">Click "Run Analysis" to calculate breakpoints</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cap Table Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Cap Table Summary</CardTitle>
          <CardDescription>Current capitalization structure for analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {capTableConfig.shareClasses?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Share Classes</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatNumber(capTableConfig.shareClasses?.reduce((sum, sc) => sum + (sc.shares || 0), 0) || 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Shares</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {formatNumber(capTableConfig.options?.reduce((sum, opt) => sum + opt.numOptions, 0) || 0)}
              </div>
              <div className="text-sm text-muted-foreground">Options Outstanding</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Breakpoints Table */}
      {analysisComplete && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Breakpoint Analysis Results
            </CardTitle>
            <CardDescription>Value ranges and participating securities at each breakpoint</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Breakpoint</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">From</TableHead>
                  <TableHead className="text-right">To</TableHead>
                  <TableHead>Participating Securities</TableHead>
                  <TableHead className="text-right">Total Shares</TableHead>
                  <TableHead className="text-right">Section RVPS</TableHead>
                  <TableHead className="text-right">Cumulative RVPS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockBreakpoints.map((breakpoint) => (
                  <TableRow key={breakpoint.id}>
                    <TableCell className="font-medium">{breakpoint.name}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        breakpoint.type === 'Liquidation Preference' ? 'bg-red-100 text-red-700' :
                        breakpoint.type === 'Pro Rata' ? 'bg-blue-100 text-blue-700' :
                        breakpoint.type === 'Cap Reached' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {breakpoint.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(breakpoint.from)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(breakpoint.to)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {breakpoint.participatingSecurities.map((security, index) => (
                          <span key={index} className="px-2 py-1 text-xs bg-muted rounded">
                            {security}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(breakpoint.shares)}</TableCell>
                    <TableCell className="text-right">${breakpoint.sectionRVPS.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">${breakpoint.cumulativeRVPS.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Analysis Insights */}
      {analysisComplete && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                <h4 className="font-medium text-blue-900">Liquidation Preferences</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Series A and B preferred shares have liquidation preferences totaling $5M that must be satisfied before common stockholders receive distributions.
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                <h4 className="font-medium text-green-900">Pro Rata Participation</h4>
                <p className="text-sm text-green-700 mt-1">
                  Above $5M in company value, all securities participate pro rata in distributions, benefiting common stockholders.
                </p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                <h4 className="font-medium text-yellow-900">Participation Caps</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Series A participation cap is reached at $10M company value, after which they no longer participate in upside.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!analysisComplete && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Configure your cap table and run the analysis to see detailed breakpoint calculations and insights.
          </p>
        </div>
      )}
    </div>
  );
}