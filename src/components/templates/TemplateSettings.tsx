'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Settings, FileText, Palette, Layout } from 'lucide-react'
import type { ReportTemplate } from '@/lib/templates/types'
import { TemplateThemeManager } from './TemplateThemeManager'

interface TemplateSettingsProps {
  template: ReportTemplate
  onChange: (template: ReportTemplate) => void
}

export function TemplateSettings({ template, onChange }: TemplateSettingsProps) {
  const updateBasicInfo = (field: string, value: any) => {
    onChange({
      ...template,
      [field]: value,
    })
  }

  const updateSettings = (field: string, value: any) => {
    onChange({
      ...template,
      settings: {
        ...template.settings,
        [field]: value,
      },
    })
  }

  const updateMargins = (side: string, value: string) => {
    onChange({
      ...template,
      settings: {
        ...template.settings,
        margins: {
          ...template.settings?.margins,
          [side]: value,
        } as any,
      },
    })
  }

  const updateWatermark = (field: string, value: any) => {
    onChange({
      ...template,
      settings: {
        ...template.settings,
        watermark: {
          ...template.settings?.watermark,
          [field]: value,
        },
      },
    })
  }

  const updateMetadata = (field: string, value: any) => {
    onChange({
      ...template,
      metadata: {
        ...template.metadata,
        [field]: value,
      },
    })
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={template.name}
                onChange={(e) => updateBasicInfo('name', e.target.value)}
                placeholder="Enter template name"
              />
            </div>
            <div>
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                value={template.version}
                onChange={(e) => updateBasicInfo('version', e.target.value)}
                placeholder="1.0.0"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={template.description}
              onChange={(e) => updateBasicInfo('description', e.target.value)}
              rows={3}
              placeholder="Describe what this template is used for..."
            />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              value={template.category}
              onValueChange={(value) => updateBasicInfo('category', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="financial">Financial</SelectItem>
                <SelectItem value="legal">Legal</SelectItem>
                <SelectItem value="operational">Operational</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Page Layout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Layout className="mr-2 h-5 w-5" />
            Page Layout
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="paperSize">Paper Size</Label>
              <Select
                value={template.settings?.paperSize || 'letter'}
                onValueChange={(value) => updateSettings('paperSize', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="letter">Letter (8.5" × 11")</SelectItem>
                  <SelectItem value="legal">Legal (8.5" × 14")</SelectItem>
                  <SelectItem value="a4">A4 (210 × 297 mm)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="orientation">Orientation</Label>
              <Select
                value={template.settings?.orientation || 'portrait'}
                onValueChange={(value) => updateSettings('orientation', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="portrait">Portrait</SelectItem>
                  <SelectItem value="landscape">Landscape</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="mb-3 block text-sm font-medium">Margins</Label>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <Label htmlFor="marginTop" className="text-xs">
                  Top
                </Label>
                <Input
                  id="marginTop"
                  value={template.settings?.margins?.top || '1in'}
                  onChange={(e) => updateMargins('top', e.target.value)}
                  placeholder="1in"
                />
              </div>
              <div>
                <Label htmlFor="marginRight" className="text-xs">
                  Right
                </Label>
                <Input
                  id="marginRight"
                  value={template.settings?.margins?.right || '1in'}
                  onChange={(e) => updateMargins('right', e.target.value)}
                  placeholder="1in"
                />
              </div>
              <div>
                <Label htmlFor="marginBottom" className="text-xs">
                  Bottom
                </Label>
                <Input
                  id="marginBottom"
                  value={template.settings?.margins?.bottom || '1in'}
                  onChange={(e) => updateMargins('bottom', e.target.value)}
                  placeholder="1in"
                />
              </div>
              <div>
                <Label htmlFor="marginLeft" className="text-xs">
                  Left
                </Label>
                <Input
                  id="marginLeft"
                  value={template.settings?.margins?.left || '1in'}
                  onChange={(e) => updateMargins('left', e.target.value)}
                  placeholder="1in"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Watermark Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Palette className="mr-2 h-5 w-5" />
            Watermark
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="watermarkEnabled"
              checked={template.settings?.watermark?.enabled || false}
              onCheckedChange={(checked) => updateWatermark('enabled', checked)}
            />
            <Label htmlFor="watermarkEnabled">Enable watermark for draft documents</Label>
          </div>

          {template.settings?.watermark?.enabled && (
            <div className="space-y-4 border-l-2 border-primary/20 pl-6">
              <div>
                <Label htmlFor="watermarkText">Watermark Text</Label>
                <Input
                  id="watermarkText"
                  value={template.settings.watermark.text || 'DRAFT'}
                  onChange={(e) => updateWatermark('text', e.target.value)}
                  placeholder="DRAFT"
                />
              </div>

              <div>
                <Label htmlFor="watermarkOpacity">Opacity</Label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    id="watermarkOpacity"
                    min="0"
                    max="1"
                    step="0.1"
                    value={template.settings.watermark.opacity || 0.1}
                    onChange={(e) => updateWatermark('opacity', parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="w-12 text-sm text-muted-foreground">
                    {Math.round((template.settings.watermark.opacity || 0.1) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            Metadata
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="author">Author</Label>
            <Input
              id="author"
              value={template.metadata?.author || ''}
              onChange={(e) => updateMetadata('author', e.target.value)}
              placeholder="Template author"
            />
          </div>

          <div>
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={template.metadata?.tags?.join(', ') || ''}
              onChange={(e) =>
                updateMetadata(
                  'tags',
                  e.target.value
                    .split(',')
                    .map((tag) => tag.trim())
                    .filter(Boolean)
                )
              }
              placeholder="tag1, tag2, tag3"
            />
            <p className="mt-1 text-xs text-muted-foreground">Separate tags with commas</p>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-xs text-muted-foreground">Created</Label>
              <p>
                {template.metadata?.createdAt
                  ? new Date(template.metadata.createdAt).toLocaleString()
                  : 'Unknown'}
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Last Updated</Label>
              <p>
                {template.metadata?.updatedAt
                  ? new Date(template.metadata.updatedAt).toLocaleString()
                  : 'Never'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Theme Management */}
      <TemplateThemeManager template={template} onChange={onChange} />

      {/* Template Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Template Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{template.sections.length}</div>
              <div className="text-sm text-muted-foreground">Sections</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {template.sections.reduce((acc, section) => acc + section.blocks.length, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Blocks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{template.variables.length}</div>
              <div className="text-sm text-muted-foreground">Variables</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {template.variables.filter((v) => v.required).length}
              </div>
              <div className="text-sm text-muted-foreground">Required</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
