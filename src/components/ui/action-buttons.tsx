import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
  Download,
  Upload,
  Save,
  Edit,
  Trash2,
  Eye,
  Plus,
  ArrowLeft,
  ExternalLink,
  Copy,
  Share2,
  Settings,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Common action button props interface
interface BaseButtonProps {
  loading?: boolean
  disabled?: boolean
  className?: string
  children?: React.ReactNode
}

// Navigation Buttons
interface BackButtonProps extends BaseButtonProps {
  href?: string
  onClick?: () => void
}

export function BackButton({ href, onClick, loading, disabled, className, children }: BackButtonProps) {
  const content = (
    <>
      <ArrowLeft className="mr-2 h-4 w-4" />
      {children || 'Back'}
    </>
  )

  if (href) {
    return (
      <Link href={href}>
        <Button
          variant="outline"
          size="sm"
          disabled={loading || disabled}
          className={cn("flex items-center", className)}
        >
          {loading ? <LoadingSpinner size="xs" className="mr-2" /> : content}
        </Button>
      </Link>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={loading || disabled}
      className={cn("flex items-center", className)}
    >
      {loading ? <LoadingSpinner size="xs" className="mr-2" /> : content}
    </Button>
  )
}

// Action Buttons
interface ActionButtonProps extends BaseButtonProps {
  onClick?: () => void
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function SaveButton({ onClick, loading, disabled, className, children, variant = 'default', size = 'sm' }: ActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={loading || disabled}
      variant={variant}
      size={size}
      className={cn("flex items-center", className)}
    >
      {loading ? (
        <LoadingSpinner size="xs" className="mr-2" />
      ) : (
        <Save className="mr-2 h-4 w-4" />
      )}
      {children || (loading ? 'Saving...' : 'Save')}
    </Button>
  )
}

export function DeleteButton({ onClick, loading, disabled, className, children, size = 'sm' }: ActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={loading || disabled}
      variant="destructive"
      size={size}
      className={cn("flex items-center", className)}
    >
      {loading ? (
        <LoadingSpinner size="xs" className="mr-2" />
      ) : (
        <Trash2 className="mr-2 h-4 w-4" />
      )}
      {children || (loading ? 'Deleting...' : 'Delete')}
    </Button>
  )
}

export function EditButton({ onClick, loading, disabled, className, children, variant = 'outline', size = 'sm' }: ActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={loading || disabled}
      variant={variant}
      size={size}
      className={cn("flex items-center", className)}
    >
      {loading ? (
        <LoadingSpinner size="xs" className="mr-2" />
      ) : (
        <Edit className="mr-2 h-4 w-4" />
      )}
      {children || 'Edit'}
    </Button>
  )
}

export function DownloadButton({ onClick, loading, disabled, className, children, variant = 'outline', size = 'sm' }: ActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={loading || disabled}
      variant={variant}
      size={size}
      className={cn("flex items-center", className)}
    >
      {loading ? (
        <LoadingSpinner size="xs" className="mr-2" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      {children || (loading ? 'Downloading...' : 'Download')}
    </Button>
  )
}

export function UploadButton({ onClick, loading, disabled, className, children, variant = 'outline', size = 'sm' }: ActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={loading || disabled}
      variant={variant}
      size={size}
      className={cn("flex items-center", className)}
    >
      {loading ? (
        <LoadingSpinner size="xs" className="mr-2" />
      ) : (
        <Upload className="mr-2 h-4 w-4" />
      )}
      {children || (loading ? 'Uploading...' : 'Upload')}
    </Button>
  )
}

export function ViewButton({ onClick, loading, disabled, className, children, variant = 'ghost', size = 'sm' }: ActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={loading || disabled}
      variant={variant}
      size={size}
      className={cn("flex items-center", className)}
    >
      <Eye className="mr-2 h-4 w-4" />
      {children || 'View'}
    </Button>
  )
}

