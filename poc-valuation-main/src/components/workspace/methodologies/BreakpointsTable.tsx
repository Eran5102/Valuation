import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Info } from 'lucide-react'
import { Tooltip } from '@/components/ui/tooltip'

export interface Breakpoint {
  id: number
  name: string
  type:
    | 'Liquidation Preference'
    | 'Pro Rata Distribution'
    | 'Option Exercise'
    | 'Cap Reached'
    | 'Conversion'
  from: number
  to: number
  participatingSecurities: Array<{
    name: string
    percentage: number
  }>
  shares: number
  color: string
}

interface BreakpointsTableProps {
  breakpoints: Breakpoint[]
  currentExitValue: number
  onRefresh?: () => void
}

export function BreakpointsTable({
  breakpoints,
  currentExitValue,
  onRefresh,
}: BreakpointsTableProps) {
  // Format numbers for display
  const formatNumber = (num: number): string => {
    if (num === 0) return '0'
    if (Math.abs(num) < 0.01) return '~0'
    if (num === Number.MAX_SAFE_INTEGER || num > 1e15) return '∞'

    return num.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  }

  const formatPercent = (num: number): string => {
    if (num === 0) return '0%'
    if (Math.abs(num) < 0.01) return '<0.01%'
    return `${num.toFixed(2)}%`
  }

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'Liquidation Preference':
        return 'bg-orange-500'
      case 'Pro Rata Distribution':
        return 'bg-green-500'
      case 'Option Exercise':
        return 'bg-blue-500'
      case 'Cap Reached':
        return 'bg-purple-500'
      case 'Conversion':
        return 'bg-pink-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          <span>Breakpoints Analysis</span>
        </CardTitle>
        <div className="flex items-center gap-3">
          <span className="text-sm">Current Exit Value: ${formatNumber(currentExitValue)}</span>
          {onRefresh && (
            <Button size="sm" variant="outline" onClick={onRefresh}>
              Refresh
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Color key */}
        <div className="mb-4 flex flex-wrap gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-orange-500"></span>
            <span>Liquidation Preference</span>
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-green-500"></span>
            <span>Pro-rata Distribution</span>
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-blue-500"></span>
            <span>Option Exercise</span>
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-purple-500"></span>
            <span>Participation Cap</span>
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-pink-500"></span>
            <span>Conversion</span>
          </Badge>
        </div>

        {/* Tabs for different views */}
        <div className="mb-4 border-b">
          <div className="flex">
            <button className="border-b-2 border-primary px-4 py-2 font-medium">Table</button>
            <button className="px-4 py-2 text-muted-foreground">Summary</button>
            <button className="px-4 py-2 text-muted-foreground">Chart</button>
          </div>
        </div>

        <div className="overflow-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  ID
                  <Tooltip content="Breakpoint ID">
                    <span className="ml-1 inline-flex">
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </span>
                  </Tooltip>
                </TableHead>
                <TableHead>
                  Breakpoint
                  <Tooltip content="Name of the breakpoint">
                    <span className="ml-1 inline-flex">
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </span>
                  </Tooltip>
                </TableHead>
                <TableHead>
                  Type
                  <Tooltip content="Type of breakpoint event">
                    <span className="ml-1 inline-flex">
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </span>
                  </Tooltip>
                </TableHead>
                <TableHead>
                  From ($)
                  <Tooltip content="Starting value for this breakpoint">
                    <span className="ml-1 inline-flex">
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </span>
                  </Tooltip>
                </TableHead>
                <TableHead>
                  To ($)
                  <Tooltip content="Ending value for this breakpoint">
                    <span className="ml-1 inline-flex">
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </span>
                  </Tooltip>
                </TableHead>
                <TableHead>
                  Participating Securities
                  <Tooltip content="Securities that participate in this breakpoint and their percentages">
                    <span className="ml-1 inline-flex">
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </span>
                  </Tooltip>
                </TableHead>
                <TableHead>
                  Shares
                  <Tooltip content="Total shares participating in this breakpoint">
                    <span className="ml-1 inline-flex">
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </span>
                  </Tooltip>
                </TableHead>
                <TableHead>Section RVPS</TableHead>
                <TableHead>Cumulative RVPS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {breakpoints.map((bp) => (
                <TableRow key={bp.id} className="border-l-4" style={{ borderLeftColor: bp.color }}>
                  <TableCell>{bp.id}</TableCell>
                  <TableCell>
                    {bp.name}
                    <Tooltip content={`Details about ${bp.name}`}>
                      <span className="ml-1 inline-flex">
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    {bp.type}
                    <Tooltip content={`Explanation of ${bp.type}`}>
                      <span className="ml-1 inline-flex">
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{formatNumber(bp.from)}</TableCell>
                  <TableCell>{formatNumber(bp.to)}</TableCell>
                  <TableCell>
                    {bp.participatingSecurities.map((sec, idx) => (
                      <div key={idx} className="mb-1 flex items-center gap-1">
                        <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
                        <span>
                          {sec.name} ({formatPercent(sec.percentage)})
                        </span>
                      </div>
                    ))}
                  </TableCell>
                  <TableCell>{formatNumber(bp.shares)}</TableCell>
                  <TableCell>
                    <Button variant="link" size="sm" className="h-auto p-0 text-primary">
                      View Section RVPS
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button variant="link" size="sm" className="h-auto p-0 text-primary">
                      View Cumulative RVPS
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
