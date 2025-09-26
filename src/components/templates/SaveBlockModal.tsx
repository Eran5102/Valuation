'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { X, Plus, Save } from 'lucide-react'
import type { TemplateBlock } from '@/lib/templates/types'

interface SaveBlockModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  block: TemplateBlock
  onSave: (name: string, description?: string, tags?: string[]) => void
}

export function SaveBlockModal({
  open,
  onOpenChange,
  block,
  onSave
}: SaveBlockModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleSave = async () => {
    if (!name.trim()) return

    setIsSubmitting(true)
    try {
      await onSave(name, description || undefined, tags.length > 0 ? tags : undefined)
      // Reset form
      setName('')
      setDescription('')
      setTags([])
      setTagInput('')
      onOpenChange(false)
    } catch (error) {
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (e.currentTarget.id === 'tag-input') {
        handleAddTag()
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Save Block to Library</DialogTitle>
          <DialogDescription>
            Save this {block.type} block for reuse in other templates
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="Enter a descriptive name for this block"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add an optional description to help you remember this block's purpose"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tag-input">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tag-input"
                placeholder="Add tags (press Enter)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyPress}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground mb-1">Preview:</p>
            <div className="text-sm">
              <strong>Type:</strong> {block.type}
              {block.type === 'text' && block.content && (
                <div className="mt-1">
                  <strong>Content:</strong>{' '}
                  {block.content.substring(0, 100)}
                  {block.content.length > 100 && '...'}
                </div>
              )}
              {block.type === 'table' && (
                <div className="mt-1">
                  <strong>Table:</strong> {(block as any).rows || 0} rows × {(block as any).columns || 0} columns
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!name.trim() || isSubmitting}
          >
            <Save className="h-4 w-4 mr-2" />
            Save to Library
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}