export function RefreshButton({ onClick, loading, disabled, className, children, variant = 'outline', size = 'sm' }: ActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={loading || disabled}
      variant={variant}
      size={size}
      className={cn("flex items-center", className)}
    >
      {loading ? (
        <LoadingSpinner size="xs" className="mr-2" />
      ) : (
        <RefreshCw className="mr-2 h-4 w-4" />
      )}
      {children || 'Refresh'}
    </Button>
  )
}

// Create/Add Buttons
interface CreateButtonProps extends BaseButtonProps {
  onClick?: () => void
  href?: string
  variant?: 'default' | 'outline'
  size?: 'default' | 'sm' | 'lg'
}

export function CreateButton({ href, onClick, loading, disabled, className, children, variant = 'default', size = 'sm' }: CreateButtonProps) {
  const content = (
    <>
      {loading ? (
        <LoadingSpinner size="xs" className="mr-2" />
      ) : (
        <Plus className="mr-2 h-4 w-4" />
      )}
      {children || 'Create New'}
    </>
  )

  if (href) {
    return (
      <Link href={href}>
        <Button
          variant={variant}
          size={size}
          disabled={loading || disabled}
          className={cn("flex items-center", className)}
        >
          {content}
        </Button>
      </Link>
    )
  }

  return (
    <Button
      onClick={onClick}
      disabled={loading || disabled}
      variant={variant}
      size={size}
      className={cn("flex items-center", className)}
    >
      {content}
    </Button>
  )
}

// Button Groups
interface ButtonGroupProps {
  children: React.ReactNode
  alignment?: 'left' | 'center' | 'right'
  className?: string
}

export function ButtonGroup({ children, alignment = 'right', className }: ButtonGroupProps) {
  const alignmentClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end'
  }

  return (
    <div className={cn('flex items-center space-x-2', alignmentClasses[alignment], className)}>
      {children}
    </div>
  )
}

// Common button combinations
interface ActionBarProps {
  onSave?: () => void
  onCancel?: () => void
  onDelete?: () => void
  saveLoading?: boolean
  deleteLoading?: boolean
  disabled?: boolean
  showSave?: boolean
  showCancel?: boolean
  showDelete?: boolean
  saveText?: string
  cancelText?: string
  deleteText?: string
  className?: string
}

export function ActionBar({
  onSave,
  onCancel,
  onDelete,
  saveLoading,
  deleteLoading,
  disabled,
  showSave = true,
  showCancel = true,
  showDelete = false,
  saveText,
  cancelText,
  deleteText,
  className
}: ActionBarProps) {
  return (
    <ButtonGroup alignment="right" className={className}>
      {showDelete && onDelete && (
        <DeleteButton
          onClick={onDelete}
          loading={deleteLoading}
          disabled={disabled}
        >
          {deleteText}
        </DeleteButton>
      )}
      {showCancel && onCancel && (
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={disabled || saveLoading || deleteLoading}
        >
          {cancelText || 'Cancel'}
        </Button>
      )}
      {showSave && onSave && (
        <SaveButton
          onClick={onSave}
          loading={saveLoading}
          disabled={disabled}
        >
          {saveText}
        </SaveButton>
      )}
    </ButtonGroup>
  )
}

// Icon-only button variants
interface IconButtonProps extends BaseButtonProps {
  icon: React.ComponentType<{ className?: string }>
  onClick?: () => void
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  tooltip?: string
}

export function IconButton({
  icon: Icon,
  onClick,
  loading,
  disabled,
  className,
  variant = 'ghost',
  size = 'icon',
  tooltip
}: IconButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={loading || disabled}
      variant={variant}
      size={size}
      className={cn("flex items-center justify-center", className)}
      title={tooltip}
    >
      {loading ? (
        <LoadingSpinner size="xs" />
      ) : (
        <Icon className="h-4 w-4" />
      )}
    </Button>
  )
}