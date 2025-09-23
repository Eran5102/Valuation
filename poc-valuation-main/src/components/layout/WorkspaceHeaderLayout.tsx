import React, { ReactNode } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { CommentsButton } from '@/components/collaboration/CommentsButton'
import { ShareButton } from '@/components/collaboration/ShareButton'
import { UserPresenceIndicator } from '@/components/collaboration/UserPresenceIndicator'

interface WorkspaceHeaderLayoutProps {
  title: string
  description: string
  icon: ReactNode
  children?: ReactNode
  headerActions?: ReactNode
  fullWidth?: boolean
  showCommentsButton?: boolean
  hideCollaboration?: boolean // Added this prop to hide the collaboration components
}

export function WorkspaceHeaderLayout({
  title,
  description,
  icon,
  children,
  headerActions,
  fullWidth = false,
  showCommentsButton = false,
  hideCollaboration = false, // Default is false to maintain current behavior
}: WorkspaceHeaderLayoutProps) {
  return (
    <div className="flex h-[calc(100vh-4rem)] w-full flex-col">
      <PageHeader title={title} icon={icon} description={description}>
        <div className="flex items-center gap-2">
          {!hideCollaboration && <UserPresenceIndicator />}
          {showCommentsButton && <CommentsButton size="sm" />}
          {!hideCollaboration && <ShareButton size="sm" />}
          {headerActions}
        </div>
      </PageHeader>

      {fullWidth ? (
        <div className="flex-1 overflow-auto px-4 py-2 pb-16">{children}</div>
      ) : (
        <div className="grid flex-1 gap-4 overflow-auto px-4 py-2 pb-16 md:grid-cols-[280px_1fr]">
          {children}
        </div>
      )}
    </div>
  )
}
