'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { OptimizedDataTable } from '@/components/ui/optimized-data-table'
import { ColumnDef } from '@tanstack/react-table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  BarChart3,
  Plus,
  Trash2,
  TrendingUp,
  Building2,
  DollarSign,
  Activity,
  AlertCircle,
  Search,
  Filter,
  Download,
  RefreshCw,
} from 'lucide-react'
import { useValuationWorkspace } from '@/contexts/ValuationWorkspaceContext'
import { AlphaVantageImport } from '@/components/comparables/AlphaVantageImport'
import { toast } from 'sonner'

interface ComparableCompany {
  id: string
  ticker: string
  name: string
  industry: string
  marketCap: number
  revenue: number
  ebitda: number
  netIncome: number
  evRevenue: number
  evEbitda: number
  peRatio: number
  revenueGrowth: number
  ebitdaMargin: number
  selected: boolean
}

const sampleComps: ComparableCompany[] = [
  {
    id: '1',
    ticker: 'AAPL',
    name: 'Apple Inc.',
    industry: 'Technology',
    marketCap: 3000000,
    revenue: 380000,
    ebitda: 120000,
    netIncome: 95000,
    evRevenue: 7.8,
    evEbitda: 24.5,
    peRatio: 31.5,
    revenueGrowth: 8.5,
    ebitdaMargin: 31.6,
    selected: true,
  },
  {
    id: '2',
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    industry: 'Technology',
    marketCap: 2800000,
    revenue: 210000,
    ebitda: 95000,
    netIncome: 75000,
    evRevenue: 13.3,
    evEbitda: 29.5,
    peRatio: 37.3,
    revenueGrowth: 12.3,
    ebitdaMargin: 45.2,
    selected: true,
  },
  {
    id: '3',
    ticker: 'GOOGL',
    name: 'Alphabet Inc.',
    industry: 'Technology',
    marketCap: 1700000,
    revenue: 280000,
    ebitda: 90000,
    netIncome: 70000,
    evRevenue: 6.1,
    evEbitda: 18.9,
    peRatio: 24.3,
    revenueGrowth: 10.2,
    ebitdaMargin: 32.1,
    selected: true,
  },
  {
    id: '4',
    ticker: 'META',
    name: 'Meta Platforms',
    industry: 'Technology',
    marketCap: 900000,
    revenue: 120000,
    ebitda: 55000,
    netIncome: 40000,
    evRevenue: 7.5,
    evEbitda: 16.4,
    peRatio: 22.5,
    revenueGrowth: 15.8,
    ebitdaMargin: 45.8,
    selected: false,
  },
  {
    id: '5',
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    industry: 'Technology',
    marketCap: 1100000,
    revenue: 60000,
    ebitda: 35000,
    netIncome: 30000,
    evRevenue: 18.3,
    evEbitda: 31.4,
    peRatio: 36.7,
    revenueGrowth: 61.2,
    ebitdaMargin: 58.3,
    selected: false,
  },
]

