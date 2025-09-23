import React from 'react'
import { Info } from 'lucide-react'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface InfoTooltipProps {
  text: string
  className?: string
  iconClassName?: string
}

export function InfoTooltip({ text, className, iconClassName }: InfoTooltipProps) {
  return (
    <Tooltip content={text}>
      <span className={cn('inline-flex items-center', className)}>
        <Info className={cn('h-4 w-4 cursor-help text-muted-foreground', iconClassName)} />
      </span>
    </Tooltip>
  )
}

// Helper for tooltip with label
export function LabelWithTooltip({
  label,
  tooltip,
  required,
  className,
}: {
  label: string
  tooltip: string
  required?: boolean
  className?: string
}) {
  return (
    <div className="flex items-center gap-1">
      <span>{label}</span>
      {required && <span className="text-accent">*</span>}
      <InfoTooltip text={tooltip} className="ml-1" />
    </div>
  )
}
