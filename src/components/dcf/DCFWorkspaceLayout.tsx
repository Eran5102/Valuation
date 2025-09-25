'use client'

import React, { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Calculator,
  TrendingUp,
  CreditCard,
  DollarSign,
  LineChart,
  BarChart3,
  Settings,
  Percent,
  Clock,
  GitBranch,
  Shield,
  Users,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDCFModel } from '@/contexts/DCFModelContext'

interface DCFSection {
  id: string
  name: string
  icon: React.ElementType
  href: string
  description: string
  isComplete?: boolean
  hasData?: boolean
}

interface DCFWorkspaceLayoutProps {
  children: React.ReactNode
  valuationId: string
}

export function DCFWorkspaceLayout({ children, valuationId }: DCFWorkspaceLayoutProps) {
  const pathname = usePathname()
  const [activeSection, setActiveSection] = useState<string | null>(null)

  // Get DCF model data for completion status
  const {
    modelData,
    isLoading,
    assumptions,
    workingCapital,
    debtSchedule,
    capexDepreciation,
    wacc,
    financialStatements,
    dcfValuation,
  } = useDCFModel()

  // Define DCF sections
  const sections: DCFSection[] = [
    {
      id: 'overview',
      name: 'Overview',
      icon: LineChart,
      href: `/valuations/${valuationId}/enterprise/dcf-analysis`,
      description: 'DCF model summary and final results',
      isComplete: !!dcfValuation,
      hasData: !!dcfValuation,
    },
    {
      id: 'assumptions',
      name: 'DCF Assumptions',
      icon: Settings,
      href: `/valuations/${valuationId}/enterprise/dcf-analysis/assumptions`,
      description: 'Core DCF parameters and configuration',
      isComplete: !!assumptions,
      hasData: !!assumptions,
    },
    {
      id: 'history',
      name: 'Historical Data',
      icon: Clock,
      href: `/valuations/${valuationId}/enterprise/dcf-analysis/history`,
      description: 'Historical financial statements',
      isComplete: !!financialStatements && financialStatements.length > 0,
      hasData: !!financialStatements && financialStatements.length > 0,
    },
    {
      id: 'projections',
      name: 'Financial Projections',
      icon: TrendingUp,
      href: `/valuations/${valuationId}/enterprise/dcf-analysis/projections`,
      description: 'Projected income statement and cash flows',
      isComplete: !!financialStatements && financialStatements.some((fs) => !fs.isHistorical),
      hasData: !!financialStatements && financialStatements.some((fs) => !fs.isHistorical),
    },
    {
      id: 'wacc',
      name: 'WACC Analysis',
      icon: Percent,
      href: `/valuations/${valuationId}/enterprise/dcf-analysis/wacc`,
      description: 'Weighted average cost of capital',
      isComplete: !!wacc && wacc.calculatedWACC > 0,
      hasData: !!wacc,
    },
    {
      id: 'working-capital',
      name: 'Working Capital',
      icon: DollarSign,
      href: `/valuations/${valuationId}/enterprise/dcf-analysis/working-capital`,
      description: 'Working capital analysis and projections',
      isComplete: !!workingCapital && workingCapital.projected.length > 0,
      hasData: !!workingCapital,
    },
    {
      id: 'capex',
      name: 'CapEx & Depreciation',
      icon: Settings,
      href: `/valuations/${valuationId}/enterprise/dcf-analysis/capex`,
      description: 'Capital expenditures and depreciation schedule',
      isComplete: !!capexDepreciation && capexDepreciation.projections.length > 0,
      hasData: !!capexDepreciation,
    },
    {
      id: 'debt',
      name: 'Debt Schedule',
      icon: CreditCard,
      href: `/valuations/${valuationId}/enterprise/dcf-analysis/debt`,
      description: 'Debt instruments and repayment schedule',
      isComplete: !!debtSchedule && debtSchedule.items.length > 0,
      hasData: !!debtSchedule,
    },
    {
      id: 'scenarios',
      name: 'Scenarios',
      icon: GitBranch,
      href: `/valuations/${valuationId}/enterprise/dcf-analysis/scenarios`,
      description: 'Scenario and sensitivity analysis',
      isComplete: false,
      hasData: false,
    },
    {
      id: 'qualitative',
      name: 'Qualitative Factors',
      icon: Shield,
      href: `/valuations/${valuationId}/enterprise/dcf-analysis/qualitative`,
      description: 'Qualitative adjustments and risk factors',
      isComplete: false,
      hasData: false,
    },
  ]

  // Get current section based on pathname
  const getCurrentSection = () => {
    if (pathname.includes('/assumptions')) return 'assumptions'
    if (pathname.includes('/history')) return 'history'
    if (pathname.includes('/projections')) return 'projections'
    if (pathname.includes('/wacc')) return 'wacc'
    if (pathname.includes('/working-capital')) return 'working-capital'
    if (pathname.includes('/capex')) return 'capex'
    if (pathname.includes('/debt')) return 'debt'
    if (pathname.includes('/scenarios')) return 'scenarios'
    if (pathname.includes('/qualitative')) return 'qualitative'
    return 'overview'
  }

  const currentSection = getCurrentSection()

  // Calculate completion stats
  const getCompletionStats = () => {
    const completedSections = sections.filter((s) => s.isComplete).length
    const totalSections = sections.length
    const completionPercentage = (completedSections / totalSections) * 100
    const sectionsWithData = sections.filter((s) => s.hasData).length

    return {
      completedSections,
      totalSections,
      completionPercentage,
      sectionsWithData,
    }
  }

  const stats = getCompletionStats()

  // Navigate to section (for client-side navigation)
  const navigateToSection = useCallback((sectionId: string, href: string) => {
    setActiveSection(sectionId)
    // The actual navigation will be handled by Next.js Link
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading DCF model...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full gap-6">
      {/* Main Content */}
      <div className="flex-1 overflow-auto">{children}</div>

      {/* Right Sidebar */}
      <div className="w-80 space-y-4">
        {/* DCF Model Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">DCF Model Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span className="font-medium">{Math.round(stats.completionPercentage)}%</span>
              </div>
              <Progress value={stats.completionPercentage} className="mt-2" />
            </div>
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Sections</span>
                <span className="font-medium">{stats.totalSections}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completed</span>
                <span className="font-medium text-green-600">{stats.completedSections}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">With Data</span>
                <span className="font-medium text-blue-600">{stats.sectionsWithData}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* DCF Navigation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">DCF Sections</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon
                  const isActive = currentSection === section.id

                  return (
                    <Link key={section.id} href={section.href} className="contents">
                      <button
                        onClick={() => navigateToSection(section.id, section.href)}
                        className={cn(
                          'flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-muted',
                          isActive && 'border border-primary/20 bg-muted'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Icon
                            className={cn(
                              'h-4 w-4',
                              isActive ? 'text-primary' : 'text-muted-foreground'
                            )}
                          />
                          <div className="text-left">
                            <div className={cn('font-medium', isActive && 'text-primary')}>
                              {section.name}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {section.description}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {section.isComplete ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : section.hasData ? (
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                          ) : (
                            <div className="h-4 w-4" />
                          )}
                        </div>
                      </button>
                    </Link>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Model Summary */}
        {dcfValuation && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Valuation Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Enterprise Value</span>
                <span className="font-medium">
                  ${(dcfValuation.enterpriseValue / 1000000).toFixed(1)}M
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Equity Value</span>
                <span className="font-medium">
                  ${(dcfValuation.equityValue / 1000000).toFixed(1)}M
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Value per Share</span>
                <span className="font-medium">
                  ${dcfValuation.valuePerShare?.toFixed(2) || 'N/A'}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
