'use client'

import React from 'react'
import { BarChart3, TrendingUp, DollarSign, Users } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'

export default function AnalyticsPage() {
  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="mt-1 text-muted-foreground">
            View insights and trends across your valuations and clients
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card p-6 rounded-lg border border-border">
            <div className="flex items-center">
              <div className="p-3 bg-primary/10 rounded-md">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-card-foreground">42</p>
                <p className="text-sm text-muted-foreground">Total Valuations</p>
              </div>
            </div>
          </div>
          <div className="bg-card p-6 rounded-lg border border-border">
            <div className="flex items-center">
              <div className="p-3 bg-accent/10 rounded-md">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-card-foreground">18</p>
                <p className="text-sm text-muted-foreground">Active Clients</p>
              </div>
            </div>
          </div>
          <div className="bg-card p-6 rounded-lg border border-border">
            <div className="flex items-center">
              <div className="p-3 bg-chart-2/10 rounded-md">
                <DollarSign className="h-6 w-6 text-chart-2" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-card-foreground">$2.4B</p>
                <p className="text-sm text-muted-foreground">Total Value</p>
              </div>
            </div>
          </div>
          <div className="bg-card p-6 rounded-lg border border-border">
            <div className="flex items-center">
              <div className="p-3 bg-chart-1/10 rounded-md">
                <TrendingUp className="h-6 w-6 text-chart-1" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-card-foreground">+15%</p>
                <p className="text-sm text-muted-foreground">Growth Rate</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card shadow rounded-lg border border-border p-6">
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-card-foreground mb-2">Analytics Dashboard</h3>
            <p className="text-muted-foreground">Advanced analytics and reporting features will be implemented here.</p>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}