export default function PublicComparablesPage() {
  const params = useParams()
  const valuationId = params?.id as string
  const { valuation, updateAssumptions } = useValuationWorkspace()

  const [comparables, setComparables] = useState<ComparableCompany[]>(sampleComps)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showAlphaVantage, setShowAlphaVantage] = useState(false)
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())

  // New company form state
  const [newCompany, setNewCompany] = useState<Partial<ComparableCompany>>({
    ticker: '',
    name: '',
    industry: '',
    marketCap: 0,
    revenue: 0,
    ebitda: 0,
    netIncome: 0,
  })

  // Calculate statistics for selected companies
  const selectedComps = comparables.filter((c) => selectedRows.has(c.id))

  const calculateStats = () => {
    if (selectedComps.length === 0) {
      return {
        mean: { evRevenue: 0, evEbitda: 0, peRatio: 0, ebitdaMargin: 0 },
        median: { evRevenue: 0, evEbitda: 0, peRatio: 0, ebitdaMargin: 0 },
        min: { evRevenue: 0, evEbitda: 0, peRatio: 0, ebitdaMargin: 0 },
        max: { evRevenue: 0, evEbitda: 0, peRatio: 0, ebitdaMargin: 0 },
      }
    }

    const metrics = {
      evRevenue: selectedComps.map((c) => c.evRevenue).sort((a, b) => a - b),
      evEbitda: selectedComps.map((c) => c.evEbitda).sort((a, b) => a - b),
      peRatio: selectedComps.map((c) => c.peRatio).sort((a, b) => a - b),
      ebitdaMargin: selectedComps.map((c) => c.ebitdaMargin).sort((a, b) => a - b),
    }

    const getMedian = (arr: number[]) => {
      const mid = Math.floor(arr.length / 2)
      return arr.length % 2 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2
    }

    return {
      mean: {
        evRevenue: metrics.evRevenue.reduce((a, b) => a + b, 0) / metrics.evRevenue.length,
        evEbitda: metrics.evEbitda.reduce((a, b) => a + b, 0) / metrics.evEbitda.length,
        peRatio: metrics.peRatio.reduce((a, b) => a + b, 0) / metrics.peRatio.length,
        ebitdaMargin: metrics.ebitdaMargin.reduce((a, b) => a + b, 0) / metrics.ebitdaMargin.length,
      },
      median: {
        evRevenue: getMedian(metrics.evRevenue),
        evEbitda: getMedian(metrics.evEbitda),
        peRatio: getMedian(metrics.peRatio),
        ebitdaMargin: getMedian(metrics.ebitdaMargin),
      },
      min: {
        evRevenue: Math.min(...metrics.evRevenue),
        evEbitda: Math.min(...metrics.evEbitda),
        peRatio: Math.min(...metrics.peRatio),
        ebitdaMargin: Math.min(...metrics.ebitdaMargin),
      },
      max: {
        evRevenue: Math.max(...metrics.evRevenue),
        evEbitda: Math.max(...metrics.evEbitda),
        peRatio: Math.max(...metrics.peRatio),
        ebitdaMargin: Math.max(...metrics.ebitdaMargin),
      },
    }
  }

  const stats = calculateStats()

  // Define columns for OptimizedDataTable
  const columns: ColumnDef<ComparableCompany>[] = useMemo(
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
        accessorKey: 'industry',
        header: 'Industry',
        cell: ({ getValue }) => {
          const value = getValue() as string
          return value ? <Badge variant="outline">{value}</Badge> : '-'
        },
      },
      {
        accessorKey: 'marketCap',
        header: 'Market Cap',
        cell: ({ getValue }) => {
          const value = getValue() as number
          return value != null ? `$${(value / 1000).toFixed(0)}B` : '-'
        },
      },
      {
        accessorKey: 'revenue',
        header: 'Revenue',
        cell: ({ getValue }) => {
          const value = getValue() as number
          return value != null ? `$${(value / 1000).toFixed(0)}B` : '-'
        },
      },
      {
        accessorKey: 'ebitda',
        header: 'EBITDA',
        cell: ({ getValue }) => {
          const value = getValue() as number
          return value != null ? `$${(value / 1000).toFixed(0)}B` : '-'
        },
      },
      {
        accessorKey: 'evRevenue',
        header: 'EV/Revenue',
        cell: ({ getValue }) => {
          const value = getValue() as number
          return value != null ? `${value.toFixed(1)}x` : '-'
        },
      },
      {
        accessorKey: 'evEbitda',
        header: 'EV/EBITDA',
        cell: ({ getValue }) => {
          const value = getValue() as number
          return value != null ? `${value.toFixed(1)}x` : '-'
        },
      },
      {
        accessorKey: 'peRatio',
        header: 'P/E Ratio',
        cell: ({ getValue }) => {
          const value = getValue() as number
          return value != null ? `${value.toFixed(1)}x` : '-'
        },
      },
    ],
    []
  )

  const removeCompany = (id: string) => {
    setComparables((prev) => prev.filter((comp) => comp.id !== id))
  }

  const addNewCompany = () => {
    if (newCompany.ticker && newCompany.name) {
      const company: ComparableCompany = {
        id: Date.now().toString(),
        ticker: newCompany.ticker!,
        name: newCompany.name!,
        industry: newCompany.industry || 'Other',
        marketCap: newCompany.marketCap || 0,
        revenue: newCompany.revenue || 0,
        ebitda: newCompany.ebitda || 0,
        netIncome: newCompany.netIncome || 0,
        evRevenue:
          newCompany.marketCap && newCompany.revenue
            ? newCompany.marketCap / newCompany.revenue
            : 0,
        evEbitda:
          newCompany.marketCap && newCompany.ebitda ? newCompany.marketCap / newCompany.ebitda : 0,
        peRatio:
          newCompany.marketCap && newCompany.netIncome
            ? newCompany.marketCap / newCompany.netIncome
            : 0,
        revenueGrowth: 0,
        ebitdaMargin:
          newCompany.revenue && newCompany.ebitda
            ? (newCompany.ebitda / newCompany.revenue) * 100
            : 0,
        selected: false,
      }
      setComparables((prev) => [...prev, company])
      setNewCompany({})
      setShowAddDialog(false)
    }
  }

  const saveAssumptions = async () => {
    await updateAssumptions({
      publicComps: {
        companies: comparables,
        selectedMultiples: {
          evRevenue: stats.median.evRevenue,
          evEbitda: stats.median.evEbitda,
          peRatio: stats.median.peRatio,
        },
      },
    })
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Public Company Comparables</h1>
          <p className="text-muted-foreground">
            Analyze relative valuation multiples from similar public companies
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAlphaVantage(!showAlphaVantage)} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            {showAlphaVantage ? 'Hide Alpha Vantage' : 'Import from Alpha Vantage'}
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Company
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Comparable Company</DialogTitle>
                <DialogDescription>
                  Add a new public company to your comparables analysis
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Ticker Symbol</Label>
                  <Input
                    value={newCompany.ticker || ''}
                    onChange={(e) => setNewCompany({ ...newCompany, ticker: e.target.value })}
                    placeholder="AAPL"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Company Name</Label>
                  <Input
                    value={newCompany.name || ''}
                    onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                    placeholder="Apple Inc."
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Industry</Label>
                  <Select
                    value={newCompany.industry || ''}
                    onValueChange={(value) => setNewCompany({ ...newCompany, industry: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                      <SelectItem value="Financial">Financial</SelectItem>
                      <SelectItem value="Consumer">Consumer</SelectItem>
                      <SelectItem value="Industrial">Industrial</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Market Cap ($M)</Label>
                    <Input
                      type="number"
                      value={newCompany.marketCap || ''}
                      onChange={(e) =>
                        setNewCompany({ ...newCompany, marketCap: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Revenue ($M)</Label>
                    <Input
                      type="number"
                      value={newCompany.revenue || ''}
                      onChange={(e) =>
                        setNewCompany({ ...newCompany, revenue: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>EBITDA ($M)</Label>
                    <Input
                      type="number"
                      value={newCompany.ebitda || ''}
                      onChange={(e) =>
                        setNewCompany({ ...newCompany, ebitda: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Net Income ($M)</Label>
                    <Input
                      type="number"
                      value={newCompany.netIncome || ''}
                      onChange={(e) =>
                        setNewCompany({ ...newCompany, netIncome: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={addNewCompany}>Add Company</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={saveAssumptions} variant="default">
            Save Analysis
          </Button>
        </div>
      </div>

      {/* Alpha Vantage Integration */}
      {showAlphaVantage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Alpha Vantage Market Data
            </CardTitle>
            <CardDescription>
              Import peer companies and their fundamentals directly from Alpha Vantage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlphaVantageImport
              valuationId={valuationId}
              onImport={(companies) => {
                const newCompanies: ComparableCompany[] = companies.map((company) => ({
                  id: `av_${company.ticker}_${Date.now()}`,
                  ticker: company.ticker,
                  name: company.name,
                  industry: company.sector || 'Technology',
                  marketCap: company.marketCap / 1000000, // Convert to millions
                  revenue: company.revenue / 1000000,
                  ebitda: company.ebitda / 1000000,
                  netIncome: company.netIncome / 1000000,
                  evRevenue: company.evToRevenue || 0,
                  evEbitda: company.evToEbitda || 0,
                  peRatio: company.peRatio || 0,
                  revenueGrowth: 0, // Not provided by Alpha Vantage in basic call
                  ebitdaMargin: company.profitMargin || 0,
                  selected: false,
                }))

                // Avoid duplicates based on ticker
                const existingTickers = new Set(comparables.map((c) => c.ticker))
                const uniqueNewCompanies = newCompanies.filter(
                  (c) => !existingTickers.has(c.ticker)
                )

                setComparables((prev) => [...prev, ...uniqueNewCompanies])

                // Auto-select imported companies
                const newIds = new Set(selectedRows)
                uniqueNewCompanies.forEach((c) => newIds.add(c.id))
                setSelectedRows(newIds)

                toast.success(`Imported ${uniqueNewCompanies.length} companies from Alpha Vantage`)
                setShowAlphaVantage(false)
              }}
            />
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="comparables" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="comparables">Comparables Table</TabsTrigger>
          <TabsTrigger value="statistics">Statistical Analysis</TabsTrigger>
          <TabsTrigger value="visualization">Visualization</TabsTrigger>
        </TabsList>

        {/* Comparables Table */}
        <TabsContent value="comparables">
          <Card>
            <CardHeader>
              <CardTitle>Comparable Companies</CardTitle>
              <CardDescription>
                Select companies to include in your valuation analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OptimizedDataTable
                data={comparables}
                columns={columns}
                searchKey="name"
                enableRowSelection={true}
                selectedRows={selectedRows}
                onRowSelectionChange={(selection) => {
                  setSelectedRows(new Set(selection))
                }}
                getRowId={(row) => row.id}
                enableColumnFilters={true}
                enableSorting={true}
                enablePagination={true}
                pageSize={10}
                onRowDelete={(rowIds) => {
                  setComparables((prev) => prev.filter((c) => !rowIds.includes(c.id)))
                  const newSelected = new Set(selectedRows)
                  rowIds.forEach((id) => newSelected.delete(id))
                  setSelectedRows(newSelected)
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics">
          <div className="grid gap-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Statistics are calculated based on {selectedComps.length} selected companies
              </AlertDescription>
            </Alert>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {['evRevenue', 'evEbitda', 'peRatio', 'ebitdaMargin'].map((metric) => {
                const metricLabels = {
                  evRevenue: 'EV/Revenue',
                  evEbitda: 'EV/EBITDA',
                  peRatio: 'P/E Ratio',
                  ebitdaMargin: 'EBITDA Margin',
                }
                const metricKey = metric as keyof typeof stats.mean

                return (
                  <Card key={metric}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        {metricLabels[metricKey]}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Mean:</span>
                        <span className="font-medium">
                          {metric === 'ebitdaMargin'
                            ? `${stats.mean[metricKey].toFixed(1)}%`
                            : `${stats.mean[metricKey].toFixed(1)}x`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Median:</span>
                        <span className="font-medium text-primary">
                          {metric === 'ebitdaMargin'
                            ? `${stats.median[metricKey].toFixed(1)}%`
                            : `${stats.median[metricKey].toFixed(1)}x`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Min:</span>
                        <span className="font-medium">
                          {metric === 'ebitdaMargin'
                            ? `${stats.min[metricKey].toFixed(1)}%`
                            : `${stats.min[metricKey].toFixed(1)}x`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Max:</span>
                        <span className="font-medium">
                          {metric === 'ebitdaMargin'
                            ? `${stats.max[metricKey].toFixed(1)}%`
                            : `${stats.max[metricKey].toFixed(1)}x`}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Selected Multiples for Valuation</CardTitle>
                <CardDescription>
                  These median multiples will be applied to your subject company
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground">EV/Revenue Multiple</div>
                    <div className="text-2xl font-bold">{stats.median.evRevenue.toFixed(1)}x</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground">EV/EBITDA Multiple</div>
                    <div className="text-2xl font-bold">{stats.median.evEbitda.toFixed(1)}x</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground">P/E Multiple</div>
                    <div className="text-2xl font-bold">{stats.median.peRatio.toFixed(1)}x</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Visualization Tab */}
        <TabsContent value="visualization">
          <Card>
            <CardHeader>
              <CardTitle>Multiple Distribution</CardTitle>
              <CardDescription>
                Visual comparison of valuation multiples across selected companies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {selectedComps.map((comp) => (
                  <div key={comp.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{comp.ticker}</span>
                        <span className="text-sm text-muted-foreground">{comp.name}</span>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-20 text-sm text-muted-foreground">EV/Rev</span>
                        <div className="h-2 flex-1 rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-primary"
                            style={{ width: `${Math.min((comp.evRevenue / 30) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="w-12 text-right text-sm font-medium">
                          {comp.evRevenue.toFixed(1)}x
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-20 text-sm text-muted-foreground">EV/EBITDA</span>
                        <div className="h-2 flex-1 rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-green-600"
                            style={{ width: `${Math.min((comp.evEbitda / 40) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="w-12 text-right text-sm font-medium">
                          {comp.evEbitda.toFixed(1)}x
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-20 text-sm text-muted-foreground">P/E</span>
                        <div className="h-2 flex-1 rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-blue-600"
                            style={{ width: `${Math.min((comp.peRatio / 50) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="w-12 text-right text-sm font-medium">
                          {comp.peRatio.toFixed(1)}x
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
