'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export interface SelectorOption {
  value: string
  label: string
  icon?: React.ReactNode
}

interface GenericSelectorProps {
  label?: string
  value: string
  onChange: (value: string) => void
  options: SelectorOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  required?: boolean
  disabled?: boolean
  className?: string
  showSearch?: boolean
  maxHeight?: string
  onAddNew?: () => void
  addNewLabel?: string
}

export function GenericSelector({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No option found.',
  required = false,
  disabled = false,
  className,
  showSearch = true,
  maxHeight = '300px',
  onAddNew,
  addNewLabel = 'Add New',
}: GenericSelectorProps) {
  const [open, setOpen] = React.useState(false)

  const selectedOption = options.find((option) => option.value === value)

  return (
    <div className={className}>
      {label && (
        <label className="mb-1 block text-sm font-medium text-card-foreground">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between font-normal"
          >
            {selectedOption ? (
              <span className="flex items-center gap-2">
                {selectedOption.icon}
                {selectedOption.label}
              </span>
            ) : (
              placeholder
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            {showSearch && <CommandInput placeholder={searchPlaceholder} />}
            <CommandList style={{ maxHeight }}>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              {onAddNew && (
                <>
                  <CommandGroup>
                    <CommandItem
                      value="add-new-item"
                      onSelect={() => {
                        setOpen(false)
                        onAddNew()
                      }}
                      className="font-medium"
                    >
                      <Plus className="mr-2 h-4 w-4 text-[#74BD92]" />
                      {addNewLabel}
                    </CommandItem>
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label.toLowerCase()}
                    onSelect={() => {
                      onChange(option.value)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === option.value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {option.icon && <span className="mr-2">{option.icon}</span>}
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
