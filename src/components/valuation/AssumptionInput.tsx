import React from 'react'
import { Percent } from 'lucide-react'
import { Assumption } from './ValuationAssumptions'
import { RiskFreeRateInput } from './RiskFreeRateInput'
import { VolatilityInput } from './VolatilityInput'
import { DatePicker } from '@/components/ui/date-picker'

interface AssumptionInputProps {
  assumption: Assumption
  categoryId: string
  onChange: (categoryId: string, assumptionId: string, value: string | number) => void
  onBlur?: () => void
  onGetAssumptionValue?: (assumptionId: string) => string | number
}

export function AssumptionInput({
  assumption,
  categoryId,
  onChange,
  onBlur,
  onGetAssumptionValue,
}: AssumptionInputProps) {
  const baseClasses =
    'w-full px-2 py-1.5 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring'

  // Special case for risk-free rate - use the specialized Treasury integration component
  if (assumption.id === 'risk_free_rate') {
    // Get valuation date and time to liquidity from other assumptions
    const valuationDate = onGetAssumptionValue?.('valuation_date') as string
    const timeToLiquidity = onGetAssumptionValue?.('time_to_liquidity')
      ? Number(onGetAssumptionValue('time_to_liquidity'))
      : undefined

    return (
      <RiskFreeRateInput
        assumption={assumption}
        categoryId={categoryId}
        onChange={onChange}
        onGetAssumptionValue={onGetAssumptionValue}
        valuationDate={valuationDate}
        timeToLiquidity={timeToLiquidity}
      />
    )
  }

  // Special case for equity volatility - use the specialized volatility input component
  if (assumption.id === 'equity_volatility') {
    // Get industry and time to liquidity from other assumptions
    const industry = onGetAssumptionValue?.('industry') as string
    const timeToLiquidity = onGetAssumptionValue?.('time_to_liquidity')
      ? Number(onGetAssumptionValue('time_to_liquidity'))
      : undefined

    return (
      <VolatilityInput
        assumption={assumption}
        categoryId={categoryId}
        onChange={onChange}
        onGetAssumptionValue={onGetAssumptionValue}
        industry={industry}
        timeToLiquidity={timeToLiquidity}
      />
    )
  }

  switch (assumption.type) {
    case 'select':
      return (
        <select
          value={assumption.value || ''}
          onChange={(e) => onChange(categoryId, assumption.id, e.target.value)}
          onBlur={onBlur}
          className={baseClasses}
        >
          <option value="">Select...</option>
          {assumption.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )

    case 'percentage':
      return (
        <div className="relative">
          <input
            type="number"
            value={assumption.value || ''}
            onChange={(e) => onChange(categoryId, assumption.id, e.target.value)}
            onBlur={onBlur}
            className={`${baseClasses} pr-8`}
            step="0.1"
            placeholder="0.0"
          />
          <Percent className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
        </div>
      )

    case 'currency':
      return (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 transform text-muted-foreground">
            $
          </span>
          <input
            type="number"
            value={assumption.value || ''}
            onChange={(e) => onChange(categoryId, assumption.id, e.target.value)}
            onBlur={onBlur}
            className={`${baseClasses} pl-8`}
            placeholder="0"
          />
        </div>
      )

    case 'date':
      return (
        <DatePicker
          value={assumption.value ? new Date(assumption.value as string) : undefined}
          onChange={(date) =>
            onChange(categoryId, assumption.id, date?.toISOString().split('T')[0] || '')
          }
          className={baseClasses}
          placeholder="Select date"
        />
      )

    case 'number':
      return (
        <input
          type="number"
          value={assumption.value || ''}
          onChange={(e) => onChange(categoryId, assumption.id, e.target.value)}
          onBlur={onBlur}
          className={baseClasses}
          step="0.01"
        />
      )

    case 'textarea':
      return (
        <textarea
          value={assumption.value || ''}
          onChange={(e) => onChange(categoryId, assumption.id, e.target.value)}
          onBlur={onBlur}
          className={`${baseClasses} min-h-[80px] resize-y`}
          rows={3}
          placeholder={
            assumption.id === 'stage_description'
              ? 'Select a stage to auto-populate or enter custom description'
              : ''
          }
        />
      )

    default:
      return (
        <input
          type="text"
          value={assumption.value || ''}
          onChange={(e) => onChange(categoryId, assumption.id, e.target.value)}
          onBlur={onBlur}
          className={baseClasses}
        />
      )
  }
}
