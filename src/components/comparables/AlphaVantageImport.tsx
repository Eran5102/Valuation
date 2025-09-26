'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { OptimizedDataTable } from '@/components/ui/optimized-data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Search, Download, RefreshCw, AlertCircle, Building2, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface AlphaVantageCompany {
  ticker: string
  name: string
  sector: string
  industry: string
  marketCap: number
  revenue: number
  ebitda: number
  netIncome: number
  totalDebt?: number
  cash?: number
  evToRevenue?: number
  evToEbitda?: number
  peRatio?: number
  profitMargin?: number
  beta?: number
}

interface AlphaVantageImportProps {
  valuationId: string
  onImport: (companies: AlphaVantageCompany[]) => void
}

export function AlphaVantageImport({ valuationId, onImport }: AlphaVantageImportProps) {
  const [tickers, setTickers] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<AlphaVantageCompany[]>([])
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())

  const searchTickers = async () => {
    if (!tickers.trim()) {
      toast.error('Please enter ticker symbols')
      return
    }

    const tickerList = tickers
      .split(',')
      .map((t) => t.trim().toUpperCase())
      .filter((t) => t.length > 0)

    if (tickerList.length === 0) {
      toast.error('No valid tickers provided')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/peer-companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'batch',
          peerTickers: tickerList,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch companies')
      }

      const data = await response.json()
      if (data.companies && data.companies.length > 0) {
        setSearchResults(data.companies)
        setSelectedRows(new Set(data.companies.map((c: AlphaVantageCompany) => c.ticker)))
        toast.success(`Found ${data.companies.length} companies`)
      } else {
        toast.error('No companies found')
      }
    } catch (error) {
      toast.error('Failed to fetch companies')
    } finally {
      setLoading(false)
    }
  }

  const columns: ColumnDef<AlphaVantageCompany>[] = useMemo(
    () => [
      {
        accessorKey: 'ticker',
        header: 'Ticker',
        cell: ({ getValue }) => {
          const value = getValue() as string
          return <span className="font-medium">{value || '-'}</span>
        },
      },
      {
        accessorKey: 'name',
        header: 'Company',
        cell: ({ getValue }) => getValue() || '-',
      },
      {
        accessorKey: 'sector',
        header: 'Sector',
        cell: ({ getValue }) => {
          const value = getValue() as string
          return value ? <Badge variant="outline">{value}</Badge> : '-'
        },
      },
      {
        accessorKey: 'marketCap',
        header: 'Market Cap',
        cell: ({ getValue }) => formatCurrency(getValue() as number),
      },
      {
        accessorKey: 'revenue',
        header: 'Revenue',
        cell: ({ getValue }) => formatCurrency(getValue() as number),
      },
      {
        accessorKey: 'evToRevenue',
        header: 'EV/Rev',
        cell: ({ getValue }) => {
          const value = getValue() as number | undefined
          return value ? `${value.toFixed(1)}x` : '-'
        },
      },
      {
        accessorKey: 'evToEbitda',
        header: 'EV/EBITDA',
        cell: ({ getValue }) => {
          const value = getValue() as number | undefined
          return value ? `${value.toFixed(1)}x` : '-'
        },
      },
      {
        accessorKey: 'peRatio',
        header: 'P/E',
        cell: ({ getValue }) => {
          const value = getValue() as number | undefined
          return value ? `${value.toFixed(1)}x` : '-'
        },
      },
    ],
    []
  )

  const handleImport = async () => {
    const selected = searchResults.filter((c) => selectedRows.has(c.ticker))
    if (selected.length === 0) {
      toast.error('Please select at least one company to import')
      return
    }

    try {
      // Save companies to database
      const response = await fetch('/api/peer-companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          valuationId,
          companies: selected,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save companies')
      }

      const { savedCompanies } = await response.json()

      // Call the onImport callback with saved companies
      onImport(selected)
      toast.success(`Successfully imported and saved ${savedCompanies?.length || selected.length} companies`)

      // Clear results after import
      setSearchResults([])
      setSelectedRows(new Set())
      setTickers('')
    } catch (error) {
      toast.error('Failed to save companies to database')
    }
  }

  const formatCurrency = (value: number | null | undefined) => {
    if (value == null) return '-'
    if (Math.abs(value) >= 1e9) {
      return `$${(value / 1e9).toFixed(2)}B`
    } else if (Math.abs(value) >= 1e6) {
      return `$${(value / 1e6).toFixed(1)}M`
    }
    return `$${value.toFixed(0)}`
  }

  return (
    <div className="space-y-4">
      {/* Search Controls */}
      <div className="space-y-2">
        <Label>Enter Ticker Symbols</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Enter tickers separated by commas (e.g., AAPL, MSFT, GOOGL)"
            value={tickers}
            onChange={(e) => setTickers(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchTickers()}
            className="flex-1"
          />
          <Button onClick={searchTickers} disabled={loading}>
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Search
          </Button>
        </div>
      </div>

      {loading && (
        <Alert>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <AlertDescription>Loading company data from Alpha Vantage...</AlertDescription>
        </Alert>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              Select companies to import into your comparables analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OptimizedDataTable
              data={searchResults}
              columns={columns}
              searchKey="name"
              enableRowSelection={true}
              selectedRows={selectedRows}
              onRowSelectionChange={(selection) => {
                setSelectedRows(new Set(selection))
              }}
              getRowId={(row) => row.ticker}
            />
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {selectedRows.size} of {searchResults.length} companies selected
              </div>
              <Button onClick={handleImport} disabled={selectedRows.size === 0}>
                <Download className="mr-2 h-4 w-4" />
                Import Selected
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && searchResults.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Search for companies by ticker symbol or enter multiple tickers separated by commas.
            Alpha Vantage API has rate limits (5 calls/minute for free tier).
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
