'use client'

import React, { useState, useMemo } from 'react'
import { Search, Variable, Copy, ChevronDown, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { TemplateVariable } from '@/lib/templates/types'

interface VariablePickerProps {
  variables: TemplateVariable[]
  onVariableSelect: (variable: TemplateVariable) => void
  compact?: boolean
}

export function VariablePicker({
  variables,
  onVariableSelect,
  compact = false,
}: VariablePickerProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['Company', 'Valuation'])
  )

  // Group variables by category
  const groupedVariables = useMemo(() => {
    const filtered = variables.filter(
      (variable) =>
        variable.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        variable.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        variable.category?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const grouped = filtered.reduce(
      (acc, variable) => {
        const category = variable.category || 'Other'
        if (!acc[category]) {
          acc[category] = []
        }
        acc[category].push(variable)
        return acc
      },
      {} as Record<string, TemplateVariable[]>
    )

    return grouped
  }, [variables, searchTerm])

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  const handleVariableClick = (variable: TemplateVariable) => {
    onVariableSelect(variable)

    // Copy to clipboard
    const placeholder = `{{${variable.id}}}`
    navigator.clipboard.writeText(placeholder).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = placeholder
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    })
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'currency':
        return 'bg-green-100 text-green-800'
      case 'percentage':
        return 'bg-blue-100 text-blue-800'
      case 'date':
        return 'bg-purple-100 text-purple-800'
      case 'number':
        return 'bg-orange-100 text-orange-800'
      case 'boolean':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
          <Input
            placeholder="Search variables..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 pl-8"
          />
        </div>
        <div className="max-h-32 space-y-1 overflow-y-auto">
          {variables.slice(0, 10).map((variable) => (
            <Button
              key={variable.id}
              variant="ghost"
              size="sm"
              onClick={() => handleVariableClick(variable)}
              className="h-6 w-full justify-start px-2 text-xs"
            >
              <Variable className="mr-1 h-3 w-3" />
              {variable.name}
            </Button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-base">
          <Variable className="mr-2 h-4 w-4" />
          Variables
        </CardTitle>
        <p className="text-xs text-muted-foreground">Click to copy variable placeholders</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
          <Input
            placeholder="Search variables..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Variable Categories */}
        <div className="max-h-96 space-y-2 overflow-y-auto">
          {Object.entries(groupedVariables).map(([category, categoryVariables]) => (
            <Collapsible
              key={category}
              open={expandedCategories.has(category)}
              onOpenChange={() => toggleCategory(category)}
            >
              <CollapsibleTrigger className="flex h-8 w-full items-center justify-between rounded bg-transparent px-2 text-sm font-medium transition-colors hover:bg-accent">
                <span>{category}</span>
                <div className="flex items-center gap-1">
                  <Badge variant="secondary" className="text-xs">
                    {categoryVariables.length}
                  </Badge>
                  {expandedCategories.has(category) ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent className="ml-2 space-y-1">
                {categoryVariables.map((variable) => (
                  <div
                    key={variable.id}
                    className="group flex cursor-pointer items-center justify-between rounded border p-2 transition-colors hover:bg-accent/50"
                    onClick={() => handleVariableClick(variable)}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="line-clamp-1 text-sm font-medium">{variable.name}</span>
                        {variable.required && (
                          <Badge variant="destructive" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs ${getTypeColor(variable.type)}`}>
                          {variable.type}
                        </Badge>
                        <code className="rounded bg-muted px-1 text-xs text-muted-foreground">
                          {`{{${variable.id}}}`}
                        </code>
                      </div>

                      {variable.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {variable.description}
                        </p>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="border-t border-border pt-2">
          <div className="text-xs text-muted-foreground">
            {variables.length} total variables • {variables.filter((v) => v.required).length}{' '}
            required
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
