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

interface ClientSelectorProps {
  label?: string
  value: string
  onChange: (value: string) => void
  clients: Array<{ id: string; name: string }>
  onAddNew: () => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

export function ClientSelector({
  label,
  value,
  onChange,
  clients,
  onAddNew,
  placeholder = 'Select client...',
  required = false,
  disabled = false,
  className,
}: ClientSelectorProps) {
  const [open, setOpen] = React.useState(false)

  const selectedClient = clients.find((client) => client.id === value)

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
            {selectedClient ? selectedClient.name : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search clients..." />
            <CommandList className="max-h-[300px]">
              <CommandEmpty>No client found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="add-new-client"
                  onSelect={() => {
                    setOpen(false)
                    onAddNew()
                  }}
                  className="font-medium"
                >
                  <Plus className="mr-2 h-4 w-4 text-[#74BD92]" />
                  Add New Client
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                {clients.map((client) => (
                  <CommandItem
                    key={client.id}
                    value={client.name.toLowerCase()}
                    onSelect={() => {
                      onChange(client.id)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === client.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {client.name}
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
