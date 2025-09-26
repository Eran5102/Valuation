import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { CapTableTotals } from '../types'
import { formatNumber, formatCurrency } from '@/lib/utils'

interface SummaryCardsProps {
  shareClassCount: number
  totals: CapTableTotals
}

export function SummaryCards({ shareClassCount, totals }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      <Card className="border-primary/20 bg-card">
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-primary">{shareClassCount}</div>
          <p className="text-sm text-muted-foreground">Share Classes</p>
        </CardContent>
      </Card>
      <Card className="border-primary/20 bg-card">
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-primary">
            {formatNumber(totals.totalShares)}
          </div>
          <p className="text-sm text-muted-foreground">Total Shares</p>
        </CardContent>
      </Card>
      <Card className="border-primary/20 bg-card">
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-accent">
            {formatCurrency(totals.totalInvested)}
          </div>
          <p className="text-sm text-muted-foreground">Total Invested</p>
        </CardContent>
      </Card>
      <Card className="border-primary/20 bg-card">
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-accent">{formatCurrency(totals.totalLP)}</div>
          <p className="text-sm text-muted-foreground">Total LP</p>
        </CardContent>
      </Card>
    </div>
  )
}