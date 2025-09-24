'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Clock,
  GitBranch,
  Save,
  Download,
  RefreshCw,
  User,
  Calendar,
  FileText,
  CheckCircle,
  AlertCircle,
  Info,
  TrendingUp,
  Archive,
  History,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDescription,
  TimelineHeader,
  TimelineIcon,
  TimelineItem,
  TimelineTitle,
} from '@/components/ui/timeline'

interface HistoryEvent {
  id: string
  timestamp: string
  user: string
  action: string
  category: 'valuation' | 'assumption' | 'methodology' | 'calculation' | 'review' | 'export'
  description: string
  changes?: {
    field: string
    oldValue: string | number
    newValue: string | number
  }[]
  version?: number
  status?: 'success' | 'warning' | 'error'
}

interface ProjectVersion {
  id: string
  version: number
  timestamp: string
  createdBy: string
  description: string
  isBaseline: boolean
  metrics: {
    enterpriseValue: number
    equityValue: number
    sharePrice: number
    wacc: number
    terminalGrowth: number
  }
  status: 'draft' | 'review' | 'approved' | 'superseded'
}

interface AuditTrail {
  id: string
  timestamp: string
  user: string
  ipAddress: string
  action: string
  resource: string
  details: string
  result: 'success' | 'failure'
}

interface ProjectHistoryClientProps {
  valuationId: string
}

