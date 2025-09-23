import { LayoutGrid, Table } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'

interface ViewToggleProps {
  view: 'grid' | 'table'
  onViewChange: (view: 'grid' | 'table') => void
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
      <Tooltip content="Grid view">
        <Button
          variant="ghost"
          size="icon"
          className={view === 'grid' ? 'bg-background shadow-sm' : ''}
          onClick={() => onViewChange('grid')}
          aria-label="Grid view"
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
      </Tooltip>

      <Tooltip content="Table view">
        <Button
          variant="ghost"
          size="icon"
          className={view === 'table' ? 'bg-background shadow-sm' : ''}
          onClick={() => onViewChange('table')}
          aria-label="Table view"
        >
          <Table className="h-4 w-4" />
        </Button>
      </Tooltip>
    </div>
  )
}
