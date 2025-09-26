import React, { memo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Menu } from 'lucide-react'
import { TableHead, TableRow, TableCell } from '../table'
import { cn } from '@/lib/utils'

// Memoized draggable header component
export const DraggableColumnHeader = memo(function DraggableColumnHeader({
  column,
  children,
  isPinned = false,
}: {
  column: any
  children: React.ReactNode
  isPinned?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
    disabled: isPinned,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      className={cn('relative', isPinned ? 'bg-muted/50' : '', isDragging ? 'z-50' : '')}
      {...attributes}
    >
      <div className="flex w-full items-center space-x-1">
        {!isPinned && (
          <div
            {...listeners}
            className="flex-shrink-0 cursor-grab rounded p-1 hover:cursor-grabbing hover:bg-muted"
          >
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </TableHead>
  )
})

// Memoized draggable row component
export const DraggableTableRow = memo(function DraggableTableRow({
  row,
  index,
  children,
  className,
  ...props
}: {
  row: any
  index: number
  children: React.ReactNode
  className?: string
  [key: string]: any
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: index.toString(),
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn(className, isDragging ? 'z-50' : '')}
      {...attributes}
      {...props}
    >
      <TableCell className="w-8 p-2">
        <div
          {...listeners}
          className="flex cursor-grab items-center justify-center rounded p-1 hover:cursor-grabbing hover:bg-muted"
        >
          <Menu className="h-3 w-3 text-muted-foreground" />
        </div>
      </TableCell>
      {children}
    </TableRow>
  )
})