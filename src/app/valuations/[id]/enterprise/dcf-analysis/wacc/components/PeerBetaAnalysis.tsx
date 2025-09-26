'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EditableDataTable } from '@/components/ui/editable-data-table'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, TrendingUp, Calculator } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'

interface PeerCompany {
  id?: string
  name: string
  leveredBeta: number
  debtToEquity: number
  taxRate: number
  unleveredBeta?: number
}

interface PeerBetaAnalysisProps {
  peerCompanies: PeerCompany[]
  unleveredBeta: number
  releveredBeta: number
  onAddPeer: () => void
  onDeletePeer: (index: number) => void
  onUpdatePeer: (index: number, field: string, value: any) => void
  onImportPeers: () => void
  isImporting?: boolean
}

export function PeerBetaAnalysis({
  peerCompanies,
  unleveredBeta,
  releveredBeta,
  onAddPeer,
  onDeletePeer,
  onUpdatePeer,
  onImportPeers,
  isImporting = false,
}: PeerBetaAnalysisProps) {
  const peerColumns: ColumnDef<PeerCompany>[] = [
    {
      accessorKey: 'name',
      header: 'Company Name',
      cell: ({ row, getValue }) => (
        <input
          type="text"
          value={getValue() as string}
          onChange={(e) => onUpdatePeer(row.index, 'name', e.target.value)}
          className="w-full border-b border-border bg-transparent px-2 py-1 outline-none focus:border-primary"
        />
      ),
    },
    {
      accessorKey: 'leveredBeta',
      header: 'Levered Beta',
      cell: ({ row, getValue }) => (
        <input
          type="number"
          value={getValue() as number}
          onChange={(e) => onUpdatePeer(row.index, 'leveredBeta', parseFloat(e.target.value) || 0)}
          step="0.01"
          className="w-full border-b border-border bg-transparent px-2 py-1 text-right outline-none focus:border-primary"
        />
      ),
    },
    {
      accessorKey: 'debtToEquity',
      header: 'D/E Ratio',
      cell: ({ row, getValue }) => (
        <input
          type="number"
          value={getValue() as number}
          onChange={(e) => onUpdatePeer(row.index, 'debtToEquity', parseFloat(e.target.value) || 0)}
          step="0.01"
          className="w-full border-b border-border bg-transparent px-2 py-1 text-right outline-none focus:border-primary"
        />
      ),
    },
    {
      accessorKey: 'taxRate',
      header: 'Tax Rate (%)',
      cell: ({ row, getValue }) => (
        <input
          type="number"
          value={(getValue() as number) * 100}
          onChange={(e) =>
            onUpdatePeer(row.index, 'taxRate', parseFloat(e.target.value) / 100 || 0)
          }
          step="0.1"
          className="w-full border-b border-border bg-transparent px-2 py-1 text-right outline-none focus:border-primary"
        />
      ),
    },
    {
      accessorKey: 'unleveredBeta',
      header: 'Unlevered Beta',
      cell: ({ row }) => {
        const peer = row.original
        const unlevered = peer.leveredBeta / (1 + (1 - peer.taxRate) * peer.debtToEquity)
        return (
          <div className="text-right font-mono text-muted-foreground">{unlevered.toFixed(3)}</div>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDeletePeer(row.index)}
          className="h-8 w-8"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      ),
    },
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Peer Beta Analysis
            </CardTitle>
            <CardDescription>
              Analyze comparable companies to derive appropriate beta for valuation
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onImportPeers} disabled={isImporting}>
              {isImporting ? 'Importing...' : 'Import from Market Data'}
            </Button>
            <Button variant="outline" size="sm" onClick={onAddPeer}>
              <Plus className="mr-1 h-4 w-4" />
              Add Peer
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <EditableDataTable
          tableId="peer-beta-analysis"
          columns={peerColumns}
          data={peerCompanies}
          className="rounded-lg border"
        />

        {peerCompanies.length > 0 && (
          <div className="grid grid-cols-3 gap-4 rounded-lg bg-muted/50 p-4">
            <div>
              <div className="text-sm text-muted-foreground">Average Unlevered Beta</div>
              <div className="text-2xl font-bold">{unleveredBeta.toFixed(3)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Relevered Beta</div>
              <div className="text-2xl font-bold">{releveredBeta.toFixed(3)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Peer Count</div>
              <div className="text-2xl font-bold">{peerCompanies.length}</div>
            </div>
          </div>
        )}

        {peerCompanies.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Calculator className="mb-3 h-12 w-12" />
            <p>No peer companies added yet</p>
            <p className="text-sm">Add peer companies to calculate unlevered beta</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
