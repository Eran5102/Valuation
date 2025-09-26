'use client'

import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Settings, Trash2 } from 'lucide-react'
import type { TemplateSection, TemplateBlock } from '@/lib/templates/types'

import { SortableBlock } from './SortableBlock'
import { DropZone } from './DropZone'

interface TemplateCanvasProps {
  section: TemplateSection
  onBlockSelect: (block: TemplateBlock) => void
  onBlockUpdate: (blockId: string, updates: Partial<TemplateBlock>) => void
  onBlockDelete: (blockId: string) => void
  onSectionUpdate: (updates: Partial<TemplateSection>) => void
  onSaveBlockToLibrary?: (block: TemplateBlock) => void
}

export function TemplateCanvas({
  section,
  onBlockSelect,
  onBlockUpdate,
  onBlockDelete,
  onSectionUpdate,
  onSaveBlockToLibrary,
}: TemplateCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `section-${section.id}`,
    data: {
      sectionId: section.id,
      accepts: ['block', 'field'], // Accept both blocks and fields
    },
  })

  return (
    <div className="h-full overflow-y-auto bg-background p-4">
      <Card className="flex flex-col shadow-sm">
        {/* Section Header */}
        <CardHeader className="flex-shrink-0 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Input
                value={section.title}
                onChange={(e) => onSectionUpdate({ title: e.target.value })}
                className="border-none bg-transparent px-0 text-lg font-semibold focus-visible:ring-0"
                placeholder="Section Title"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="page-break-before"
                  checked={section.pageBreakBefore || false}
                  onCheckedChange={(checked) => onSectionUpdate({ pageBreakBefore: checked })}
                />
                <Label htmlFor="page-break-before" className="text-xs">
                  Page Break Before
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="page-break-after"
                  checked={section.pageBreakAfter || false}
                  onCheckedChange={(checked) => onSectionUpdate({ pageBreakAfter: checked })}
                />
                <Label htmlFor="page-break-after" className="text-xs">
                  Page Break After
                </Label>
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Section Content */}
        <CardContent className="p-6">
          <div
            ref={setNodeRef}
            className={`min-h-[200px] rounded-lg border-2 border-dashed transition-all duration-200 ${
              isOver
                ? 'bg-primary/10 border-primary shadow-inner scale-[1.01]'
                : 'hover:border-primary/30 hover:bg-primary/5 border-border'
            }`}
          >
            {section.blocks.length === 0 ? (
              // Empty State
              <div className="flex min-h-[200px] items-center justify-center text-center">
                <div className="text-muted-foreground">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <Settings className="h-8 w-8" />
                  </div>
                  <h3 className="mb-2 text-lg font-medium">No blocks yet</h3>
                  <p className="max-w-sm text-sm">
                    Drag blocks from the library or data fields from the right to start building your template
                    section.
                  </p>
                </div>
              </div>
            ) : (
              // Blocks List
              <SortableContext
                items={section.blocks.map((b) => b.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="p-4">
                  {/* Drop zone at the beginning */}
                  <DropZone
                    id={`drop-zone-${section.id}-0`}
                    sectionId={section.id}
                    index={0}
                    className="h-2 -mt-2 mb-2"
                  />

                  {section.blocks.map((block, index) => (
                    <React.Fragment key={block.id}>
                      <SortableBlock
                        block={block}
                        index={index}
                        onClick={() => onBlockSelect(block)}
                        onUpdate={(updates) => onBlockUpdate(block.id, updates)}
                        onDelete={() => onBlockDelete(block.id)}
                        onSaveToLibrary={onSaveBlockToLibrary}
                      />

                      {/* Drop zone between blocks */}
                      <DropZone
                        id={`drop-zone-${section.id}-${index + 1}`}
                        sectionId={section.id}
                        index={index + 1}
                        className="h-4 -my-1"
                      />
                    </React.Fragment>
                  ))}
                </div>
              </SortableContext>
            )}
          </div>

          {/* Section Stats */}
          <div className="mt-4 text-xs text-muted-foreground">
            {section.blocks.length} blocks in this section
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
