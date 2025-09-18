'use client';

import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  GripVertical,
  Edit,
  Trash2,
  Type,
  Heading1,
  List,
  Table,
  BarChart3,
  Minus,
  Eye,
  EyeOff,
  Check,
  X,
  Plus,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  ImageIcon,
  Quote,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Upload
} from 'lucide-react';
import type { TemplateBlock } from '@/lib/templates/types';

const blockIcons = {
  text: Type,
  header: Heading1,
  paragraph: Type,
  list: List,
  table: Table,
  chart: BarChart3,
  pageBreak: Minus,
  image: ImageIcon,
  separator: AlignCenter,
  quote: Quote,
  dynamicTable: Table,
  breakpointsTable: TrendingUp,
  managementTable: Users,
  valuationSummary: DollarSign,
  dateBlock: Calendar
};

interface SortableBlockProps {
  block: TemplateBlock;
  index: number;
  onClick: () => void;
  onUpdate: (updates: Partial<TemplateBlock>) => void;
  onDelete: () => void;
}

export function SortableBlock({ block, index, onClick, onUpdate, onDelete }: SortableBlockProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingContent, setEditingContent] = useState(block.content);
  const [tempListItems, setTempListItems] = useState<string[]>(
    Array.isArray(block.content) ? block.content : ['']
  );
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = blockIcons[block.type] || Type;

  const startEditing = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setIsEditing(true);
    setEditingContent(block.content);
    if (Array.isArray(block.content)) {
      setTempListItems(block.content);
    }
  };

  const saveEdit = () => {
    if (block.type === 'list') {
      onUpdate({ content: tempListItems.filter(item => item.trim() !== '') });
    } else {
      onUpdate({ content: editingContent });
    }
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditingContent(block.content);
    setTempListItems(Array.isArray(block.content) ? block.content : ['']);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const addListItem = () => {
    setTempListItems([...tempListItems, '']);
  };

  const removeListItem = (index: number) => {
    setTempListItems(tempListItems.filter((_, i) => i !== index));
  };

  const updateListItem = (index: number, value: string) => {
    const newItems = [...tempListItems];
    newItems[index] = value;
    setTempListItems(newItems);
  };

  const handleStyleChange = (property: string, value: any) => {
    onUpdate({
      styling: {
        ...block.styling,
        [property]: value
      }
    });
  };

  const renderMiniStyleToolbar = () => (
    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded border border-border">
      {/* Font Size */}
      <Input
        type="number"
        value={block.styling?.fontSize || ''}
        onChange={(e) => handleStyleChange('fontSize', parseInt(e.target.value) || undefined)}
        placeholder="Size"
        className="w-16 h-7 text-xs"
      />

      {/* Font Weight */}
      <Button
        size="sm"
        variant={block.styling?.fontWeight === 'bold' ? 'default' : 'outline'}
        onClick={() => handleStyleChange('fontWeight', block.styling?.fontWeight === 'bold' ? 'normal' : 'bold')}
        className="h-7 w-7 p-0"
      >
        <Bold className="w-3 h-3" />
      </Button>

      <Separator orientation="vertical" className="h-4" />

      {/* Text Alignment */}
      <Button
        size="sm"
        variant={block.styling?.textAlign === 'left' || !block.styling?.textAlign ? 'default' : 'outline'}
        onClick={() => handleStyleChange('textAlign', 'left')}
        className="h-7 w-7 p-0"
      >
        <AlignLeft className="w-3 h-3" />
      </Button>
      <Button
        size="sm"
        variant={block.styling?.textAlign === 'center' ? 'default' : 'outline'}
        onClick={() => handleStyleChange('textAlign', 'center')}
        className="h-7 w-7 p-0"
      >
        <AlignCenter className="w-3 h-3" />
      </Button>
      <Button
        size="sm"
        variant={block.styling?.textAlign === 'right' ? 'default' : 'outline'}
        onClick={() => handleStyleChange('textAlign', 'right')}
        className="h-7 w-7 p-0"
      >
        <AlignRight className="w-3 h-3" />
      </Button>

      <Separator orientation="vertical" className="h-4" />

      {/* Text Color */}
      <Input
        type="color"
        value={block.styling?.color || '#000000'}
        onChange={(e) => handleStyleChange('color', e.target.value)}
        className="w-8 h-7 p-0 border-0 cursor-pointer"
        title="Text Color"
      />

      {/* Background Color */}
      <Input
        type="color"
        value={block.styling?.backgroundColor || '#ffffff'}
        onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
        className="w-8 h-7 p-0 border-0 cursor-pointer"
        title="Background Color"
      />

      <Separator orientation="vertical" className="h-4" />

      {/* Advanced Options */}
      <Button
        size="sm"
        variant="outline"
        onClick={() => onClick()}
        className="h-7 px-2 text-xs"
        title="More styling options"
      >
        <Palette className="w-3 h-3 mr-1" />
        More
      </Button>
    </div>
  );

  const renderBlockContent = () => {
    if (isEditing) {
      switch (block.type) {
        case 'header':
          return (
            <div className="space-y-2">
              <Input
                value={typeof editingContent === 'string' ? editingContent : ''}
                onChange={(e) => setEditingContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter header text..."
                className="text-lg font-bold"
                autoFocus
                style={{
                  fontSize: block.styling?.fontSize || 18,
                  fontWeight: block.styling?.fontWeight || 'bold',
                  textAlign: block.styling?.textAlign || 'left',
                  color: block.styling?.color || '#000000',
                  backgroundColor: block.styling?.backgroundColor || 'transparent'
                }}
              />
              {renderMiniStyleToolbar()}
              <div className="flex gap-2">
                <Button size="sm" onClick={saveEdit}>
                  <Check className="w-3 h-3 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={cancelEdit}>
                  <X className="w-3 h-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          );

        case 'paragraph':
          return (
            <div className="space-y-2">
              <Textarea
                value={typeof editingContent === 'string' ? editingContent : ''}
                onChange={(e) => setEditingContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter paragraph content..."
                rows={3}
                autoFocus
                style={{
                  fontSize: block.styling?.fontSize || 14,
                  fontWeight: block.styling?.fontWeight || 'normal',
                  textAlign: block.styling?.textAlign || 'left',
                  color: block.styling?.color || '#000000',
                  backgroundColor: block.styling?.backgroundColor || 'transparent'
                }}
              />
              {renderMiniStyleToolbar()}
              <div className="flex gap-2">
                <Button size="sm" onClick={saveEdit}>
                  <Check className="w-3 h-3 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={cancelEdit}>
                  <X className="w-3 h-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          );

        case 'list':
          return (
            <div className="space-y-2">
              {tempListItems.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={item}
                    onChange={(e) => updateListItem(index, e.target.value)}
                    placeholder={`Item ${index + 1}`}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeListItem(index)}
                    disabled={tempListItems.length === 1}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={addListItem}>
                  <Plus className="w-3 h-3 mr-1" />
                  Add Item
                </Button>
                <Button size="sm" onClick={saveEdit}>
                  <Check className="w-3 h-3 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={cancelEdit}>
                  <X className="w-3 h-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          );

        case 'image':
          const imageContent = typeof block.content === 'object' ? block.content : { src: '', alt: 'Image', caption: '' };
          return (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        const updatedContent = {
                          ...imageContent,
                          src: e.target?.result as string,
                          alt: file.name
                        };
                        setEditingContent(updatedContent);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="flex-1"
                />
                <Button size="sm" variant="outline" title="Upload Image">
                  <Upload className="w-3 h-3" />
                </Button>
              </div>

              <Input
                value={imageContent.alt || ''}
                onChange={(e) => setEditingContent({ ...imageContent, alt: e.target.value })}
                placeholder="Alt text for accessibility"
              />

              <Input
                value={imageContent.caption || ''}
                onChange={(e) => setEditingContent({ ...imageContent, caption: e.target.value })}
                placeholder="Image caption (optional)"
              />

              {imageContent.src && (
                <div className="mt-2 p-2 border rounded">
                  <img
                    src={imageContent.src}
                    alt={imageContent.alt}
                    className="max-w-full h-auto max-h-32 object-contain"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button size="sm" onClick={saveEdit}>
                  <Check className="w-3 h-3 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={cancelEdit}>
                  <X className="w-3 h-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          );

        default:
          return (
            <div className="space-y-2">
              <Textarea
                value={typeof editingContent === 'string' ? editingContent : JSON.stringify(editingContent, null, 2)}
                onChange={(e) => setEditingContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter content..."
                rows={3}
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={saveEdit}>
                  <Check className="w-3 h-3 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={cancelEdit}>
                  <X className="w-3 h-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          );
      }
    }

    // Display mode
    switch (block.type) {
      case 'header':
        return (
          <div
            className="text-lg font-bold text-foreground line-clamp-1 cursor-text hover:bg-muted/30 rounded px-2 py-1 transition-colors"
            onClick={startEditing}
            style={{
              fontSize: block.styling?.fontSize || 18,
              fontWeight: block.styling?.fontWeight || 'bold',
              textAlign: block.styling?.textAlign || 'left',
              color: block.styling?.color || 'inherit',
              backgroundColor: block.styling?.backgroundColor || 'transparent',
              margin: block.styling?.margin || 'inherit',
              padding: block.styling?.padding || 'inherit'
            }}
          >
            {typeof block.content === 'string' ? block.content : 'Header Block'}
          </div>
        );

      case 'paragraph':
        return (
          <div
            className="text-sm text-muted-foreground line-clamp-2 cursor-text hover:bg-muted/30 rounded px-2 py-1 transition-colors"
            onClick={startEditing}
            style={{
              fontSize: block.styling?.fontSize || 14,
              fontWeight: block.styling?.fontWeight || 'normal',
              textAlign: block.styling?.textAlign || 'left',
              color: block.styling?.color || 'inherit',
              backgroundColor: block.styling?.backgroundColor || 'transparent',
              margin: block.styling?.margin || 'inherit',
              padding: block.styling?.padding || 'inherit'
            }}
          >
            {typeof block.content === 'string' ? block.content : 'Paragraph content'}
          </div>
        );

      case 'list':
        const listItems = Array.isArray(block.content) ? block.content : ['List item'];
        return (
          <div
            className="text-sm text-muted-foreground cursor-text hover:bg-muted/30 rounded px-2 py-1 transition-colors"
            onClick={startEditing}
          >
            <ul className="list-disc list-inside space-y-1">
              {listItems.slice(0, 3).map((item, i) => (
                <li key={i} className="line-clamp-1">{item}</li>
              ))}
              {listItems.length > 3 && (
                <li className="text-xs">... and {listItems.length - 3} more items</li>
              )}
            </ul>
          </div>
        );

      case 'image':
        const imageData = typeof block.content === 'object' ? block.content : { src: '', alt: 'Image', caption: '' };
        return (
          <div
            className="text-sm text-muted-foreground cursor-pointer hover:bg-muted/30 rounded px-2 py-1 transition-colors"
            onClick={startEditing}
          >
            {imageData.src ? (
              <div className="text-center">
                <img
                  src={imageData.src}
                  alt={imageData.alt}
                  className="max-w-full h-auto max-h-24 object-contain mx-auto rounded border"
                  style={{
                    maxWidth: block.styling?.maxWidth || '300px',
                    ...block.styling
                  }}
                />
                {imageData.caption && (
                  <p className="text-xs text-muted-foreground mt-1">{imageData.caption}</p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-16 border-2 border-dashed border-border rounded">
                <div className="text-center">
                  <Image className="w-6 h-6 mx-auto mb-1 opacity-50" />
                  <p className="text-xs">Click to add image</p>
                </div>
              </div>
            )}
          </div>
        );

      case 'separator':
        return (
          <div
            className="h-px bg-border my-4 cursor-pointer hover:bg-muted transition-colors"
            onClick={startEditing}
            style={block.styling}
          />
        );

      case 'quote':
        return (
          <div
            className="text-sm text-muted-foreground cursor-text hover:bg-muted/30 rounded px-2 py-1 transition-colors"
            onClick={startEditing}
            style={{
              fontStyle: block.styling?.fontStyle || 'italic',
              borderLeft: block.styling?.borderLeft || '4px solid #007acc',
              paddingLeft: block.styling?.paddingLeft || '20px',
              margin: block.styling?.margin || '20px 0',
              ...block.styling
            }}
          >
            {typeof block.content === 'string' ? block.content : 'Quote content'}
          </div>
        );

      case 'dynamicTable':
        return (
          <div className="text-sm text-muted-foreground cursor-pointer hover:bg-muted/30 rounded px-2 py-1 transition-colors" onClick={startEditing}>
            <div className="flex items-center">
              <Table className="w-4 h-4 mr-2" />
              Dynamic Table: {typeof block.content === 'object' ? block.content.dataSource : 'No data source'}
            </div>
          </div>
        );

      case 'breakpointsTable':
        return (
          <div className="text-sm text-muted-foreground cursor-pointer hover:bg-muted/30 rounded px-2 py-1 transition-colors" onClick={startEditing}>
            <div className="flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Breakpoints Analysis Table
            </div>
          </div>
        );

      case 'managementTable':
        return (
          <div className="text-sm text-muted-foreground cursor-pointer hover:bg-muted/30 rounded px-2 py-1 transition-colors" onClick={startEditing}>
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Management Ownership Table
            </div>
          </div>
        );

      case 'valuationSummary':
        return (
          <div className="text-sm text-muted-foreground cursor-pointer hover:bg-muted/30 rounded px-2 py-1 transition-colors" onClick={startEditing}>
            <div className="flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              Valuation Summary Block
            </div>
          </div>
        );

      case 'dateBlock':
        return (
          <div className="text-sm text-muted-foreground cursor-pointer hover:bg-muted/30 rounded px-2 py-1 transition-colors" onClick={startEditing}>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Date: {typeof block.content === 'object' ? new Date().toLocaleDateString() : 'Dynamic Date'}
            </div>
          </div>
        );

      case 'table':
        return (
          <div className="text-sm text-muted-foreground">
            <div className="flex items-center">
              <Table className="w-4 h-4 mr-2" />
              Table with data (use Block Editor for advanced editing)
            </div>
          </div>
        );

      case 'chart':
        return (
          <div className="text-sm text-muted-foreground">
            <div className="flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              Chart visualization (use Block Editor for configuration)
            </div>
          </div>
        );

      case 'pageBreak':
        return (
          <div className="text-sm text-muted-foreground flex items-center">
            <Minus className="w-4 h-4 mr-2" />
            Page break
          </div>
        );

      default:
        return (
          <div
            className="text-sm text-muted-foreground cursor-text hover:bg-muted/30 rounded px-2 py-1 transition-colors"
            onClick={startEditing}
          >
            {typeof block.content === 'string' ? block.content : 'Block content'}
          </div>
        );
    }
  };

  const handleToggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate({
      conditionalDisplay: block.conditionalDisplay
        ? undefined
        : { variable: '', condition: 'exists' }
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this block?')) {
      onDelete();
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`cursor-pointer transition-all duration-200 ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      } ${
        isHovered ? 'shadow-md border-primary/50' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        if (!isEditing) {
          onClick();
        }
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="mt-1 p-1 rounded hover:bg-muted transition-colors cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Block Icon */}
          <div className="flex items-center justify-center w-8 h-8 rounded bg-primary/10 text-primary">
            <Icon className="w-4 h-4" />
          </div>

          {/* Block Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="text-xs">
                {block.type}
              </Badge>
              {block.conditionalDisplay && (
                <Badge variant="outline" className="text-xs">
                  conditional
                </Badge>
              )}
            </div>

            <div className="mb-2">
              {renderBlockContent()}
            </div>

            {/* Block ID for debugging */}
            <div className="text-xs text-muted-foreground/50">
              #{block.id}
            </div>
          </div>

          {/* Action Buttons */}
          <div className={`flex items-center gap-1 transition-opacity ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleToggleVisibility}
              className="h-8 w-8 p-0"
            >
              {block.conditionalDisplay ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={startEditing}
              className="h-8 w-8 p-0"
              title="Edit inline"
            >
              <Edit className="w-4 h-4" />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}