'use client'

import { useValuationWorkspace } from '@/contexts/ValuationWorkspaceContext'
import { useMethodologyStore } from '@/hooks/useMethodologyStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  FileText,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Settings,
  Calculator,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'

export default function ValuationOverviewPage() {
  const { valuation, loading } = useValuationWorkspace()
  const { methodologies } = useMethodologyStore()

  if (loading || !valuation) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">Loading valuation overview...</p>
      </div>
    )
  }

  // Calculate progress based on completed sections
  const calculateProgress = () => {
    let completedSteps = 0
    const totalSteps = 5 // Company, Methodologies, Assumptions, Cap Table, Report

    // Check which sections are completed
    if (valuation.assumptions && Object.keys(valuation.assumptions).length > 0) completedSteps++

    // Check if any enterprise or allocation methodologies are enabled
    const hasEnterpriseMethod = methodologies.some(
      (m) => ['income', 'market', 'asset'].includes(m.category) && m.enabled
    )
    const hasAllocationMethod = methodologies.some((m) => m.category === 'allocation' && m.enabled)
    if (hasEnterpriseMethod) completedSteps++
    if (hasAllocationMethod) completedSteps++

    if (valuation.fair_market_value) completedSteps += 2 // Assume calculation steps are done

    return Math.round((completedSteps / totalSteps) * 100)
  }

  const progress = calculateProgress()

  const getNextStep = () => {
    if (!valuation.assumptions || Object.keys(valuation.assumptions).length === 0) {
      return { name: 'Set up assumptions and methodologies', href: 'assumptions', icon: Settings }
    }

    const hasEnterpriseMethod = methodologies.some(
      (m) => ['income', 'market', 'asset'].includes(m.category) && m.enabled
    )
    const hasAllocationMethod = methodologies.some((m) => m.category === 'allocation' && m.enabled)

    if (!hasEnterpriseMethod || !hasAllocationMethod) {
      return { name: 'Select valuation methodologies', href: 'assumptions', icon: TrendingUp }
    }

    if (!valuation.fair_market_value) {
      return { name: 'Calculate fair market value', href: 'calculate', icon: Calculator }
    }
    return { name: 'Generate report', href: 'report', icon: FileText }
  }

  const nextStep = getNextStep()

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Valuation Overview</h1>
        <p className="mt-1 text-muted-foreground">
          Track progress and manage your{' '}
          {(valuation.type || '409a').replace('_', ' ').toUpperCase()} valuation
        </p>
      </div>

      {/* Key Metrics - MOVED TO TOP */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Fair Market Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">
                {valuation.fair_market_value
                  ? formatCurrency(valuation.fair_market_value)
                  : 'Not calculated'}
              </span>
            </div>
            {valuation.common_share_price && (
              <p className="mt-1 text-sm text-muted-foreground">
                Common: {formatCurrency(valuation.common_share_price)}/share
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valuation Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{formatDate(valuation.valuation_date)}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">As of date for analysis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valuation Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">
                {(valuation.type || '409a').replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {(valuation.type || '409a') === '409a' ? 'IRC 409A Compliance' : 'Special Purpose'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress and Quick Actions - SIDE BY SIDE */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Progress Card */}
        <Card>
          <CardHeader>
            <CardTitle>Valuation Progress</CardTitle>
            <CardDescription>Overall completion status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{progress}% Complete</span>
              <Badge
                variant={progress === 100 ? 'default' : progress > 50 ? 'secondary' : 'outline'}
              >
                {progress === 100 ? 'Completed' : progress > 50 ? 'In Progress' : 'Getting Started'}
              </Badge>
            </div>
            <Progress value={progress} className="h-2" />

            {progress < 100 && (
              <div className="bg-muted/30 mt-4 rounded-lg border p-3">
                <p className="mb-2 text-sm font-medium">Next Step</p>
                <Link href={`/valuations/${valuation.id}/${nextStep.href}`}>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <nextStep.icon className="h-4 w-4" />
                      {nextStep.name}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Link href={`/valuations/${valuation.id}/company`}>
                <Button variant="outline" className="w-full justify-start">
                  <Building2 className="mr-2 h-4 w-4" />
                  Update Company Information
                </Button>
              </Link>
              <Link href={`/valuations/${valuation.id}/assumptions`}>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="mr-2 h-4 w-4" />
                  Manage Assumptions
                </Button>
              </Link>
              <Link href={`/valuations/${valuation.id}/report`}>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>
              </Link>
              <Link href={`/valuations/${valuation.id}/settings`}>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  Team & Permissions
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Methodology Status */}
      {valuation.type === '409a' && (
        <Card>
          <CardHeader>
            <CardTitle>Valuation Methodology</CardTitle>
            <CardDescription>
              Selected approaches and methods - configure in Assumptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Enterprise Valuation Methods */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Enterprise Valuation</p>
                    <p className="text-sm text-muted-foreground">
                      {methodologies
                        .filter(
                          (m) => ['income', 'market', 'asset'].includes(m.category) && m.enabled
                        )
                        .map((m) => m.name)
                        .join(', ') || 'Not configured'}
                    </p>
                  </div>
                </div>
                <Link href={`/valuations/${valuation.id}/assumptions`}>
                  <Button variant="ghost" size="sm">
                    Configure
                  </Button>
                </Link>
              </div>

              {/* Equity Allocation Method */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
                    <Calculator className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Equity Allocation</p>
                    <p className="text-sm text-muted-foreground">
                      {methodologies
                        .filter((m) => m.category === 'allocation' && m.enabled)
                        .map((m) => m.name)
                        .join(', ') || 'Not selected'}
                    </p>
                  </div>
                </div>
                <Link href={`/valuations/${valuation.id}/assumptions`}>
                  <Button variant="ghost" size="sm">
                    Select
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
