'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { Search, Copy, Check, Database, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { TemplateVariable } from '@/lib/templates/types'
import { fieldMappingService } from '@/lib/templates/fieldMappingService'

interface SimpleFieldPickerProps {
  useFieldMappings?: boolean
  onFieldSelect?: (variable: TemplateVariable) => void
  className?: string
}

export function SimpleFieldPicker({
  useFieldMappings = true,
  onFieldSelect,
  className,
}: SimpleFieldPickerProps) {
  const [mappedVariables, setMappedVariables] = useState<TemplateVariable[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  // Load mapped fields from the service
  useEffect(() => {
    if (useFieldMappings) {
      setIsLoading(true)
      try {
        const mappedFields = fieldMappingService.getMappedFieldsAsVariables()
        setMappedVariables(mappedFields)
      } catch (error) {
      } finally {
        setIsLoading(false)
      }
    }
  }, [useFieldMappings])

  // Group variables by category
  const categorizedVariables = useMemo(() => {
    const categories: Record<string, TemplateVariable[]> = {}

    mappedVariables.forEach((variable) => {
      const category = variable.category || 'Other'
      if (!categories[category]) {
        categories[category] = []
      }
      categories[category].push(variable)
    })

    // Sort categories and variables within each category
    const sortedCategories: Record<string, TemplateVariable[]> = {}
    Object.keys(categories)
      .sort()
      .forEach((key) => {
        sortedCategories[key] = categories[key].sort((a, b) => a.name.localeCompare(b.name))
      })

    return sortedCategories
  }, [mappedVariables])

  // Filter variables based on search
  const filteredCategories = useMemo(() => {
    if (!searchTerm) return categorizedVariables

    const filtered: Record<string, TemplateVariable[]> = {}
    Object.entries(categorizedVariables).forEach(([category, vars]) => {
      const filteredVars = vars.filter(
        (v) =>
          v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      if (filteredVars.length > 0) {
        filtered[category] = filteredVars
        // Auto-expand categories with search results
        setExpandedCategories((prev) => new Set([...prev, category]))
      }
    })
    return filtered
  }, [categorizedVariables, searchTerm])

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      return newSet
    })
  }

  const copyToClipboard = async (variable: TemplateVariable) => {
    const fieldReference = `{{${variable.id}}}`
    await navigator.clipboard.writeText(fieldReference)
    setCopiedField(variable.id)
    setTimeout(() => setCopiedField(null), 2000)
    onFieldSelect?.(variable)
  }

  const refreshFields = () => {
    setIsLoading(true)
    try {
      const mappedFields = fieldMappingService.getMappedFieldsAsVariables()
      setMappedVariables(mappedFields)
    } catch (error) {
      console.error('Failed to refresh fields:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      text: 'bg-blue-500/10 text-blue-600',
      number: 'bg-green-500/10 text-green-600',
      currency: 'bg-yellow-500/10 text-yellow-600',
      date: 'bg-purple-500/10 text-purple-600',
      percentage: 'bg-orange-500/10 text-orange-600',
      boolean: 'bg-pink-500/10 text-pink-600',
    }
    return colors[type] || 'bg-gray-500/10 text-gray-600'
  }

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Header */}
      <div className="border-b p-3">
        <div className="mb-2 flex items-center gap-2">
          <Database className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Data Fields</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={refreshFields}
            disabled={isLoading}
          >
            <RefreshCw className={cn('h-3 w-3', isLoading && 'animate-spin')} />
          </Button>
          <Badge variant="secondary" className="ml-auto text-xs">
            {mappedVariables.length}
          </Badge>
        </div>

        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search fields..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 pl-8"
          />
        </div>
      </div>

      {/* Categories and Fields */}
      <div className="flex-1 overflow-y-auto p-3">
        {Object.entries(filteredCategories).map(([category, vars]) => (
          <div key={category} className="mb-2">
            <button
              onClick={() => toggleCategory(category)}
              className="flex w-full items-center gap-2 rounded-md p-2 text-left transition-colors hover:bg-accent"
            >
              {expandedCategories.has(category) ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">{category}</span>
              <Badge variant="outline" className="ml-auto text-xs">
                {vars.length}
              </Badge>
            </button>

            {/* Fields - Simple show/hide based on expanded state */}
            {expandedCategories.has(category) && (
              <div className="ml-4 mt-1 space-y-1">
                {vars.map((variable) => (
                  <div
                    key={variable.id}
                    className="hover:bg-accent/50 group flex items-center gap-2 rounded-md p-2 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{variable.name}</span>
                        {variable.required && (
                          <Badge variant="destructive" className="px-1 py-0 text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2">
                        <code className="text-xs text-muted-foreground">
                          {`{{${variable.id}}}`}
                        </code>
                        <Badge
                          variant="secondary"
                          className={cn('px-1 py-0 text-xs', getTypeColor(variable.type))}
                        >
                          {variable.type}
                        </Badge>
                      </div>
                      {variable.description && (
                        <p className="mt-1 text-xs text-muted-foreground">{variable.description}</p>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => copyToClipboard(variable)}
                    >
                      {copiedField === variable.id ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {Object.keys(filteredCategories).length === 0 && (
          <div className="py-8 text-center text-muted-foreground">
            <Database className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p className="text-sm">No fields found</p>
            {searchTerm && <p className="mt-1 text-xs">Try adjusting your search</p>}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-muted/50 border-t p-3">
        <p className="text-xs text-muted-foreground">
          Click <Copy className="inline h-3 w-3" /> to copy field reference
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Use <code className="rounded bg-background px-1">{'{{field_id}}'}</code> in content
        </p>
      </div>
    </div>
  )
}
