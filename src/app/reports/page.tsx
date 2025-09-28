'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { FileText, Plus, Edit, Download, Copy, Trash2, Eye, ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import dynamic from 'next/dynamic'
import { ColumnDef } from '@tanstack/react-table'

const OptimizedDataTable = dynamic(
  () => import('@/components/ui/optimized-data-table').then((mod) => mod.OptimizedDataTable),
  {
    loading: () => <LoadingSpinner size="lg" className="p-8" />,
    ssr: false,
  }
)
import AppLayout from '@/components/layout/AppLayout'
import { getStatusColor, formatDate } from '@/lib/utils'
import { SummaryCardsGrid, SummaryCard } from '@/components/ui/summary-cards-grid'
import { PageHeader } from '@/components/common/PageHeader'
import { TableActionButtons } from '@/components/ui/table-action-buttons'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import draftService, { SavedDraft } from '@/services/draftService'
import { useRouter } from 'next/navigation'
import { EnhancedReportGenerator } from '@/components/reports/EnhancedReportGenerator'

interface Report {
  id: string
  title: string
  clientName: string
  type: 'Valuation Report' | 'Summary Report' | 'Board Report' | '409A Template'
  status: 'draft' | 'final' | 'delivered'
  createdDate: string
  deliveredDate?: string
  fileSize: string
  isDraft?: boolean
  draftData?: SavedDraft
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm] = useState('')
  const [showCreateFlow, setShowCreateFlow] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      // Load mock reports
      const mockReports: Report[] = [
        {
          id: 'mock_1',
          title: '409A Valuation Report - Q4 2023',
          clientName: 'TechStart Inc.',
          type: 'Valuation Report',
          status: 'delivered',
          createdDate: '2024-01-10',
          deliveredDate: '2024-01-12',
          fileSize: '2.3 MB',
        },
        {
          id: 'mock_2',
          title: 'Board Presentation - Series A',
          clientName: 'InnovateCorp',
          type: 'Board Report',
          status: 'final',
          createdDate: '2024-01-08',
          fileSize: '1.8 MB',
        },
      ]

      // Load saved drafts from localStorage
      const savedDrafts = draftService.getAllDrafts()
      const draftReports: Report[] = savedDrafts.map((draft) => ({
        id: draft.id,
        title: draft.name,
        clientName: draft.clientName || 'Unknown Client',
        type: '409A Template',
        status: draft.status,
        createdDate: draft.createdAt.split('T')[0],
        fileSize: calculateDraftSize(draft),
        isDraft: true,
        draftData: draft,
      }))

      // Combine and sort by date (newest first)
      const allReports = [...draftReports, ...mockReports].sort(
        (a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
      )

      setReports(allReports)
    } catch (error) {
      setReports([])
    } finally {
      setLoading(false)
    }
  }

  const calculateDraftSize = (draft: SavedDraft): string => {
    const sizeInBytes = JSON.stringify(draft).length
    if (sizeInBytes < 1024) return `${sizeInBytes} B`
    if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleContinueEditing = (report: Report) => {
    if (report.isDraft && report.draftData) {
      router.push(`/reports/${report.id}`)
    }
  }

  const handleViewReport = (report: Report) => {
    router.push(`/reports/${report.id}`)
  }

  const handleCreateNewReport = () => {
    setShowCreateFlow(true)
  }

  const handleCreateFromValuation = (valuationId: number) => {
    // Navigate to template selection for this valuation
    router.push(`/reports/template-library?valuationId=${valuationId}`)
  }

  const handleDuplicateDraft = (report: Report) => {
    if (report.isDraft && report.draftData) {
      const duplicated = draftService.duplicateDraft(report.id)
      if (duplicated) {
        fetchReports() // Refresh the list
      }
    }
  }

  const handleDeleteDraft = (report: Report) => {
    if (report.isDraft) {
      setReportToDelete(report)
      setDeleteDialogOpen(true)
    }
  }

  const confirmDeleteReport = () => {
    if (reportToDelete && reportToDelete.isDraft) {
      const deleted = draftService.deleteDraft(reportToDelete.id)
      if (deleted) {
        fetchReports() // Refresh the list
      }
      setReportToDelete(null)
    }
  }

  const handleExportDraft = (report: Report) => {
    if (report.isDraft && report.draftData) {
      const exportData = draftService.exportDraft(report.id)
      if (exportData) {
        const blob = new Blob([exportData], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${report.title.replace(/\s+/g, '_')}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    }
  }

  const filteredReports = reports.filter(
    (report) =>
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calculate metrics for summary cards
  const metrics = useMemo(() => {
    const totalReports = reports.length
    const delivered = reports.filter((r) => r.status === 'delivered').length
    const drafts = reports.filter((r) => r.status === 'draft').length
    const final = reports.filter((r) => r.status === 'final').length

    return { totalReports, delivered, drafts, final }
  }, [reports])

  const summaryCards: SummaryCard[] = useMemo(
    () => [
      {
        icon: FileText,
        iconColor: 'primary',
        label: 'Total Reports',
        value: metrics.totalReports,
      },
      {
        icon: FileText,
        iconColor: 'accent',
        label: 'Delivered',
        value: metrics.delivered,
      },
      {
        icon: FileText,
        iconColor: 'muted-foreground',
        label: 'Drafts',
        value: metrics.drafts,
      },
      {
        icon: FileText,
        iconColor: 'chart-1',
        label: 'Final',
        value: metrics.final,
      },
    ],
    [metrics]
  )

  // Define columns for DataTable
  const columns: ColumnDef<Report>[] = useMemo(
    () => [
      {
        id: 'report',
        header: 'Report',
        accessorKey: 'title',
        enableSorting: true,
        cell: ({ row }) => {
          const report = row.original
          return (
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    report.isDraft ? 'bg-orange-100 text-orange-600' : 'bg-primary/10 text-primary'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="truncate text-sm font-medium text-foreground">{report.title}</div>
                  {report.isDraft && (
                    <Badge variant="outline" className="text-xs">
                      Draft
                    </Badge>
                  )}
                </div>
                {report.deliveredDate && (
                  <div className="text-sm text-muted-foreground">
                    Delivered: {formatDate(report.deliveredDate)}
                  </div>
                )}
                {report.isDraft && report.draftData && (
                  <div className="text-sm text-muted-foreground">
                    Last saved: {formatDate(report.draftData.updatedAt.split('T')[0])}
                  </div>
                )}
              </div>
            </div>
          )
        },
      },
      {
        id: 'client',
        header: 'Client',
        accessorKey: 'clientName',
        enableSorting: true,
        cell: ({ row }) => {
          const report = row.original
          return <div className="text-sm text-foreground">{report.clientName}</div>
        },
      },
      {
        id: 'type',
        header: 'Type',
        accessorKey: 'type',
        enableSorting: true,
        cell: ({ row }) => {
          const report = row.original
          return <div className="text-sm text-foreground">{report.type}</div>
        },
      },
      {
        id: 'status',
        header: 'Status',
        accessorKey: 'status',
        enableSorting: true,
        cell: ({ row }) => {
          const status = row.original.status
          return (
            <Badge className={getStatusColor(status)}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          )
        },
      },
      {
        id: 'created',
        header: 'Created',
        accessorKey: 'createdDate',
        enableSorting: true,
        cell: ({ row }) => {
          const report = row.original
          return <div className="text-sm text-foreground">{formatDate(report.createdDate)}</div>
        },
      },
      {
        id: 'size',
        header: 'Size',
        accessorKey: 'fileSize',
        enableSorting: true,
        cell: ({ row }) => {
          const report = row.original
          return <div className="text-sm text-foreground">{report.fileSize}</div>
        },
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => {
          const report = row.original

          if (report.isDraft) {
            // Draft-specific actions
            return (
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleContinueEditing(report)}
                  className="h-8 px-2"
                >
                  <Edit className="mr-1 h-3 w-3" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDuplicateDraft(report)}
                  className="h-8 px-2"
                >
                  <Copy className="mr-1 h-3 w-3" />
                  Copy
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExportDraft(report)}
                  className="h-8 px-2"
                >
                  <Download className="mr-1 h-3 w-3" />
                  Export
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteDraft(report)}
                  className="hover:bg-destructive/10 h-8 px-2 hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )
          } else {
            // Regular report actions
            return (
              <TableActionButtons
                itemId={report.id}
                onView={() => handleViewReport(report)}
                onEdit={() => handleViewReport(report)}
                onDownload={() => handleViewReport(report)}
                onDelete={() => {
                  /* TODO: Implement delete functionality */
                }}
                showDownload={true}
              />
            )
          }
        },
      },
    ],
    []
  )

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="text-lg text-muted-foreground">Loading reports...</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        {!showCreateFlow && (
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Reports</h1>
              <p className="mt-1 text-muted-foreground">
                Generate and manage valuation reports and documentation
              </p>
            </div>
            <Button onClick={handleCreateNewReport}>
              <Plus className="mr-2 h-4 w-4" />
              Create New Report
            </Button>
          </div>
        )}

        {showCreateFlow ? (
          /* Create New Report Flow */
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Select Valuation Project</h1>
              <p className="mt-1 text-muted-foreground">
                Choose a valuation project to generate a report for
              </p>
              <div className="mt-4">
                <Button variant="outline" onClick={() => setShowCreateFlow(false)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Reports
                </Button>
              </div>
            </div>

            <EnhancedReportGenerator />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <SummaryCardsGrid cards={summaryCards} />

            {/* DataTable */}
            <Card>
              <CardContent className="p-6">
                <OptimizedDataTable
                  columns={columns as any}
                  data={filteredReports}
                  searchPlaceholder="Search reports..."
                  tableId="reports-table"
                  enableColumnFilters
                  enableSorting
                  enableColumnVisibility
                  enableColumnReordering
                  enableRowReordering
                  onRowReorder={(fromIndex, toIndex) => {
                    // TODO: Implement actual row reordering logic
                    // Handle row reordering logic here
                  }}
                />
              </CardContent>
            </Card>
          </>
        )}

        {/* Delete Report Confirmation Dialog */}
        <ConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete Report"
          description={`Are you sure you want to delete "${reportToDelete?.title}"? This action cannot be undone.`}
          confirmText="Delete Report"
          cancelText="Cancel"
          variant="destructive"
          icon="delete"
          onConfirm={confirmDeleteReport}
          onCancel={() => setReportToDelete(null)}
        />
      </div>
    </AppLayout>
  )
}
