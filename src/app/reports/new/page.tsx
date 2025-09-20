'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'

export default function NewReportPage() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <div className="flex items-center space-x-4">
          <Link href="/reports" className="rounded-md p-2 transition-colors hover:bg-muted">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Generate New Report</h1>
            <p className="mt-1 text-muted-foreground">Create professional valuation reports</p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow">
          <div className="py-12 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium text-card-foreground">Report Generation</h3>
            <p className="text-muted-foreground">
              Report generation functionality will be implemented here.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
