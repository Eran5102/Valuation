import { Circle, CircleCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepIndicatorProps {
  steps: readonly string[] | string[]
  currentStep: number
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="mb-8 flex items-center justify-center">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center">
          <div className="flex flex-col items-center">
            {index + 1 <= currentStep ? (
              <CircleCheck className="text-teal h-8 w-8" />
            ) : (
              <Circle className="h-8 w-8 text-muted-foreground" />
            )}
            <span className="mt-1 text-xs text-muted-foreground">{step}</span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn('mx-2 h-0.5 w-12', index + 1 <= currentStep ? 'bg-teal' : 'bg-muted')}
            />
          )}
        </div>
      ))}
    </div>
  )
}
