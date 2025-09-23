import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface Adjustment {
  id: string
  description: string
  lineItem: string
  amounts: { [year: string]: number }
  notes?: string
}

interface NormalizationAdjustmentsProps {
  years: string[]
  incomeStatementItems: Array<{ item: string; values: number[] }>
  balanceSheetItems: Array<{ item: string; values: number[] }>
  cashFlowItems: Array<{ item: string; values: number[] }>
}

export function NormalizationAdjustments({
  years,
  incomeStatementItems,
  balanceSheetItems,
  cashFlowItems,
}: NormalizationAdjustmentsProps) {
  const [adjustments, setAdjustments] = useState<Adjustment[]>([])
  const [showForm, setShowForm] = useState(false)
  const [currentAdjustment, setCurrentAdjustment] = useState<Partial<Adjustment>>({
    amounts: years.reduce((acc, year) => ({ ...acc, [year]: 0 }), {}),
  })

  // Combine all financial statement items for the dropdown
  const allLineItems = [
    ...incomeStatementItems.map((item) => item.item),
    ...balanceSheetItems.map((item) => item.item),
    ...cashFlowItems.map((item) => item.item),
  ]

  const handleAddAdjustment = () => {
    if (!currentAdjustment.description || !currentAdjustment.lineItem) return

    const newAdjustment: Adjustment = {
      id: crypto.randomUUID(),
      description: currentAdjustment.description || '',
      lineItem: currentAdjustment.lineItem || '',
      amounts: currentAdjustment.amounts || {},
      notes: currentAdjustment.notes,
    }

    setAdjustments([...adjustments, newAdjustment])
    setCurrentAdjustment({
      amounts: years.reduce((acc, year) => ({ ...acc, [year]: 0 }), {}),
    })
    setShowForm(false)
  }

  const handleDeleteAdjustment = (id: string) => {
    setAdjustments(adjustments.filter((adj) => adj.id !== id))
  }

  return (
    <Card className="mt-6 p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Normalization Adjustments</h3>
          <Button onClick={() => setShowForm(true)} className="space-x-2" variant="outline">
            <Plus className="h-4 w-4" />
            <span>Add Adjustment</span>
          </Button>
        </div>

        {showForm && (
          <div className="space-y-4 rounded-md border p-4">
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={currentAdjustment.description || ''}
                onChange={(e) =>
                  setCurrentAdjustment((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="e.g., Normalize owner's salary"
              />
            </div>

            <div className="space-y-2">
              <Label>Affected Line Item</Label>
              <Select
                onValueChange={(value) =>
                  setCurrentAdjustment((prev) => ({
                    ...prev,
                    lineItem: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select line item" />
                </SelectTrigger>
                <SelectContent>
                  {allLineItems.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Adjustment Amounts</Label>
              <div className="grid grid-cols-3 gap-4">
                {years.map((year) => (
                  <div key={year} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{year}</Label>
                    <Input
                      type="number"
                      value={currentAdjustment.amounts?.[year] || 0}
                      onChange={(e) =>
                        setCurrentAdjustment((prev) => ({
                          ...prev,
                          amounts: {
                            ...prev.amounts,
                            [year]: parseFloat(e.target.value) || 0,
                          },
                        }))
                      }
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                value={currentAdjustment.notes || ''}
                onChange={(e) =>
                  setCurrentAdjustment((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                placeholder="Add any additional context or explanation..."
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddAdjustment}>Save Adjustment</Button>
            </div>
          </div>
        )}

        {adjustments.length > 0 && (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Line Item</TableHead>
                  {years.map((year) => (
                    <TableHead key={year} className="text-right">
                      {year}
                    </TableHead>
                  ))}
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustments.map((adjustment) => (
                  <TableRow key={adjustment.id}>
                    <TableCell>{adjustment.description}</TableCell>
                    <TableCell>{adjustment.lineItem}</TableCell>
                    {years.map((year) => (
                      <TableCell key={year} className="text-right">
                        {adjustment.amounts[year]?.toLocaleString('en-US', {
                          style: 'currency',
                          currency: 'USD',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </TableCell>
                    ))}
                    <TableCell className="max-w-[200px] truncate">{adjustment.notes}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteAdjustment(adjustment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </Card>
  )
}
