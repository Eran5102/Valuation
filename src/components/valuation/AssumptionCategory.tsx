import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AssumptionCategory as AssumptionCategoryType, Assumption } from './ValuationAssumptions'
import { AssumptionInput } from './AssumptionInput'

interface AssumptionCategoryProps {
  category: AssumptionCategoryType
  isExpanded: boolean
  onToggle: (categoryId: string) => void
  onAssumptionChange: (categoryId: string, assumptionId: string, value: string | number) => void
}

export function AssumptionCategory({ 
  category, 
  isExpanded, 
  onToggle, 
  onAssumptionChange 
}: AssumptionCategoryProps) {
  const Icon = category.icon || (() => null)

  return (
    <Card className="overflow-hidden">
      <CardHeader 
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => onToggle(category.id)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              {typeof Icon === 'function' ? <Icon className="h-5 w-5 text-primary" /> : null}
            </div>
            <div>
              <CardTitle className="text-lg">{category.name}</CardTitle>
              <CardDescription className="text-sm">
                {category.assumptions.filter(a => a.value).length} / {category.assumptions.length} completed
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-sm text-muted-foreground">
              {Math.round((category.assumptions.filter(a => a.value).length / category.assumptions.length) * 100)}%
            </div>
            <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
              ▼
            </div>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {category.assumptions.map((assumption) => (
              <div key={assumption.id} className="space-y-1">
                <label className="block text-sm font-medium text-foreground">
                  {assumption.name}
                  {assumption.required && <span className="text-destructive ml-1">*</span>}
                </label>
                <AssumptionInput
                  assumption={assumption}
                  categoryId={category.id}
                  onChange={onAssumptionChange}
                />
                {assumption.description && (
                  <p className="text-xs text-muted-foreground">{assumption.description}</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}