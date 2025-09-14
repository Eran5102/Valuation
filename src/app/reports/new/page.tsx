'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'

export default function NewReportPage() {
  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/reports" className="p-2 hover:bg-muted rounded-md transition-colors">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Generate New Report</h1>
            <p className="mt-1 text-muted-foreground">Create professional valuation reports</p>
          </div>
        </div>
        
        <div className="bg-card shadow rounded-lg border border-border p-6">
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-card-foreground mb-2">Report Generation</h3>
            <p className="text-muted-foreground">Report generation functionality will be implemented here.</p>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}