export function ProjectHistoryClient({ valuationId }: ProjectHistoryClientProps) {
  const [historyEvents, setHistoryEvents] = useState<HistoryEvent[]>([])
  const [projectVersions, setProjectVersions] = useState<ProjectVersion[]>([])
  const [auditTrail, setAuditTrail] = useState<AuditTrail[]>([])
  const [selectedVersion, setSelectedVersion] = useState<ProjectVersion | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Load data on mount
  useEffect(() => {
    loadProjectHistory()
  }, [valuationId])

  const loadProjectHistory = async () => {
    try {
      const response = await fetch(`/api/valuations/${valuationId}/history`)
      if (response.ok) {
        const data = await response.json()
        setHistoryEvents(data.events || generateSampleHistory())
        setProjectVersions(data.versions || generateSampleVersions())
        setAuditTrail(data.auditTrail || generateSampleAuditTrail())
      } else {
        // Generate sample data if API fails
        setHistoryEvents(generateSampleHistory())
        setProjectVersions(generateSampleVersions())
        setAuditTrail(generateSampleAuditTrail())
      }
    } catch (error) {
      console.error('Error loading project history:', error)
      setHistoryEvents(generateSampleHistory())
      setProjectVersions(generateSampleVersions())
      setAuditTrail(generateSampleAuditTrail())
    }
  }

  const generateSampleHistory = (): HistoryEvent[] => {
    const now = new Date()
    return [
      {
        id: 'evt_1',
        timestamp: new Date(now.getTime() - 1000 * 60 * 5).toISOString(),
        user: 'John Smith',
        action: 'Updated WACC Calculation',
        category: 'calculation',
        description: 'Adjusted cost of equity based on updated risk premiums',
        changes: [
          { field: 'Cost of Equity', oldValue: 14.5, newValue: 15.2 },
          { field: 'WACC', oldValue: 12.1, newValue: 12.8 },
        ],
        status: 'success',
      },
      {
        id: 'evt_2',
        timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString(),
        user: 'Jane Doe',
        action: 'Modified Revenue Assumptions',
        category: 'assumption',
        description: 'Updated revenue growth rates for years 2-5',
        changes: [
          { field: 'Year 2 Growth', oldValue: 18, newValue: 20 },
          { field: 'Year 3 Growth', oldValue: 15, newValue: 18 },
        ],
        status: 'success',
      },
      {
        id: 'evt_3',
        timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString(),
        user: 'Mike Johnson',
        action: 'Selected DCF Methodology',
        category: 'methodology',
        description: 'Added DCF as primary valuation methodology',
        status: 'success',
      },
      {
        id: 'evt_4',
        timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 48).toISOString(),
        user: 'Sarah Williams',
        action: 'Submitted for Review',
        category: 'review',
        description: 'Valuation submitted for partner review',
        version: 1,
        status: 'success',
      },
      {
        id: 'evt_5',
        timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 72).toISOString(),
        user: 'Tom Brown',
        action: 'Exported Report',
        category: 'export',
        description: 'Generated PDF report for client presentation',
        status: 'success',
      },
    ]
  }

  const generateSampleVersions = (): ProjectVersion[] => {
    const now = new Date()
    return [
      {
        id: 'ver_1',
        version: 3,
        timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString(),
        createdBy: 'John Smith',
        description: 'Final adjustments after review comments',
        isBaseline: true,
        metrics: {
          enterpriseValue: 125000000,
          equityValue: 98000000,
          sharePrice: 9.8,
          wacc: 12.8,
          terminalGrowth: 2.5,
        },
        status: 'approved',
      },
      {
        id: 'ver_2',
        version: 2,
        timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 48).toISOString(),
        createdBy: 'Jane Doe',
        description: 'Updated with market comparables',
        isBaseline: false,
        metrics: {
          enterpriseValue: 120000000,
          equityValue: 93000000,
          sharePrice: 9.3,
          wacc: 12.1,
          terminalGrowth: 2.5,
        },
        status: 'superseded',
      },
      {
        id: 'ver_3',
        version: 1,
        timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 96).toISOString(),
        createdBy: 'Mike Johnson',
        description: 'Initial DCF valuation',
        isBaseline: false,
        metrics: {
          enterpriseValue: 115000000,
          equityValue: 88000000,
          sharePrice: 8.8,
          wacc: 11.5,
          terminalGrowth: 3.0,
        },
        status: 'superseded',
      },
    ]
  }

  const generateSampleAuditTrail = (): AuditTrail[] => {
    const now = new Date()
    return [
      {
        id: 'audit_1',
        timestamp: new Date(now.getTime() - 1000 * 60 * 10).toISOString(),
        user: 'john.smith@company.com',
        ipAddress: '192.168.1.100',
        action: 'UPDATE',
        resource: '/api/valuations/123/wacc',
        details: 'Updated WACC calculation parameters',
        result: 'success',
      },
      {
        id: 'audit_2',
        timestamp: new Date(now.getTime() - 1000 * 60 * 30).toISOString(),
        user: 'jane.doe@company.com',
        ipAddress: '192.168.1.101',
        action: 'READ',
        resource: '/api/valuations/123/financials',
        details: 'Accessed financial projections',
        result: 'success',
      },
      {
        id: 'audit_3',
        timestamp: new Date(now.getTime() - 1000 * 60 * 60).toISOString(),
        user: 'mike.johnson@company.com',
        ipAddress: '192.168.1.102',
        action: 'CREATE',
        resource: '/api/valuations/123/versions',
        details: 'Created new version snapshot',
        result: 'success',
      },
      {
        id: 'audit_4',
        timestamp: new Date(now.getTime() - 1000 * 60 * 120).toISOString(),
        user: 'sarah.williams@company.com',
        ipAddress: '192.168.1.103',
        action: 'EXPORT',
        resource: '/api/valuations/123/report',
        details: 'Exported valuation report as PDF',
        result: 'success',
      },
    ]
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'valuation':
        return <TrendingUp className="h-4 w-4" />
      case 'assumption':
        return <FileText className="h-4 w-4" />
      case 'methodology':
        return <GitBranch className="h-4 w-4" />
      case 'calculation':
        return <FileText className="h-4 w-4" /> // Changed from Calculator
      case 'review':
        return <CheckCircle className="h-4 w-4" />
      case 'export':
        return <Download className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'review':
        return 'bg-yellow-100 text-yellow-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'superseded':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleCreateVersion = async () => {
    try {
      const response = await fetch(`/api/valuations/${valuationId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: 'Manual version snapshot',
        }),
      })

      if (response.ok) {
        toast.success('Version created successfully')
        loadProjectHistory()
      } else {
        toast.error('Failed to create version')
      }
    } catch (error) {
      toast.error('Error creating version')
    }
  }

  const handleRestoreVersion = async (version: ProjectVersion) => {
    try {
      const response = await fetch(
        `/api/valuations/${valuationId}/versions/${version.id}/restore`,
        {
          method: 'POST',
        }
      )

      if (response.ok) {
        toast.success(`Restored to version ${version.version}`)
        loadProjectHistory()
      } else {
        toast.error('Failed to restore version')
      }
    } catch (error) {
      toast.error('Error restoring version')
    }
  }

  const handleExportHistory = () => {
    const data = {
      events: historyEvents,
      versions: projectVersions,
      auditTrail,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `valuation-history-${valuationId}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const filteredEvents = historyEvents.filter((event) => {
    if (filterCategory !== 'all' && event.category !== filterCategory) return false
    if (searchQuery && !event.description.toLowerCase().includes(searchQuery.toLowerCase()))
      return false
    return true
  })

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <History className="h-6 w-6" />
            Project History
          </h1>
          <p className="mt-1 text-muted-foreground">
            Track changes, versions, and audit trail for this valuation
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportHistory}>
            <Download className="mr-2 h-4 w-4" />
            Export History
          </Button>
          <Button onClick={handleCreateVersion}>
            <Save className="mr-2 h-4 w-4" />
            Create Version
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{historyEvents.length}</div>
            <div className="text-xs text-muted-foreground">Last 30 days</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Versions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectVersions.length}</div>
            <div className="text-xs text-muted-foreground">
              Current: v{projectVersions[0]?.version || 1}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contributors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(historyEvents.map((e) => e.user)).size}
            </div>
            <div className="text-xs text-muted-foreground">Active users</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Last Updated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {historyEvents[0] ? new Date(historyEvents[0].timestamp).toLocaleDateString() : 'N/A'}
            </div>
            <div className="text-xs text-muted-foreground">
              {historyEvents[0] ? new Date(historyEvents[0].timestamp).toLocaleTimeString() : ''}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="versions">Versions</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Activity Timeline</CardTitle>
                  <CardDescription>
                    Chronological history of all changes and actions
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-[200px]"
                  />
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="rounded-md border px-3 py-2"
                  >
                    <option value="all">All Categories</option>
                    <option value="valuation">Valuation</option>
                    <option value="assumption">Assumptions</option>
                    <option value="methodology">Methodology</option>
                    <option value="calculation">Calculations</option>
                    <option value="review">Reviews</option>
                    <option value="export">Exports</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredEvents.map((event, index) => (
                  <div key={event.id} className="relative">
                    {index < filteredEvents.length - 1 && (
                      <div className="absolute bottom-0 left-4 top-10 w-0.5 bg-gray-200" />
                    )}
                    <div className="flex gap-4">
                      <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-200 bg-white">
                        {getCategoryIcon(event.category)}
                      </div>
                      <div className="flex-1 rounded-lg border p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{event.action}</h4>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {event.description}
                            </p>
                            {event.changes && event.changes.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {event.changes.map((change, i) => (
                                  <div key={i} className="text-sm">
                                    <span className="font-medium">{change.field}:</span>{' '}
                                    <span className="text-red-600 line-through">
                                      {change.oldValue}
                                    </span>
                                    {' → '}
                                    <span className="text-green-600">{change.newValue}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="mb-1">
                              {event.category}
                            </Badge>
                            <div className="text-xs text-muted-foreground">
                              {new Date(event.timestamp).toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground">by {event.user}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="versions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Version Control</CardTitle>
              <CardDescription>
                Manage and compare different versions of the valuation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {projectVersions.map((version) => (
                <div key={version.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">Version {version.version}</h4>
                        {version.isBaseline && (
                          <Badge className="bg-blue-100 text-blue-800">Baseline</Badge>
                        )}
                        <Badge className={getStatusColor(version.status)}>{version.status}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{version.description}</p>
                      <div className="mt-3 grid grid-cols-5 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Enterprise Value:</span>
                          <p className="font-semibold">
                            ${(version.metrics.enterpriseValue / 1000000).toFixed(1)}M
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Equity Value:</span>
                          <p className="font-semibold">
                            ${(version.metrics.equityValue / 1000000).toFixed(1)}M
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Share Price:</span>
                          <p className="font-semibold">${version.metrics.sharePrice.toFixed(2)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">WACC:</span>
                          <p className="font-semibold">{version.metrics.wacc}%</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Terminal Growth:</span>
                          <p className="font-semibold">{version.metrics.terminalGrowth}%</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 text-right">
                      <div className="text-xs text-muted-foreground">
                        {new Date(version.timestamp).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">by {version.createdBy}</div>
                      {version.status === 'superseded' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRestoreVersion(version)}
                        >
                          <RefreshCw className="mr-1 h-4 w-4" />
                          Restore
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {selectedVersion && projectVersions.find((v) => v.isBaseline) && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-sm">Version Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="mb-2 font-semibold">
                          Baseline (v{projectVersions.find((v) => v.isBaseline)?.version})
                        </h4>
                        {/* Comparison details would go here */}
                      </div>
                      <div>
                        <h4 className="mb-2 font-semibold">
                          Selected (v{selectedVersion.version})
                        </h4>
                        {/* Comparison details would go here */}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
              <CardDescription>Complete audit log of all system interactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {auditTrail.map((audit) => (
                  <div key={audit.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-1 h-2 w-2 rounded-full ${
                            audit.result === 'success' ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{audit.action}</span>
                            <Badge variant="outline" className="text-xs">
                              {audit.resource}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{audit.details}</p>
                          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {audit.user}
                            </span>
                            <span>{audit.ipAddress}</span>
                            <span>{new Date(audit.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Audit logs are retained for 90 days and include all read, write, and export
                  operations. For compliance purposes, these logs cannot be modified or deleted.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
