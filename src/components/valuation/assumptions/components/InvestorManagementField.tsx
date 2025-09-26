import React from 'react'
import { Plus, X } from 'lucide-react'
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
import { Investor } from '../types'

interface InvestorManagementFieldProps {
  field: {
    id: string
    name: string
    description?: string
  }
  keyInvestors: Investor[]
  addInvestor: () => void
  updateInvestor: (investorId: string, field: 'name' | 'type', value: string) => void
  removeInvestor: (investorId: string) => void
}

export function InvestorManagementField({
  field,
  keyInvestors,
  addInvestor,
  updateInvestor,
  removeInvestor,
}: InvestorManagementFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <Label>{field.name}</Label>
          {field.description && (
            <p className="text-xs text-muted-foreground">{field.description}</p>
          )}
        </div>
        <Button type="button" size="sm" variant="outline" onClick={addInvestor} className="gap-1">
          <Plus className="h-3 w-3" />
          Add Investor
        </Button>
      </div>
      <div className="space-y-2">
        {keyInvestors.map((investor) => (
          <div key={investor.id} className="flex items-start gap-2">
            <Input
              placeholder="Investor Name"
              value={investor.name}
              onChange={(e) => updateInvestor(investor.id, 'name', e.target.value)}
              className="flex-1"
            />
            <Select
              value={investor.type}
              onValueChange={(value) => updateInvestor(investor.id, 'type', value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VC">VC</SelectItem>
                <SelectItem value="Angel">Angel</SelectItem>
                <SelectItem value="Strategic">Strategic</SelectItem>
                <SelectItem value="PE">Private Equity</SelectItem>
                <SelectItem value="Family Office">Family Office</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => removeInvestor(investor.id)}
              className="h-9 w-9"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {keyInvestors.length === 0 && (
          <div className="py-2 text-sm text-muted-foreground">
            No investors added yet. Click "Add Investor" to start.
          </div>
        )}
      </div>
    </div>
  )
}