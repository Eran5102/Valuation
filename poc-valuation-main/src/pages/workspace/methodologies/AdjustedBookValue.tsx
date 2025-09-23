import { useState } from 'react'
import { FileChartColumn } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface BalanceSheetItem {
  id: string
  name: string
  bookValue: number
  adjustment: number
  marketValue: number
}

export default function AdjustedBookValue() {
  const [assets, setAssets] = useState<BalanceSheetItem[]>([
    {
      id: '1',
      name: 'Cash and Cash Equivalents',
      bookValue: 1000000,
      adjustment: 0,
      marketValue: 1000000,
    },
    {
      id: '2',
      name: 'Accounts Receivable',
      bookValue: 750000,
      adjustment: -50000,
      marketValue: 700000,
    },
    { id: '3', name: 'Inventory', bookValue: 500000, adjustment: -75000, marketValue: 425000 },
    {
      id: '4',
      name: 'Property, Plant & Equipment',
      bookValue: 2000000,
      adjustment: 500000,
      marketValue: 2500000,
    },
    {
      id: '5',
      name: 'Goodwill & Intangibles',
      bookValue: 300000,
      adjustment: -150000,
      marketValue: 150000,
    },
  ])

  const [liabilities, setLiabilities] = useState<BalanceSheetItem[]>([
    { id: '1', name: 'Accounts Payable', bookValue: 400000, adjustment: 0, marketValue: 400000 },
    { id: '2', name: 'Short-term Debt', bookValue: 250000, adjustment: 0, marketValue: 250000 },
    {
      id: '3',
      name: 'Long-term Debt',
      bookValue: 1000000,
      adjustment: -50000,
      marketValue: 950000,
    },
    { id: '4', name: 'Deferred Taxes', bookValue: 175000, adjustment: 25000, marketValue: 200000 },
  ])

  const totalBookAssets = assets.reduce((sum, item) => sum + item.bookValue, 0)
  const totalMarketAssets = assets.reduce((sum, item) => sum + item.marketValue, 0)
  const totalBookLiabilities = liabilities.reduce((sum, item) => sum + item.bookValue, 0)
  const totalMarketLiabilities = liabilities.reduce((sum, item) => sum + item.marketValue, 0)

  const bookEquity = totalBookAssets - totalBookLiabilities
  const adjustedEquity = totalMarketAssets - totalMarketLiabilities

  const handleAdjustmentChange = (id: string, value: number, isAsset: boolean) => {
    if (isAsset) {
      setAssets(
        assets.map((asset) => {
          if (asset.id === id) {
            return {
              ...asset,
              adjustment: value,
              marketValue: asset.bookValue + value,
            }
          }
          return asset
        })
      )
    } else {
      setLiabilities(
        liabilities.map((liability) => {
          if (liability.id === id) {
            return {
              ...liability,
              adjustment: value,
              marketValue: liability.bookValue + value,
            }
          }
          return liability
        })
      )
    }
  }

  return (
    <div className="w-full">
      <PageHeader
        title="Adjusted Book Value"
        icon={<FileChartColumn className="h-5 w-5" />}
        description="Analyze and adjust balance sheet items to determine the fair market value"
      />

      <div className="px-4">
        <p className="mb-4 text-muted-foreground">
          Adjust the company's book value by revaluing assets and liabilities to their current
          market values. This asset-based approach is particularly useful for asset-intensive
          businesses and investment holding companies.
        </p>

        <div className="mx-auto max-w-6xl space-y-6 py-4">
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Assets Adjustment</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead className="text-right">Book Value ($)</TableHead>
                  <TableHead className="text-right">Adjustment ($)</TableHead>
                  <TableHead className="text-right">Market Value ($)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell>{asset.name}</TableCell>
                    <TableCell className="text-right">{asset.bookValue.toLocaleString()}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={asset.adjustment}
                        onChange={(e) =>
                          handleAdjustmentChange(asset.id, Number(e.target.value), true)
                        }
                        className="ml-auto w-32 text-right"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      {asset.marketValue.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-medium">
                  <TableCell>Total Assets</TableCell>
                  <TableCell className="text-right">{totalBookAssets.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    {(totalMarketAssets - totalBookAssets).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">{totalMarketAssets.toLocaleString()}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Liabilities Adjustment</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Liability</TableHead>
                  <TableHead className="text-right">Book Value ($)</TableHead>
                  <TableHead className="text-right">Adjustment ($)</TableHead>
                  <TableHead className="text-right">Market Value ($)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {liabilities.map((liability) => (
                  <TableRow key={liability.id}>
                    <TableCell>{liability.name}</TableCell>
                    <TableCell className="text-right">
                      {liability.bookValue.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={liability.adjustment}
                        onChange={(e) =>
                          handleAdjustmentChange(liability.id, Number(e.target.value), false)
                        }
                        className="ml-auto w-32 text-right"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      {liability.marketValue.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-medium">
                  <TableCell>Total Liabilities</TableCell>
                  <TableCell className="text-right">
                    {totalBookLiabilities.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {(totalMarketLiabilities - totalBookLiabilities).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {totalMarketLiabilities.toLocaleString()}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>

          <Card className="bg-muted/30 p-6">
            <h2 className="mb-4 text-lg font-semibold">Equity Value Summary</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <h3 className="mb-2 font-medium">Book Value of Equity</h3>
                <p className="text-3xl font-bold">${bookEquity.toLocaleString()}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Total Book Assets - Total Book Liabilities
                </p>
              </div>

              <div>
                <h3 className="mb-2 font-medium">Adjusted Book Value of Equity</h3>
                <p className="text-3xl font-bold text-primary">
                  ${adjustedEquity.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Total Market Value Assets - Total Market Value Liabilities
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button variant="outline" className="mr-2">
                Reset
              </Button>
              <Button>Save Analysis</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
