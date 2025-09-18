'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings, Trash2 } from 'lucide-react';
import type { TemplateSection, TemplateBlock } from '@/lib/templates/types';

import { SortableBlock } from './SortableBlock';

interface TemplateCanvasProps {
  section: TemplateSection;
  onBlockSelect: (block: TemplateBlock) => void;
  onBlockUpdate: (blockId: string, updates: Partial<TemplateBlock>) => void;
  onBlockDelete: (blockId: string) => void;
  onSectionUpdate: (updates: Partial<TemplateSection>) => void;
}

export function TemplateCanvas({
  section,
  onBlockSelect,
  onBlockUpdate,
  onBlockDelete,
  onSectionUpdate
}: TemplateCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `section-${section.id}`,
    data: {
      sectionId: section.id,
      accepts: ['block']
    }
  });

  return (
    <div className="p-6 h-full">
      <Card className="h-full">
        {/* Section Header */}
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Input
                value={section.title}
                onChange={(e) => onSectionUpdate({ title: e.target.value })}
                className="text-lg font-semibold bg-transparent border-none px-0 focus-visible:ring-0"
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
        <CardContent className="p-6 flex-1">
          <div
            ref={setNodeRef}
            className={`min-h-[400px] rounded-lg border-2 border-dashed transition-colors ${
              isOver
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-border/60'
            }`}
          >
            {section.blocks.length === 0 ? (
              // Empty State
              <div className="flex items-center justify-center h-full text-center">
                <div className="text-muted-foreground">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <Settings className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No blocks yet</h3>
                  <p className="text-sm max-w-sm">
                    Drag blocks from the library on the left to start building your template section.
                  </p>
                </div>
              </div>
            ) : (
              // Blocks List
              <SortableContext items={section.blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4 p-4">
                  {section.blocks.map((block, index) => (
                    <SortableBlock
                      key={block.id}
                      block={block}
                      index={index}
                      onClick={() => onBlockSelect(block)}
                      onUpdate={(updates) => onBlockUpdate(block.id, updates)}
                      onDelete={() => onBlockDelete(block.id)}
                    />
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
  );
}