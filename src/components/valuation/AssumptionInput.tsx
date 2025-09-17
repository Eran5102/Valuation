import React from 'react'
import { Percent } from 'lucide-react'
import { Assumption } from './ValuationAssumptions'
import { RiskFreeRateInput } from './RiskFreeRateInput'

interface AssumptionInputProps {
  assumption: Assumption
  categoryId: string
  onChange: (categoryId: string, assumptionId: string, value: string | number) => void
  onGetAssumptionValue?: (assumptionId: string) => string | number
}

export function AssumptionInput({ assumption, categoryId, onChange, onGetAssumptionValue }: AssumptionInputProps) {
  const baseClasses = "w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"

  // Special case for risk-free rate - use the specialized Treasury integration component
  if (assumption.id === 'risk_free_rate') {
    return (
      <RiskFreeRateInput
        assumption={assumption}
        categoryId={categoryId}
        onChange={onChange}
        onGetAssumptionValue={onGetAssumptionValue}
      />
    )
  }

  switch (assumption.type) {
    case 'select':
      return (
        <select
          value={assumption.value}
          onChange={(e) => onChange(categoryId, assumption.id, e.target.value)}
          className={baseClasses}
        >
          <option value="">Select...</option>
          {assumption.options?.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      )
    
    case 'percentage':
      return (
        <div className="relative">
          <input
            type="number"
            value={assumption.value}
            onChange={(e) => onChange(categoryId, assumption.id, e.target.value)}
            className={`${baseClasses} pr-8`}
            step="0.1"
            placeholder="0.0"
          />
          <Percent className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
      )
    
    case 'currency':
      return (
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
          <input
            type="number"
            value={assumption.value}
            onChange={(e) => onChange(categoryId, assumption.id, e.target.value)}
            className={`${baseClasses} pl-8`}
            placeholder="0"
          />
        </div>
      )
    
    case 'date':
      return (
        <input
          type="date"
          value={assumption.value}
          onChange={(e) => onChange(categoryId, assumption.id, e.target.value)}
          className={baseClasses}
        />
      )
    
    case 'number':
      return (
        <input
          type="number"
          value={assumption.value}
          onChange={(e) => onChange(categoryId, assumption.id, e.target.value)}
          className={baseClasses}
          step="0.01"
        />
      )
    
    default:
      return (
        <input
          type="text"
          value={assumption.value}
          onChange={(e) => onChange(categoryId, assumption.id, e.target.value)}
          className={baseClasses}
        />
      )
  }
}