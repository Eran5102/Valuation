'use client'

import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'

interface DropZoneProps {
  id: string
  sectionId: string
  index: number
  className?: string
  children?: React.ReactNode
  accepts?: string[]
}

export function DropZone({ id, sectionId, index, className, children, accepts = ['block', 'field'] }: DropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      sectionId,
      index,
      accepts,
    },
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'relative transition-all duration-200',
        isOver && 'before:absolute before:inset-0 before:bg-primary/10 before:rounded-lg before:border-2 before:border-primary before:border-dashed',
        className
      )}
    >
      {isOver && (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center">
          <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium shadow-lg">
            Drop here
          </div>
        </div>
      )}
      {children}
    </div>
  )
}