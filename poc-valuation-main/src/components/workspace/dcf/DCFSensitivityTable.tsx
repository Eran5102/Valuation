import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/utils/formatters'

const unitOptions = [
  { value: 1, label: 'Dollars' },
  { value: 1000, label: 'Thousands' },
  { value: 1000000, label: 'Millions' },
  { value: 1000000000, label: 'Billions' },
]

interface SensitivityMatrix {
  wacc: number[]
  growth: number[]
  exitMultiple: number[]
  values: number[][]
}

interface DCFSensitivityTableProps {
  sensitivityMatrix: SensitivityMatrix
  baseValueIndices: { waccIdx: number; secondaryIdx: number }
  terminalValueMethod: string
  unitMultiplier: number
  currency: string
  exitMultipleMetric: string
}

export function DCFSensitivityTable({
  sensitivityMatrix,
  baseValueIndices,
  terminalValueMethod,
  unitMultiplier,
  currency,
  exitMultipleMetric,
}: DCFSensitivityTableProps) {
  return (
    <div className="overflow-auto rounded-md border">
      <Table className="min-w-[600px]">
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead className="border-r text-center font-semibold">
              EV in {unitOptions.find((o) => o.value === unitMultiplier)?.label || 'Millions'}
            </TableHead>
            {terminalValueMethod === 'PGM'
              ? sensitivityMatrix.growth.map((g, i) => (
                  <TableHead key={i} className="text-center font-semibold">
                    TGR: {g.toFixed(1)}%
                  </TableHead>
                ))
              : sensitivityMatrix.exitMultiple.map((e, i) => (
                  <TableHead key={i} className="text-center font-semibold">
                    {exitMultipleMetric}: {e.toFixed(1)}x
                  </TableHead>
                ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sensitivityMatrix.wacc.map((w, rowIndex) => (
            <TableRow key={rowIndex}>
              <TableCell className="border-r bg-muted/20 text-center font-medium">
                WACC: {w.toFixed(1)}%
              </TableCell>
              {sensitivityMatrix.values[rowIndex]?.map((value, colIndex) => {
                const isBaseCase =
                  rowIndex === baseValueIndices.waccIdx &&
                  colIndex === baseValueIndices.secondaryIdx

                return (
                  <TableCell
                    key={colIndex}
                    className={cn(
                      'text-center font-medium',
                      isBaseCase && 'border border-primary/30 bg-primary/10'
                    )}
                  >
                    {formatCurrency(value, { unitMultiplier, currency })}
                    {isBaseCase && (
                      <div className="mt-1 text-xs font-medium text-primary">Current</div>
                    )}
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
