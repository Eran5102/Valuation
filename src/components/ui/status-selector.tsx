import React, { useState } from 'react'
import { Check, ChevronDown, AlertCircle, CheckCircle, Clock, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn, getStatusColor } from '@/lib/utils'

interface StatusOption {
  value: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

interface StatusSelectorProps {
  currentStatus: string
  statusType: 'client' | 'valuation'
  onStatusChange: (newStatus: string) => Promise<void>
  disabled?: boolean
}

const clientStatusOptions: StatusOption[] = [
  {
    value: 'active',
    label: 'Active',
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800 border-green-300',
  },
  {
    value: 'inactive',
    label: 'Inactive',
    icon: AlertCircle,
    color: 'bg-gray-100 text-gray-800 border-gray-300',
  },
  {
    value: 'prospect',
    label: 'Prospect',
    icon: Eye,
    color: 'bg-primary/10 text-primary border-primary/30',
  },
]

const valuationStatusOptions: StatusOption[] = [
  {
    value: 'draft',
    label: 'Draft',
    icon: AlertCircle,
    color: 'bg-gray-100 text-gray-800 border-gray-300',
  },
  {
    value: 'in_progress',
    label: 'In Progress',
    icon: Clock,
    color: 'bg-primary/10 text-primary border-primary/30',
  },
  {
    value: 'review',
    label: 'Review',
    icon: Eye,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  {
    value: 'completed',
    label: 'Completed',
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800 border-green-300',
  },
]

export function StatusSelector({
  currentStatus,
  statusType,
  onStatusChange,
  disabled = false,
}: StatusSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const statusOptions = statusType === 'client' ? clientStatusOptions : valuationStatusOptions
  const currentOption = statusOptions.find((option) => option.value === currentStatus)

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus || isUpdating) return

    setIsUpdating(true)
    try {
      await onStatusChange(newStatus)
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to update status:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  if (!currentOption) {
    return <Badge variant="secondary">Unknown Status</Badge>
  }

  if (disabled) {
    return (
      <Badge className={getStatusColor(currentStatus)}>
        <currentOption.icon className="mr-1 h-3 w-3" />
        {currentOption.label}
      </Badge>
    )
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isUpdating}
        className={cn(
          'flex items-center space-x-2 border transition-colors',
          currentOption.color,
          isUpdating && 'cursor-not-allowed opacity-50'
        )}
      >
        <currentOption.icon className="h-3 w-3" />
        <span>{currentOption.label}</span>
        <ChevronDown className={cn('h-3 w-3 transition-transform', isOpen && 'rotate-180')} />
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 w-48 rounded-md border border-gray-200 bg-white shadow-lg">
            <div className="p-1">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStatusChange(option.value)}
                  disabled={isUpdating}
                  className={cn(
                    'flex w-full items-center space-x-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors',
                    'hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50',
                    option.value === currentStatus && 'bg-gray-50'
                  )}
                >
                  <option.icon className="h-3 w-3" />
                  <span className="flex-1">{option.label}</span>
                  {option.value === currentStatus && <Check className="h-3 w-3 text-primary" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
