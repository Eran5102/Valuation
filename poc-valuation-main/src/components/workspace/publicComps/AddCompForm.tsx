import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Save } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AddItemForm, FormField } from '@/components/shared/AddItemForm'

interface CompanyData {
  ticker: string
  name: string
  date: string
  revenue: number
  ebitda: number
  ebit: number
  netIncome: number
  marketCap: number
  netDebt: number
  enterpriseValue: number
  evToRevenue: number
  evToEbitda: number
  evToEbit: number
  peRatio: number
  pToBookValue: number
  revenueGrowth: number
  ebitdaMargin: number
  source: string
  includeInStats: boolean
}

interface PeerGroup {
  id: string
  name: string
  tickers: string[]
}

interface AddCompFormProps {
  onAddComp: (comp: CompanyData) => void
  onSavePeerGroup: (name: string, tickers: string[]) => void
  onLoadPeerGroup: (groupId: string) => void
  peerGroups: PeerGroup[]
  comps: CompanyData[]
}

export function AddCompForm({
  onAddComp,
  onSavePeerGroup,
  onLoadPeerGroup,
  peerGroups,
  comps,
}: AddCompFormProps) {
  const [peerGroupName, setPeerGroupName] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)

  const handleAddComp = (data: { ticker: string }) => {
    if (!data.ticker) return

    // Mock data - in real implementation, this would fetch company data
    const newComp: CompanyData = {
      ticker: data.ticker.toUpperCase(),
      name: `${data.ticker.toUpperCase()} Corp`,
      date: new Date().toISOString().split('T')[0],
      revenue: 100000,
      ebitda: 25000,
      ebit: 20000,
      netIncome: 15000,
      marketCap: 250000,
      netDebt: 50000,
      enterpriseValue: 300000,
      evToRevenue: 3.0,
      evToEbitda: 12.0,
      evToEbit: 15.0,
      peRatio: 16.7,
      pToBookValue: 2.5,
      revenueGrowth: 8.5,
      ebitdaMargin: 25.0,
      source: 'Manual Input',
      includeInStats: true,
    }

    onAddComp(newComp)
  }

  const handleSavePeerGroup = () => {
    if (peerGroupName) {
      const tickers = comps.map((comp) => comp.ticker)
      onSavePeerGroup(peerGroupName, tickers)
      setPeerGroupName('')
      setShowSaveDialog(false)
    }
  }

  const compFields: FormField[] = [
    {
      name: 'ticker',
      label: 'Ticker Symbol',
      type: 'text',
      placeholder: 'Enter ticker symbol...',
      required: true,
    },
  ]

  const renderSecondaryButton = () => (
    <Button variant="outline" disabled className="flex-shrink-0">
      Get AI Peer Suggestions (Coming Soon)
    </Button>
  )

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <AddItemForm
            title="Add Companies"
            fields={compFields}
            onSubmit={handleAddComp}
            submitButtonText="Add Company"
            secondaryButton={renderSecondaryButton()}
            columnLayout={1}
          />
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">Peer Group Management</h3>
          <div className="flex flex-wrap gap-2">
            {showSaveDialog ? (
              <>
                <Input
                  placeholder="Peer group name..."
                  value={peerGroupName}
                  onChange={(e) => setPeerGroupName(e.target.value)}
                  className="w-[200px] flex-shrink-0"
                />
                <Button
                  onClick={handleSavePeerGroup}
                  disabled={!peerGroupName}
                  className="flex-shrink-0"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowSaveDialog(false)}
                  className="flex-shrink-0"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => setShowSaveDialog(true)} className="flex-shrink-0">
                  <Save className="mr-2 h-4 w-4" />
                  Save Current as Peer Group
                </Button>

                <Select onValueChange={(value) => onLoadPeerGroup(value)}>
                  <SelectTrigger className="w-[200px] flex-shrink-0">
                    <SelectValue placeholder="Load Saved Peer Group" />
                  </SelectTrigger>
                  <SelectContent>
                    {peerGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name} ({group.tickers.length} comps)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
