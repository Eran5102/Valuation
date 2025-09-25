'use client'

import { useValuationWorkspace } from '@/contexts/ValuationWorkspaceContext'
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
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'

export default function ValuationOverviewPage() {
  const { valuation, loading } = useValuationWorkspace()

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
    const totalSteps = 7 // Company, Enterprise, Allocation, Discounts, Assumptions, Cap Table, Report

    // Check which sections are completed (simplified logic)
    if (valuation.assumptions && Object.keys(valuation.assumptions).length > 0) completedSteps++
    if (valuation.methodologies?.enterprise) completedSteps++
    if (valuation.methodologies?.allocation?.method) completedSteps++
    if (valuation.methodologies?.discounts) completedSteps++
    if (valuation.fair_market_value) completedSteps += 3 // Assume calculation steps are done

    return Math.round((completedSteps / totalSteps) * 100)
  }

  const progress = calculateProgress()

  const getNextStep = () => {
    if (!valuation.assumptions || Object.keys(valuation.assumptions).length === 0) {
      return { name: 'Set up assumptions', href: 'assumptions', icon: Settings }
    }
    if (!valuation.methodologies?.enterprise) {
      return { name: 'Complete enterprise valuation', href: 'enterprise', icon: TrendingUp }
    }
    if (!valuation.methodologies?.allocation?.method) {
      return { name: 'Select allocation method', href: 'allocation', icon: Layers }
    }
    if (!valuation.methodologies?.discounts) {
      return { name: 'Apply discounts', href: 'discounts', icon: Percent }
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
              <div className="mt-4 rounded-lg border bg-muted/30 p-3">
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
            <CardDescription>Selected approaches and methods</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Enterprise Valuation */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Enterprise Valuation</p>
                    <p className="text-sm text-muted-foreground">
                      {valuation.methodologies?.enterprise
                        ? `${Object.entries(valuation.methodologies.enterprise)
                            .filter(([_, selected]) => selected)
                            .map(([method]) => method)
                            .join(', ')} approach`
                        : 'Not configured'}
                    </p>
                  </div>
                </div>
                <Link href={`/valuations/${valuation.id}/enterprise`}>
                  <Button variant="ghost" size="sm">
                    {valuation.methodologies?.enterprise ? 'Edit' : 'Configure'}
                  </Button>
                </Link>
              </div>

              {/* Equity Allocation */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Layers className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Equity Allocation</p>
                    <p className="text-sm text-muted-foreground">
                      {valuation.methodologies?.allocation?.method
                        ? `${valuation.methodologies.allocation.method.toUpperCase()} method`
                        : 'Not selected'}
                    </p>
                  </div>
                </div>
                <Link href={`/valuations/${valuation.id}/allocation`}>
                  <Button variant="ghost" size="sm">
                    {valuation.methodologies?.allocation?.method ? 'Edit' : 'Select'}
                  </Button>
                </Link>
              </div>

              {/* Discounts */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Percent className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Discounts</p>
                    <p className="text-sm text-muted-foreground">
                      {valuation.methodologies?.discounts
                        ? `${Object.entries(valuation.methodologies.discounts)
                            .filter(([_, applied]) => applied)
                            .map(([discount]) => discount.toUpperCase())
                            .join(', ')} applied`
                        : 'Not applied'}
                    </p>
                  </div>
                </div>
                <Link href={`/valuations/${valuation.id}/discounts`}>
                  <Button variant="ghost" size="sm">
                    {valuation.methodologies?.discounts ? 'Edit' : 'Apply'}
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

// Add missing imports
import { Settings, Layers, Percent, Calculator } from 'lucide-react'
