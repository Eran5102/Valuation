import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SaveButton, DeleteButton } from '@/components/ui/action-buttons'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { AlertTriangle, Info, CheckCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// Confirmation Dialog
interface ConfirmDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
  variant?: 'default' | 'destructive' | 'warning'
  loading?: boolean
  trigger?: React.ReactNode
}

export function ConfirmDialog({
  open: controlledOpen,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'default',
  loading = false,
  trigger,
}: ConfirmDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const isOpen = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen
  const setOpen = onOpenChange || setUncontrolledOpen

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await onConfirm()
      setOpen(false)
    } catch (error) {
      console.error('Confirmation error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    onCancel?.()
    setOpen(false)
  }

  const variantConfig = {
    default: {
      icon: CheckCircle,
      iconColor: 'text-primary',
    },
    destructive: {
      icon: AlertTriangle,
      iconColor: 'text-destructive',
    },
    warning: {
      icon: Info,
      iconColor: 'text-warning',
    },
  }

  const config = variantConfig[variant]
  const Icon = config.icon

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={cn('h-5 w-5', config.iconColor)} />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={loading || isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={loading || isLoading}
          >
            {loading || isLoading ? (
              <>
                <LoadingSpinner size="xs" className="mr-2" />
                Processing...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Delete Confirmation Dialog
interface DeleteConfirmDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  itemName: string
  itemType?: string
  onDelete: () => void | Promise<void>
  loading?: boolean
  trigger?: React.ReactNode
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  itemName,
  itemType = 'item',
  onDelete,
  loading,
  trigger,
}: DeleteConfirmDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Delete ${itemType}?`}
      description={`Are you sure you want to delete "${itemName}"? This action cannot be undone.`}
      confirmText="Delete"
      cancelText="Cancel"
      onConfirm={onDelete}
      variant="destructive"
      loading={loading}
      trigger={trigger}
    />
  )
}

// Information Dialog
interface InfoDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title: string
  description?: string
  content?: React.ReactNode
  trigger?: React.ReactNode
}

export function InfoDialog({
  open,
  onOpenChange,
  title,
  description,
  content,
  trigger,
}: InfoDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isOpen = open !== undefined ? open : uncontrolledOpen
  const setOpen = onOpenChange || setUncontrolledOpen

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {content && <div className="py-4">{content}</div>}
        <DialogFooter>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Form Dialog
interface FormDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  onSubmit: (data?: any) => void | Promise<void>
  onCancel?: () => void
  submitText?: string
  cancelText?: string
  loading?: boolean
  trigger?: React.ReactNode
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  onCancel,
  submitText = 'Save',
  cancelText = 'Cancel',
  loading,
  trigger,
}: FormDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const isOpen = open !== undefined ? open : uncontrolledOpen
  const setOpen = onOpenChange || setUncontrolledOpen

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await onSubmit()
      setOpen(false)
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    onCancel?.()
    setOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          <div className="py-4">{children}</div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading || isLoading}
            >
              {cancelText}
            </Button>
            <SaveButton loading={loading || isLoading}>{submitText}</SaveButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Alert Dialog (non-dismissable important info)
interface AlertDialogProps {
  open: boolean
  title: string
  description: string
  variant?: 'info' | 'success' | 'warning' | 'error'
  onClose?: () => void
  actionText?: string
  onAction?: () => void
}

export function AlertDialog({
  open,
  title,
  description,
  variant = 'info',
  onClose,
  actionText = 'OK',
  onAction,
}: AlertDialogProps) {
  const variantConfig = {
    info: {
      icon: Info,
      iconColor: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/20',
    },
    success: {
      icon: CheckCircle,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
    },
    error: {
      icon: X,
      iconColor: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
  }

  const config = variantConfig[variant]
  const Icon = config.icon

  const handleAction = () => {
    onAction?.()
    onClose?.()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <div className={cn('rounded-lg border p-4', config.bgColor, config.borderColor)}>
          <div className="flex items-start gap-3">
            <Icon className={cn('mt-0.5 h-5 w-5', config.iconColor)} />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleAction}>{actionText}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Modal with Steps (wizard-like)
interface StepModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title: string
  steps: {
    label: string
    content: React.ReactNode
    validation?: () => boolean
  }[]
  onComplete: (data?: any) => void | Promise<void>
  trigger?: React.ReactNode
}

export function StepModal({
  open,
  onOpenChange,
  title,
  steps,
  onComplete,
  trigger,
}: StepModalProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const isOpen = open !== undefined ? open : uncontrolledOpen
  const setOpen = onOpenChange || setUncontrolledOpen

  const handleNext = () => {
    if (steps[currentStep].validation && !steps[currentStep].validation()) {
      return
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    setIsLoading(true)
    try {
      await onComplete()
      setOpen(false)
      setCurrentStep(0)
    } catch (error) {
      console.error('Step modal completion error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <div className="mt-4 flex items-center gap-2">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-1 items-center">
                <div
                  className={cn(
                    'h-2 flex-1 rounded-full transition-colors',
                    index <= currentStep ? 'bg-primary' : 'bg-muted'
                  )}
                />
                {index < steps.length - 1 && <div className="w-2" />}
              </div>
            ))}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Step {currentStep + 1} of {steps.length}: {steps[currentStep].label}
          </p>
        </DialogHeader>
        <div className="py-4">{steps[currentStep].content}</div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0 || isLoading}
          >
            Previous
          </Button>
          {currentStep === steps.length - 1 ? (
            <Button onClick={handleComplete} disabled={isLoading}>
              {isLoading ? (
                <>
                  <LoadingSpinner size="xs" className="mr-2" />
                  Completing...
                </>
              ) : (
                'Complete'
              )}
            </Button>
          ) : (
            <Button onClick={handleNext}>Next</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
