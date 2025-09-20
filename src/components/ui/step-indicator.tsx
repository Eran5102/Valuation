import React from 'react'
import { LucideIcon, ChevronRight } from 'lucide-react'

interface Step {
  key: string
  label: string
  icon: LucideIcon
}

interface StepIndicatorProps {
  steps: Step[]
  currentStep: string
  completedSteps: string[]
}

export function StepIndicator({ steps, currentStep, completedSteps }: StepIndicatorProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-center space-x-4">
        {steps.map((stepInfo, index, array) => {
          const Icon = stepInfo.icon
          const isActive = currentStep === stepInfo.key
          const isCompleted = completedSteps.includes(stepInfo.key)

          return (
            <React.Fragment key={stepInfo.key}>
              <div
                className={`flex items-center space-x-2 rounded-lg px-4 py-2 transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : isCompleted
                      ? 'bg-green-100 text-green-800'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{stepInfo.label}</span>
              </div>
              {index < array.length - 1 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
