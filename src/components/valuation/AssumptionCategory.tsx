import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AssumptionCategory as AssumptionCategoryType, Assumption } from './ValuationAssumptions'
import { AssumptionInput } from './AssumptionInput'

interface AssumptionCategoryProps {
  category: AssumptionCategoryType
  isExpanded: boolean
  onToggle: (categoryId: string) => void
  onAssumptionChange: (categoryId: string, assumptionId: string, value: string | number) => void
  onAssumptionBlur?: () => void
  onGetAssumptionValue?: (assumptionId: string) => string | number
  searchQuery?: string
}

export function AssumptionCategory({
  category,
  isExpanded,
  onToggle,
  onAssumptionChange,
  onAssumptionBlur,
  onGetAssumptionValue,
}: AssumptionCategoryProps) {
  const Icon = category.icon || (() => null)

  return (
    <Card className="overflow-hidden">
      <CardHeader
        className="cursor-pointer transition-colors hover:bg-muted/50"
        onClick={() => onToggle(category.id)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-primary/10 p-2">
              {typeof Icon === 'function' ? <Icon className="h-5 w-5 text-primary" /> : null}
            </div>
            <div>
              <CardTitle className="text-lg">{category.name}</CardTitle>
              <CardDescription className="text-sm">
                {category.assumptions.filter((a) => a.value).length} / {category.assumptions.length}{' '}
                completed
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-sm text-muted-foreground">
              {Math.round(
                (category.assumptions.filter((a) => a.value).length / category.assumptions.length) *
                  100
              )}
              %
            </div>
            <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
              ▼
            </div>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {category.assumptions.map((assumption) => (
              <div key={assumption.id} className="space-y-1">
                <label className="block text-xs font-medium text-foreground">
                  {assumption.name}
                  {assumption.required && <span className="ml-1 text-destructive">*</span>}
                </label>
                <AssumptionInput
                  assumption={assumption}
                  categoryId={category.id}
                  onChange={onAssumptionChange}
                  onBlur={onAssumptionBlur}
                  onGetAssumptionValue={onGetAssumptionValue}
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
