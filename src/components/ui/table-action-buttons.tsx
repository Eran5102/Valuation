import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Eye, Edit, Trash2, Download } from 'lucide-react'

interface TableActionButtonsProps {
  itemId: number | string
  viewHref?: string
  editHref?: string
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onDownload?: () => void
  showView?: boolean
  showEdit?: boolean
  showDelete?: boolean
  showDownload?: boolean
}

export function TableActionButtons({
  itemId,
  viewHref,
  editHref,
  onView,
  onEdit,
  onDelete,
  onDownload,
  showView = true,
  showEdit = true,
  showDelete = true,
  showDownload = false,
}: TableActionButtonsProps) {
  return (
    <div className="flex items-center space-x-2">
      {showView && (
        <>
          {viewHref ? (
            <Link href={viewHref}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onView}>
              <Eye className="h-4 w-4" />
            </Button>
          )}
        </>
      )}

      {showDownload && (
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onDownload}>
          <Download className="h-4 w-4" />
        </Button>
      )}

      {showEdit && (
        <>
          {editHref ? (
            <Link href={editHref}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </>
      )}

      {showDelete && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}