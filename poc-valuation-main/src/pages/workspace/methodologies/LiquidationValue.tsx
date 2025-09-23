import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/layout/PageHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Percent, Plus, Minus, Banknote } from 'lucide-react'
import { toast } from 'sonner'

export default function LiquidationValue() {
  // Asset categories
  const [assets, setAssets] = useState([
    {
      id: 1,
      name: 'Cash & Cash Equivalents',
      bookValue: 1000000,
      liquidationPercentage: 100,
      liquidationValue: 1000000,
    },
    {
      id: 2,
      name: 'Short-term Investments',
      bookValue: 500000,
      liquidationPercentage: 95,
      liquidationValue: 475000,
    },
    {
      id: 3,
      name: 'Accounts Receivable',
      bookValue: 2000000,
      liquidationPercentage: 70,
      liquidationValue: 1400000,
    },
    {
      id: 4,
      name: 'Inventory',
      bookValue: 3000000,
      liquidationPercentage: 50,
      liquidationValue: 1500000,
    },
    {
      id: 5,
      name: 'Equipment & Machinery',
      bookValue: 5000000,
      liquidationPercentage: 40,
      liquidationValue: 2000000,
    },
    {
      id: 6,
      name: 'Real Estate',
      bookValue: 7000000,
      liquidationPercentage: 70,
      liquidationValue: 4900000,
    },
    {
      id: 7,
      name: 'Intellectual Property',
      bookValue: 2000000,
      liquidationPercentage: 30,
      liquidationValue: 600000,
    },
  ])

  // Liability categories
  const [liabilities, setLiabilities] = useState([
    {
      id: 1,
      name: 'Accounts Payable',
      amount: 1500000,
    },
    {
      id: 2,
      name: 'Short-term Debt',
      amount: 2000000,
    },
    {
      id: 3,
      name: 'Long-term Debt',
      amount: 6000000,
    },
    {
      id: 4,
      name: 'Accrued Expenses',
      amount: 800000,
    },
  ])

  // Liquidation expenses
  const [expenses, setExpenses] = useState([
    {
      id: 1,
      name: 'Legal & Professional Fees',
      amount: 400000,
    },
    {
      id: 2,
      name: 'Severance Payments',
      amount: 1200000,
    },
    {
      id: 3,
      name: 'Lease Termination Costs',
      amount: 500000,
    },
  ])

  const [newAssetName, setNewAssetName] = useState('')
  const [newAssetBookValue, setNewAssetBookValue] = useState<number | ''>('')
  const [newAssetLiquidationPercentage, setNewAssetLiquidationPercentage] = useState<number | ''>(
    50
  )

  const [newLiabilityName, setNewLiabilityName] = useState('')
  const [newLiabilityAmount, setNewLiabilityAmount] = useState<number | ''>('')

  const [newExpenseName, setNewExpenseName] = useState('')
  const [newExpenseAmount, setNewExpenseAmount] = useState<number | ''>('')

  // Summary calculations
  const totalAssetBookValue = assets.reduce((sum, asset) => sum + asset.bookValue, 0)
  const totalAssetLiquidationValue = assets.reduce((sum, asset) => sum + asset.liquidationValue, 0)
  const totalLiabilities = liabilities.reduce((sum, liability) => sum + liability.amount, 0)
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  const netLiquidationValue = totalAssetLiquidationValue - totalLiabilities - totalExpenses

  const handleUpdateAsset = (id: number, field: string, value: any) => {
    setAssets((prev) =>
      prev.map((asset) => {
        if (asset.id === id) {
          const updatedAsset = { ...asset, [field]: value }

          // Recalculate liquidation value if book value or percentage changes
          if (field === 'bookValue' || field === 'liquidationPercentage') {
            updatedAsset.liquidationValue =
              updatedAsset.bookValue * (updatedAsset.liquidationPercentage / 100)
          }

          return updatedAsset
        }
        return asset
      })
    )
  }

  const handleAddAsset = () => {
    if (newAssetName && newAssetBookValue !== '') {
      const bookValue = Number(newAssetBookValue)
      const liquidationPercentage = Number(newAssetLiquidationPercentage)
      const liquidationValue = bookValue * (liquidationPercentage / 100)

      const newAsset = {
        id: assets.length ? Math.max(...assets.map((a) => a.id)) + 1 : 1,
        name: newAssetName,
        bookValue,
        liquidationPercentage,
        liquidationValue,
      }

      setAssets((prev) => [...prev, newAsset])
      setNewAssetName('')
      setNewAssetBookValue('')
      setNewAssetLiquidationPercentage(50)

      toast.success('Asset added successfully')
    } else {
      toast.error('Please enter asset name and book value')
    }
  }

  const handleUpdateLiability = (id: number, field: string, value: any) => {
    setLiabilities((prev) =>
      prev.map((liability) => {
        if (liability.id === id) {
          return { ...liability, [field]: value }
        }
        return liability
      })
    )
  }

  const handleAddLiability = () => {
    if (newLiabilityName && newLiabilityAmount !== '') {
      const newLiability = {
        id: liabilities.length ? Math.max(...liabilities.map((a) => a.id)) + 1 : 1,
        name: newLiabilityName,
        amount: Number(newLiabilityAmount),
      }

      setLiabilities((prev) => [...prev, newLiability])
      setNewLiabilityName('')
      setNewLiabilityAmount('')

      toast.success('Liability added successfully')
    } else {
      toast.error('Please enter liability name and amount')
    }
  }

  const handleUpdateExpense = (id: number, field: string, value: any) => {
    setExpenses((prev) =>
      prev.map((expense) => {
        if (expense.id === id) {
          return { ...expense, [field]: value }
        }
        return expense
      })
    )
  }

  const handleAddExpense = () => {
    if (newExpenseName && newExpenseAmount !== '') {
      const newExpense = {
        id: expenses.length ? Math.max(...expenses.map((a) => a.id)) + 1 : 1,
        name: newExpenseName,
        amount: Number(newExpenseAmount),
      }

      setExpenses((prev) => [...prev, newExpense])
      setNewExpenseName('')
      setNewExpenseAmount('')

      toast.success('Liquidation expense added successfully')
    } else {
      toast.error('Please enter expense name and amount')
    }
  }

  const handleDeleteAsset = (id: number) => {
    setAssets((prev) => prev.filter((asset) => asset.id !== id))
    toast.success('Asset removed')
  }

  const handleDeleteLiability = (id: number) => {
    setLiabilities((prev) => prev.filter((liability) => liability.id !== id))
    toast.success('Liability removed')
  }

  const handleDeleteExpense = (id: number) => {
    setExpenses((prev) => prev.filter((expense) => expense.id !== id))
    toast.success('Expense removed')
  }

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(Math.round(num))
  }

  return (
    <div className="w-full">
      <PageHeader
        title="Liquidation Value Method"
        icon={<Banknote className="h-5 w-5" />}
        description="Evaluate a company based on the value of its assets in a liquidation scenario"
      />

      <div className="px-4 pb-4">
        <p className="mb-4 text-muted-foreground">
          The Liquidation Value Method estimates a company's value by calculating the proceeds that
          would be generated if all assets were sold and all liabilities settled in a liquidation
          scenario, after accounting for liquidation expenses.
        </p>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <Tabs defaultValue="assets" className="space-y-4">
          <TabsList>
            <TabsTrigger value="assets">Assets</TabsTrigger>
            <TabsTrigger value="liabilities">Liabilities</TabsTrigger>
            <TabsTrigger value="expenses">Liquidation Expenses</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="explanation">Methodology</TabsTrigger>
          </TabsList>

          <TabsContent value="assets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Asset Liquidation Values</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 text-left">Asset</th>
                        <th className="py-2 text-left">Book Value</th>
                        <th className="py-2 text-left">Liquidation %</th>
                        <th className="py-2 text-left">Liquidation Value</th>
                        <th className="py-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assets.map((asset) => (
                        <tr key={asset.id} className="border-b">
                          <td className="py-2">
                            <Input
                              value={asset.name}
                              onChange={(e) => handleUpdateAsset(asset.id, 'name', e.target.value)}
                              className="w-full"
                            />
                          </td>
                          <td className="py-2">
                            <Input
                              type="number"
                              value={asset.bookValue}
                              onChange={(e) =>
                                handleUpdateAsset(asset.id, 'bookValue', Number(e.target.value))
                              }
                              className="w-full"
                            />
                          </td>
                          <td className="py-2">
                            <div className="flex items-center">
                              <Input
                                type="number"
                                value={asset.liquidationPercentage}
                                onChange={(e) =>
                                  handleUpdateAsset(
                                    asset.id,
                                    'liquidationPercentage',
                                    Number(e.target.value)
                                  )
                                }
                                className="w-full"
                              />
                              <Percent className="ml-2 h-4 w-4" />
                            </div>
                          </td>
                          <td className="py-2">${formatNumber(asset.liquidationValue)}</td>
                          <td className="py-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteAsset(asset.id)}
                            >
                              <Minus className="h-4 w-4 text-red-500" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t">
                        <td className="py-2 font-medium">Totals</td>
                        <td className="py-2 font-medium">${formatNumber(totalAssetBookValue)}</td>
                        <td className="py-2 font-medium">
                          {totalAssetBookValue > 0
                            ? `${Math.round((totalAssetLiquidationValue / totalAssetBookValue) * 100)}%`
                            : '0%'}
                        </td>
                        <td className="py-2 font-medium">
                          ${formatNumber(totalAssetLiquidationValue)}
                        </td>
                        <td className="py-2"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="mt-4 border-t pt-4">
                  <h3 className="text-md mb-2 font-medium">Add New Asset</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <Label htmlFor="newAssetName">Asset Name</Label>
                      <Input
                        id="newAssetName"
                        value={newAssetName}
                        onChange={(e) => setNewAssetName(e.target.value)}
                        placeholder="Enter asset name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="newAssetBookValue">Book Value</Label>
                      <Input
                        id="newAssetBookValue"
                        type="number"
                        value={newAssetBookValue}
                        onChange={(e) =>
                          setNewAssetBookValue(e.target.value === '' ? '' : Number(e.target.value))
                        }
                        placeholder="Enter book value"
                      />
                    </div>
                    <div>
                      <Label htmlFor="newAssetLiquidationPercentage">Liquidation %</Label>
                      <div className="flex items-center">
                        <Input
                          id="newAssetLiquidationPercentage"
                          type="number"
                          value={newAssetLiquidationPercentage}
                          onChange={(e) =>
                            setNewAssetLiquidationPercentage(
                              e.target.value === '' ? '' : Number(e.target.value)
                            )
                          }
                          placeholder="Enter liquidation percentage"
                        />
                        <Percent className="ml-2 h-4 w-4" />
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleAddAsset} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" /> Add Asset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="liabilities" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Liabilities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 text-left">Liability</th>
                        <th className="py-2 text-left">Amount</th>
                        <th className="py-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {liabilities.map((liability) => (
                        <tr key={liability.id} className="border-b">
                          <td className="py-2">
                            <Input
                              value={liability.name}
                              onChange={(e) =>
                                handleUpdateLiability(liability.id, 'name', e.target.value)
                              }
                              className="w-full"
                            />
                          </td>
                          <td className="py-2">
                            <Input
                              type="number"
                              value={liability.amount}
                              onChange={(e) =>
                                handleUpdateLiability(
                                  liability.id,
                                  'amount',
                                  Number(e.target.value)
                                )
                              }
                              className="w-full"
                            />
                          </td>
                          <td className="py-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteLiability(liability.id)}
                            >
                              <Minus className="h-4 w-4 text-red-500" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t">
                        <td className="py-2 font-medium">Total Liabilities</td>
                        <td className="py-2 font-medium">${formatNumber(totalLiabilities)}</td>
                        <td className="py-2"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="mt-4 border-t pt-4">
                  <h3 className="text-md mb-2 font-medium">Add New Liability</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="newLiabilityName">Liability Name</Label>
                      <Input
                        id="newLiabilityName"
                        value={newLiabilityName}
                        onChange={(e) => setNewLiabilityName(e.target.value)}
                        placeholder="Enter liability name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="newLiabilityAmount">Amount</Label>
                      <Input
                        id="newLiabilityAmount"
                        type="number"
                        value={newLiabilityAmount}
                        onChange={(e) =>
                          setNewLiabilityAmount(e.target.value === '' ? '' : Number(e.target.value))
                        }
                        placeholder="Enter liability amount"
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddLiability} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" /> Add Liability
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Liquidation Expenses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 text-left">Expense</th>
                        <th className="py-2 text-left">Amount</th>
                        <th className="py-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map((expense) => (
                        <tr key={expense.id} className="border-b">
                          <td className="py-2">
                            <Input
                              value={expense.name}
                              onChange={(e) =>
                                handleUpdateExpense(expense.id, 'name', e.target.value)
                              }
                              className="w-full"
                            />
                          </td>
                          <td className="py-2">
                            <Input
                              type="number"
                              value={expense.amount}
                              onChange={(e) =>
                                handleUpdateExpense(expense.id, 'amount', Number(e.target.value))
                              }
                              className="w-full"
                            />
                          </td>
                          <td className="py-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteExpense(expense.id)}
                            >
                              <Minus className="h-4 w-4 text-red-500" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t">
                        <td className="py-2 font-medium">Total Expenses</td>
                        <td className="py-2 font-medium">${formatNumber(totalExpenses)}</td>
                        <td className="py-2"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="mt-4 border-t pt-4">
                  <h3 className="text-md mb-2 font-medium">Add New Liquidation Expense</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="newExpenseName">Expense Name</Label>
                      <Input
                        id="newExpenseName"
                        value={newExpenseName}
                        onChange={(e) => setNewExpenseName(e.target.value)}
                        placeholder="Enter expense name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="newExpenseAmount">Amount</Label>
                      <Input
                        id="newExpenseAmount"
                        type="number"
                        value={newExpenseAmount}
                        onChange={(e) =>
                          setNewExpenseAmount(e.target.value === '' ? '' : Number(e.target.value))
                        }
                        placeholder="Enter expense amount"
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddExpense} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" /> Add Expense
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="summary" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Liquidation Value Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2 font-medium">Total Asset Book Value</td>
                        <td className="py-2 text-right">${formatNumber(totalAssetBookValue)}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 font-medium">Total Asset Liquidation Value</td>
                        <td className="py-2 text-right">
                          ${formatNumber(totalAssetLiquidationValue)}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 font-medium">Discount from Book Value</td>
                        <td className="py-2 text-right">
                          {totalAssetBookValue > 0
                            ? `${Math.round(100 - (totalAssetLiquidationValue / totalAssetBookValue) * 100)}%`
                            : '0%'}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 font-medium">Less: Total Liabilities</td>
                        <td className="py-2 text-right">(${formatNumber(totalLiabilities)})</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 font-medium">Less: Total Liquidation Expenses</td>
                        <td className="py-2 text-right">(${formatNumber(totalExpenses)})</td>
                      </tr>
                      <tr className="border-t-2 border-t-black">
                        <td className="py-4 text-lg font-bold">Net Liquidation Value</td>
                        <td className="py-4 text-right text-lg font-bold">
                          ${formatNumber(netLiquidationValue)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div
                  className={`mt-6 p-4 ${netLiquidationValue >= 0 ? 'bg-green-50' : 'bg-red-50'} rounded-md`}
                >
                  <h3
                    className={`text-lg font-medium ${netLiquidationValue >= 0 ? 'text-green-700' : 'text-red-700'}`}
                  >
                    Analysis
                  </h3>
                  <p className="mt-2">
                    {netLiquidationValue > 0
                      ? `The company has a positive liquidation value of $${formatNumber(netLiquidationValue)}, meaning that after selling all assets at their estimated liquidation values and paying off all liabilities and liquidation expenses, there would be value remaining for equity holders.`
                      : `The company has a negative liquidation value of $${formatNumber(Math.abs(netLiquidationValue))}, meaning that the estimated liquidation values of assets would not be sufficient to cover all liabilities and liquidation expenses.`}
                  </p>
                  <p className="mt-2">
                    The liquidation value represents approximately{' '}
                    {Math.round((netLiquidationValue / totalAssetBookValue) * 100)}% of the total
                    book value of assets.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="explanation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>About Liquidation Value Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="mb-2 text-lg font-medium">
                    What is the Liquidation Value Method?
                  </h3>
                  <p>
                    The Liquidation Value Method estimates a company's value based on the proceeds
                    that would be generated if the business were to be dissolved, all assets sold,
                    and all liabilities settled. It represents the "floor value" of a company and is
                    often considered the minimum value a company should be worth.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-medium">Liquidation Value Formula</h3>
                  <p className="mb-2">The basic formula is:</p>
                  <p className="rounded bg-muted p-2 font-mono">
                    Liquidation Value = Asset Liquidation Values - Liabilities - Liquidation
                    Expenses
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-medium">Key Components</h3>
                  <ul className="list-disc space-y-1 pl-6">
                    <li>
                      <strong>Asset Liquidation Values:</strong> The estimated proceeds from selling
                      each asset in a liquidation scenario
                    </li>
                    <li>
                      <strong>Liabilities:</strong> All obligations that must be paid off
                    </li>
                    <li>
                      <strong>Liquidation Expenses:</strong> Costs associated with the liquidation
                      process (legal fees, employee severance, etc.)
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-medium">Types of Liquidation Value</h3>
                  <ul className="list-disc space-y-1 pl-6">
                    <li>
                      <strong>Orderly Liquidation Value:</strong> Assets are sold over a reasonable
                      time period to maximize value
                    </li>
                    <li>
                      <strong>Forced Liquidation Value:</strong> Assets are sold quickly, often at
                      auction, typically resulting in lower proceeds
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-medium">When to Use</h3>
                  <ul className="list-disc space-y-1 pl-6">
                    <li>Companies in financial distress or bankruptcy</li>
                    <li>As a "floor value" in other valuation approaches</li>
                    <li>Companies with significant tangible assets relative to earnings power</li>
                    <li>When considering a company for acquisition and potential restructuring</li>
                  </ul>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-medium">Limitations</h3>
                  <ul className="list-disc space-y-1 pl-6">
                    <li>Ignores going concern value and future earnings potential</li>
                    <li>
                      Difficult to accurately estimate liquidation values for specialized assets
                    </li>
                    <li>May significantly undervalue companies with valuable intangible assets</li>
                    <li>Does not account for time value of money during the liquidation process</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
