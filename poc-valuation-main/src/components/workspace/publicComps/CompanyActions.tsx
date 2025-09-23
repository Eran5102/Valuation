import React from 'react'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

interface CompanyActionsProps {
  onRemove: () => void
}

export function CompanyActions({ onRemove }: CompanyActionsProps) {
  return (
    <Button variant="ghost" size="sm" onClick={onRemove}>
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
