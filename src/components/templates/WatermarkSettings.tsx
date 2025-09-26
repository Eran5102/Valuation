'use client'

import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Droplets, RotateCcw, Save } from 'lucide-react'
import type { ReportTemplate } from '@/lib/templates/types'

interface WatermarkSettingsProps {
  template: ReportTemplate
  onChange: (template: ReportTemplate) => void
}

export function WatermarkSettings({ template, onChange }: WatermarkSettingsProps) {
  const watermarkSettings = template.settings?.watermark || {
    enabled: true,
    text: 'DRAFT',
    opacity: 0.1,
    angle: -45,
    fontSize: 72,
    position: 'center',
  }

  const [settings, setSettings] = useState(watermarkSettings)

  const handleChange = useCallback((updates: Partial<typeof settings>) => {
    const newSettings = { ...settings, ...updates }
    setSettings(newSettings)

    const updatedTemplate: ReportTemplate = {
      ...template,
      settings: {
        ...template.settings,
        watermark: newSettings,
      },
    }
    onChange(updatedTemplate)
  }, [settings, template, onChange])

  const resetToDefaults = () => {
    const defaultSettings = {
      enabled: false,
      text: 'DRAFT',
      opacity: 0.1,
      angle: -45,
      fontSize: 72,
      position: 'center' as const,
    }
    setSettings(defaultSettings)
    handleChange(defaultSettings)
  }

  const presetTexts = [
    'DRAFT',
    'CONFIDENTIAL',
    'SAMPLE',
    'NOT FOR DISTRIBUTION',
    'INTERNAL USE ONLY',
    'PRELIMINARY',
    'WORK IN PROGRESS',
    'FINAL',
    'APPROVED',
    'FOR REVIEW',
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplets className="h-5 w-5" />
          Watermark Settings
        </CardTitle>
        <CardDescription>
          Add a watermark to your report pages for draft or confidential documents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Watermark */}
        <div className="flex items-center justify-between">
          <Label htmlFor="watermark-enabled" className="flex flex-col gap-1">
            <span>Enable Watermark</span>
            <span className="text-xs font-normal text-muted-foreground">
              Display watermark on all pages
            </span>
          </Label>
          <Switch
            id="watermark-enabled"
            checked={settings.enabled}
            onCheckedChange={(enabled) => handleChange({ enabled })}
          />
        </div>

        {settings.enabled && (
          <>
            {/* Watermark Text */}
            <div className="space-y-2">
              <Label htmlFor="watermark-text">Watermark Text</Label>
              <Input
                id="watermark-text"
                value={settings.text}
                onChange={(e) => handleChange({ text: e.target.value })}
                placeholder="Enter custom watermark text..."
              />
              <p className="text-xs text-muted-foreground">
                Type any custom text above or choose from quick presets:
              </p>
              <div className="flex flex-wrap gap-2">
                {presetTexts.map((text) => (
                  <Button
                    key={text}
                    variant={settings.text === text ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleChange({ text })}
                    className="text-xs"
                  >
                    {text}
                  </Button>
                ))}
              </div>
            </div>

            {/* Opacity */}
            <div className="space-y-2">
              <Label htmlFor="watermark-opacity">
                Opacity: {Math.round(settings.opacity * 100)}%
              </Label>
              <Slider
                id="watermark-opacity"
                min={5}
                max={50}
                step={5}
                value={[settings.opacity * 100]}
                onValueChange={([value]) => handleChange({ opacity: value / 100 })}
                className="w-full"
              />
            </div>

            {/* Font Size */}
            <div className="space-y-2">
              <Label htmlFor="watermark-size">
                Font Size: {settings.fontSize}px
              </Label>
              <Slider
                id="watermark-size"
                min={24}
                max={144}
                step={12}
                value={[settings.fontSize || 72]}
                onValueChange={([fontSize]) => handleChange({ fontSize })}
                className="w-full"
              />
            </div>

            {/* Rotation Angle */}
            <div className="space-y-2">
              <Label htmlFor="watermark-angle">
                Rotation: {settings.angle}°
              </Label>
              <Slider
                id="watermark-angle"
                min={-90}
                max={90}
                step={15}
                value={[settings.angle || -45]}
                onValueChange={([angle]) => handleChange({ angle })}
                className="w-full"
              />
            </div>

            {/* Position */}
            <div className="space-y-2">
              <Label htmlFor="watermark-position">Position</Label>
              <Select
                value={settings.position}
                onValueChange={(position) => handleChange({ position })}
              >
                <SelectTrigger id="watermark-position">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="diagonal">Diagonal</SelectItem>
                  <SelectItem value="top">Top</SelectItem>
                  <SelectItem value="bottom">Bottom</SelectItem>
                  <SelectItem value="pattern">Repeating Pattern</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="relative h-48 w-full overflow-hidden rounded-lg border bg-white">
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <p className="text-sm text-muted-foreground">
                    Sample document content for watermark preview...
                  </p>
                </div>
                <div
                  className="pointer-events-none absolute inset-0 flex items-center justify-center"
                  style={{
                    transform: `rotate(${settings.angle}deg)`,
                  }}
                >
                  <span
                    className="select-none font-bold uppercase"
                    style={{
                      fontSize: `${(settings.fontSize || 72) / 3}px`,
                      opacity: settings.opacity,
                      color: '#000000',
                    }}
                  >
                    {settings.text}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetToDefaults}
                className="flex-1"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset to Defaults
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}