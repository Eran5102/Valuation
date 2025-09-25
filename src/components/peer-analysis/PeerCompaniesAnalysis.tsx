'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Building2,
  TrendingUp,
  RefreshCw,
  Search,
  AlertCircle,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CompanyFundamentals {
  ticker: string
  name: string
  sector: string
  industry: string
  marketCap: number
  enterpriseValue: number
  revenue: number
  ebitda: number
  netIncome: number
  totalDebt: number
  totalEquity: number
  sharesOutstanding: number
  currentPrice: number
  beta?: number
  peRatio?: number
  evToRevenue?: number
  evToEbitda?: number
  debtToEquity?: number
  profitMargin?: number
  returnOnEquity?: number
}

interface PeerCompaniesAnalysisProps {
  valuationId: string
  onBetaSelect?: (beta: number, source: string) => void
}

export function PeerCompaniesAnalysis({ valuationId, onBetaSelect }: PeerCompaniesAnalysisProps) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<{
    ticker: string
    targetCompany: CompanyFundamentals | null
    peers: CompanyFundamentals[]
    industryBeta: {
      simpleAverage: number
      weightedAverage: number
      median: number
    } | null
    industryAverages: any
  } | null>(null)
  const [customTickers, setCustomTickers] = useState('')
  const [sortField, setSortField] = useState<keyof CompanyFundamentals>('marketCap')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [selectedPeers, setSelectedPeers] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchPeerData()
  }, [valuationId])

  const fetchPeerData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/valuations/${valuationId}/peer-beta`)
      const result = await response.json()

      if (response.ok) {
        setData(result)
        // Auto-select all peers initially
        if (result.peers) {
          setSelectedPeers(new Set(result.peers.map((p: CompanyFundamentals) => p.ticker)))
        }
      }
    } catch (error) {
      console.error('Error fetching peer data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCustomPeersUpdate = async () => {
    if (!customTickers.trim()) return

    setLoading(true)
    try {
      const tickers = customTickers.split(',').map((t) => t.trim().toUpperCase())
      const response = await fetch(`/api/valuations/${valuationId}/peer-beta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customPeers: tickers }),
      })

      if (response.ok) {
        await fetchPeerData()
        setCustomTickers('')
      }
    } catch (error) {
      console.error('Error updating peers:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1e9) {
      return `$${(value / 1e9).toFixed(2)}B`
    } else if (Math.abs(value) >= 1e6) {
      return `$${(value / 1e6).toFixed(1)}M`
    }
    return `$${value.toFixed(0)}`
  }

  const formatMetric = (value: number | undefined, decimals: number = 2) => {
    if (value === undefined || isNaN(value)) return '-'
    return value.toFixed(decimals)
  }

  const handleSort = (field: keyof CompanyFundamentals) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const sortedPeers = data?.peers
    ? [...data.peers].sort((a, b) => {
        const aValue = a[sortField] ?? 0
        const bValue = b[sortField] ?? 0
        return sortDirection === 'asc' ? (aValue > bValue ? 1 : -1) : aValue < bValue ? 1 : -1
      })
    : []

  const calculateSelectedBeta = () => {
    if (!data?.peers || selectedPeers.size === 0) return null

    const selectedCompanies = data.peers.filter((p) => selectedPeers.has(p.ticker) && p.beta)
    if (selectedCompanies.length === 0) return null

    const totalMarketCap = selectedCompanies.reduce((sum, p) => sum + p.marketCap, 0)
    const weightedBeta = selectedCompanies.reduce((sum, p) => {
      return sum + p.beta! * (p.marketCap / totalMarketCap)
    }, 0)

    return weightedBeta
  }

  const SortIcon = ({ field }: { field: keyof CompanyFundamentals }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Peer Companies Analysis
          </CardTitle>
          <CardDescription>
            Compare with industry peers to derive beta and valuation multiples
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Custom Peers Input */}
          <div className="mb-6 flex gap-2">
            <div className="flex-1">
              <Label htmlFor="custom-peers">Add Custom Peer Companies</Label>
              <div className="mt-1 flex gap-2">
                <Input
                  id="custom-peers"
                  placeholder="Enter ticker symbols separated by commas (e.g., AAPL, MSFT, GOOGL)"
                  value={customTickers}
                  onChange={(e) => setCustomTickers(e.target.value)}
                />
                <Button
                  onClick={handleCustomPeersUpdate}
                  disabled={loading || !customTickers.trim()}
                  size="sm"
                >
                  <Search className="mr-1 h-4 w-4" />
                  Search
                </Button>
              </div>
            </div>
            <Button
              onClick={fetchPeerData}
              disabled={loading}
              variant="outline"
              size="sm"
              className="mt-6"
            >
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            </Button>
          </div>

          {/* Target Company Summary */}
          {data?.targetCompany && (
            <div className="mb-6 rounded-lg bg-muted p-4">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    {data.targetCompany.ticker} - {data.targetCompany.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {data.targetCompany.sector} • {data.targetCompany.industry}
                  </p>
                </div>
                {data.targetCompany.beta && (
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Company Beta</div>
                    <div className="text-2xl font-bold">
                      {formatMetric(data.targetCompany.beta)}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        onBetaSelect?.(data.targetCompany!.beta!, 'Company Historical')
                      }
                    >
                      Use This Beta
                    </Button>
                  </div>
                )}
              </div>
              <div className="mt-4 grid grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Market Cap</div>
                  <div className="font-semibold">
                    {formatCurrency(data.targetCompany.marketCap)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">EV/Revenue</div>
                  <div className="font-semibold">
                    {formatMetric(data.targetCompany.evToRevenue, 1)}x
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">EV/EBITDA</div>
                  <div className="font-semibold">
                    {formatMetric(data.targetCompany.evToEbitda, 1)}x
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">P/E Ratio</div>
                  <div className="font-semibold">
                    {formatMetric(data.targetCompany.peRatio, 1)}x
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs for different views */}
          <Tabs defaultValue="peers" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="peers">Peer Companies</TabsTrigger>
              <TabsTrigger value="beta">Beta Analysis</TabsTrigger>
              <TabsTrigger value="multiples">Valuation Multiples</TabsTrigger>
            </TabsList>

            <TabsContent value="peers" className="mt-4">
              {loading ? (
                <div className="flex h-64 items-center justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : sortedPeers.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <input
                            type="checkbox"
                            checked={selectedPeers.size === sortedPeers.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPeers(new Set(sortedPeers.map((p) => p.ticker)))
                              } else {
                                setSelectedPeers(new Set())
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('beta')}>
                          <div className="flex items-center gap-1">
                            Beta <SortIcon field="beta" />
                          </div>
                        </TableHead>
                        <TableHead
                          className="cursor-pointer"
                          onClick={() => handleSort('debtToEquity')}
                        >
                          <div className="flex items-center gap-1">
                            D/E Ratio <SortIcon field="debtToEquity" />
                          </div>
                        </TableHead>
                        <TableHead
                          className="cursor-pointer"
                          onClick={() => handleSort('totalDebt')}
                        >
                          <div className="flex items-center gap-1">
                            Total Debt <SortIcon field="totalDebt" />
                          </div>
                        </TableHead>
                        <TableHead
                          className="cursor-pointer"
                          onClick={() => handleSort('totalEquity')}
                        >
                          <div className="flex items-center gap-1">
                            Total Equity <SortIcon field="totalEquity" />
                          </div>
                        </TableHead>
                        <TableHead
                          className="cursor-pointer"
                          onClick={() => handleSort('marketCap')}
                        >
                          <div className="flex items-center gap-1">
                            Market Cap <SortIcon field="marketCap" />
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedPeers.map((peer) => (
                        <TableRow key={peer.ticker}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedPeers.has(peer.ticker)}
                              onChange={(e) => {
                                const newSelected = new Set(selectedPeers)
                                if (e.target.checked) {
                                  newSelected.add(peer.ticker)
                                } else {
                                  newSelected.delete(peer.ticker)
                                }
                                setSelectedPeers(newSelected)
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{peer.ticker}</div>
                              <div className="text-xs text-muted-foreground">{peer.name}</div>
                            </div>
                          </TableCell>
                          <TableCell>{formatMetric(peer.beta)}</TableCell>
                          <TableCell>{formatMetric(peer.debtToEquity, 2)}</TableCell>
                          <TableCell>{formatCurrency(peer.totalDebt)}</TableCell>
                          <TableCell>{formatCurrency(peer.totalEquity)}</TableCell>
                          <TableCell>{formatCurrency(peer.marketCap)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
                  <AlertCircle className="mb-4 h-12 w-12" />
                  <p>No peer companies found</p>
                  <p className="mt-2 text-sm">Try adding custom tickers above</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="beta" className="mt-4">
              <div className="space-y-4">
                {data?.industryBeta && (
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Simple Average</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatMetric(data.industryBeta.simpleAverage)}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 w-full"
                          onClick={() =>
                            onBetaSelect?.(data.industryBeta!.simpleAverage, 'Industry Average')
                          }
                        >
                          Use This Beta
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Weighted Average</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatMetric(data.industryBeta.weightedAverage)}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 w-full"
                          onClick={() =>
                            onBetaSelect?.(data.industryBeta!.weightedAverage, 'Industry Weighted')
                          }
                        >
                          Use This Beta
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Median</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatMetric(data.industryBeta.median)}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 w-full"
                          onClick={() =>
                            onBetaSelect?.(data.industryBeta!.median, 'Industry Median')
                          }
                        >
                          Use This Beta
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {selectedPeers.size > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Selected Peers Beta</CardTitle>
                      <CardDescription>
                        Market cap weighted average of {selectedPeers.size} selected companies
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatMetric(calculateSelectedBeta() || 0)}
                      </div>
                      {calculateSelectedBeta() && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2"
                          onClick={() => onBetaSelect?.(calculateSelectedBeta()!, 'Selected Peers')}
                        >
                          Use This Beta
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="multiples" className="mt-4">
              <div className="space-y-4">
                {data?.industryAverages && (
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Industry Average Multiples</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">P/E Ratio</span>
                            <span className="font-semibold">
                              {formatMetric(data.industryAverages.peRatio, 1)}x
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">EV/Revenue</span>
                            <span className="font-semibold">
                              {formatMetric(data.industryAverages.evToRevenue, 1)}x
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">EV/EBITDA</span>
                            <span className="font-semibold">
                              {formatMetric(data.industryAverages.evToEbitda, 1)}x
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Debt/Equity</span>
                            <span className="font-semibold">
                              {formatMetric(data.industryAverages.debtToEquity, 2)}x
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Profitability Metrics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Profit Margin</span>
                            <span className="font-semibold">
                              {formatMetric(data.industryAverages.profitMargin, 1)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">ROE</span>
                            <span className="font-semibold">
                              {formatMetric(data.industryAverages.returnOnEquity, 1)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Beta</span>
                            <span className="font-semibold">
                              {formatMetric(data.industryAverages.beta, 2)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
