'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { 
  FileText, 
  Plus,
  Download,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import AppLayout from '@/components/layout/AppLayout'
import { getStatusColor, formatDate } from '@/lib/utils'
import { SummaryCardsGrid, SummaryCard } from '@/components/ui/summary-cards-grid'
import { PageHeader } from '@/components/ui/page-header'
import { TableActionButtons } from '@/components/ui/table-action-buttons'

interface Report {
  id: number
  title: string
  clientName: string
  type: 'Valuation Report' | 'Summary Report' | 'Board Report'
  status: 'draft' | 'final' | 'delivered'
  createdDate: string
  deliveredDate?: string
  fileSize: string
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm] = useState('')

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const mockReports: Report[] = [
        {
          id: 1,
          title: '409A Valuation Report - Q4 2023',
          clientName: 'TechStart Inc.',
          type: 'Valuation Report',
          status: 'delivered',
          createdDate: '2024-01-10',
          deliveredDate: '2024-01-12',
          fileSize: '2.3 MB'
        },
        {
          id: 2,
          title: 'Board Presentation - Series A',
          clientName: 'InnovateCorp',
          type: 'Board Report',
          status: 'final',
          createdDate: '2024-01-08',
          fileSize: '1.8 MB'
        },
        {
          id: 3,
          title: 'Valuation Summary',
          clientName: 'StartupXYZ',
          type: 'Summary Report',
          status: 'draft',
          createdDate: '2024-01-05',
          fileSize: '0.9 MB'
        }
      ]
      setReports(mockReports)
    } catch (error) {
      console.error('Failed to fetch reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredReports = reports.filter(report =>
    report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calculate metrics for summary cards
  const metrics = useMemo(() => {
    const totalReports = reports.length
    const delivered = reports.filter(r => r.status === 'delivered').length
    const drafts = reports.filter(r => r.status === 'draft').length
    const final = reports.filter(r => r.status === 'final').length
    
    return { totalReports, delivered, drafts, final }
  }, [reports])

  const summaryCards: SummaryCard[] = useMemo(() => [
    {
      icon: FileText,
      iconColor: 'primary',
      label: 'Total Reports',
      value: metrics.totalReports
    },
    {
      icon: FileText,
      iconColor: 'accent',
      label: 'Delivered',
      value: metrics.delivered
    },
    {
      icon: FileText,
      iconColor: 'muted-foreground',
      label: 'Drafts',
      value: metrics.drafts
    },
    {
      icon: FileText,
      iconColor: 'chart-1',
      label: 'Final',
      value: metrics.final
    }
  ], [metrics])

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
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-foreground truncate">
                  {report.title}
                </div>
                {report.deliveredDate && (
                  <div className="text-sm text-muted-foreground">
                    Delivered: {formatDate(report.deliveredDate)}
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
          return (
            <div className="text-sm text-foreground">
              {report.clientName}
            </div>
          )
        },
      },
      {
        id: 'type',
        header: 'Type',
        accessorKey: 'type',
        enableSorting: true,
        cell: ({ row }) => {
          const report = row.original
          return (
            <div className="text-sm text-foreground">
              {report.type}
            </div>
          )
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
          return (
            <div className="text-sm text-foreground">
              {formatDate(report.createdDate)}
            </div>
          )
        },
      },
      {
        id: 'size',
        header: 'Size',
        accessorKey: 'fileSize',
        enableSorting: true,
        cell: ({ row }) => {
          const report = row.original
          return (
            <div className="text-sm text-foreground">
              {report.fileSize}
            </div>
          )
        },
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => {
          const report = row.original
          return (
            <TableActionButtons 
              itemId={report.id}
              onView={() => console.log('View report:', report.id)}
              onEdit={() => console.log('Edit report:', report.id)}
              onDownload={() => console.log('Download report:', report.id)}
              onDelete={() => console.log('Delete report:', report.id)}
              showDownload={true}
            />
          )
        },
      },
    ],
    []
  )

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">Loading reports...</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <PageHeader 
          title="Reports"
          description="Generate and manage valuation reports and documentation"
          actionButton={{
            href: "/reports/new",
            icon: Plus,
            text: "Generate Report"
          }}
        />

        {/* Summary Cards */}
        <SummaryCardsGrid cards={summaryCards} />

        {/* DataTable */}
        <Card>
          <CardContent className="p-6">
            <DataTable
              columns={columns}
              data={filteredReports}
              searchPlaceholder="Search reports..."
              tableId="reports-table"
              enableColumnFilters
              enableSorting
              enableColumnVisibility
              enableColumnReordering
              enableRowReordering
              onRowReorder={(fromIndex, toIndex) => {
                console.log(`Reorder row from ${fromIndex} to ${toIndex}`);
                // Handle row reordering logic here
              }}
            />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}