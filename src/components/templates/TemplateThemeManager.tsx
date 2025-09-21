'use client'

import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Palette,
  Type,
  Layout,
  Image,
  Save,
  Upload,
  Download,
  MoreHorizontal,
  Trash2,
  Copy,
} from 'lucide-react'
import type { ReportTemplate } from '@/lib/templates/types'

interface TemplateTheme {
  id: string
  name: string
  description: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    text: string
    muted: string
  }
  fonts: {
    heading: string
    body: string
    monospace: string
  }
  spacing: {
    tight: string
    normal: string
    loose: string
  }
  borderRadius: string
  shadows: {
    sm: string
    md: string
    lg: string
  }
}

const defaultThemes: TemplateTheme[] = [
  {
    id: 'professional',
    name: 'Professional',
    description: 'Clean, formal styling for business reports',
    colors: {
      primary: '#1e40af',
      secondary: '#64748b',
      accent: '#0ea5e9',
      background: '#ffffff',
      text: '#1e293b',
      muted: '#64748b',
    },
    fonts: {
      heading: 'Inter, -apple-system, sans-serif',
      body: 'Inter, -apple-system, sans-serif',
      monospace: 'Consolas, Monaco, monospace',
    },
    spacing: {
      tight: '0.5rem',
      normal: '1rem',
      loose: '2rem',
    },
    borderRadius: '0.375rem',
    shadows: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Simple, clean design with subtle styling',
    colors: {
      primary: '#000000',
      secondary: '#666666',
      accent: '#333333',
      background: '#ffffff',
      text: '#000000',
      muted: '#888888',
    },
    fonts: {
      heading: 'Georgia, serif',
      body: 'Georgia, serif',
      monospace: 'Monaco, monospace',
    },
    spacing: {
      tight: '0.25rem',
      normal: '0.75rem',
      loose: '1.5rem',
    },
    borderRadius: '0',
    shadows: {
      sm: 'none',
      md: 'none',
      lg: 'none',
    },
  },
  {
    id: 'corporate',
    name: 'Corporate',
    description: 'Traditional corporate styling with serif fonts',
    colors: {
      primary: '#b91c1c',
      secondary: '#374151',
      accent: '#dc2626',
      background: '#ffffff',
      text: '#111827',
      muted: '#6b7280',
    },
    fonts: {
      heading: 'Times New Roman, serif',
      body: 'Times New Roman, serif',
      monospace: 'Courier New, monospace',
    },
    spacing: {
      tight: '0.375rem',
      normal: '1.25rem',
      loose: '2.5rem',
    },
    borderRadius: '0.25rem',
    shadows: {
      sm: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    },
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Contemporary design with bold colors and gradients',
    colors: {
      primary: '#7c3aed',
      secondary: '#4f46e5',
      accent: '#06b6d4',
      background: '#fafafa',
      text: '#1f2937',
      muted: '#9ca3af',
    },
    fonts: {
      heading: 'Poppins, sans-serif',
      body: 'Poppins, sans-serif',
      monospace: 'Fira Code, monospace',
    },
    spacing: {
      tight: '0.5rem',
      normal: '1.5rem',
      loose: '3rem',
    },
    borderRadius: '0.75rem',
    shadows: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      lg: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
    },
  },
]

interface TemplateThemeManagerProps {
  template: ReportTemplate
  onChange: (template: ReportTemplate) => void
}

export function TemplateThemeManager({ template, onChange }: TemplateThemeManagerProps) {
  const [themes, setThemes] = useState<TemplateTheme[]>(defaultThemes)
  const [selectedTheme, setSelectedTheme] = useState<TemplateTheme | null>(null)
  const [customTheme, setCustomTheme] = useState<TemplateTheme | null>(null)
  const [activeTab, setActiveTab] = useState<'themes' | 'custom'>('themes')

  const applyTheme = useCallback(
    (theme: TemplateTheme) => {
      // Apply theme to template by updating the styling of all blocks
      const updatedSections = template.sections.map((section) => ({
        ...section,
        blocks: section.blocks.map((block) => ({
          ...block,
          styling: {
            ...block.styling,
            fontFamily: block.type === 'header' ? theme.fonts.heading : theme.fonts.body,
            color: theme.colors.text,
          },
        })),
      }))

      const updatedTemplate = {
        ...template,
        sections: updatedSections,
        metadata: {
          ...template.metadata,
          theme: theme.id,
        },
      }

      onChange(updatedTemplate)
      setSelectedTheme(theme)
    },
    [template, onChange]
  )

  const createCustomTheme = useCallback(() => {
    const newTheme: TemplateTheme = {
      ...defaultThemes[0], // Start with professional theme as base
      id: `custom_${Date.now()}`,
      name: 'Custom Theme',
      description: 'Customized theme based on your preferences',
    }

    setCustomTheme(newTheme)
    setActiveTab('custom')
  }, [])

  const saveCustomTheme = useCallback(() => {
    if (!customTheme) return

    setThemes((prev) => [...prev, customTheme])
    applyTheme(customTheme)
    setActiveTab('themes')
  }, [customTheme, applyTheme])

  const updateCustomTheme = useCallback(
    (updates: Partial<TemplateTheme>) => {
      if (!customTheme) return

      setCustomTheme((prev) => (prev ? { ...prev, ...updates } : null))
    },
    [customTheme]
  )

  const exportTheme = useCallback((theme: TemplateTheme) => {
    const dataStr = JSON.stringify(theme, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
    const exportFileDefaultName = `${theme.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_theme.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }, [])

  const importTheme = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const imported = JSON.parse(e.target?.result as string)
            imported.id = `imported_${Date.now()}`
            setThemes((prev) => [...prev, imported])
            alert('Theme imported successfully!')
          } catch (error) {
            alert('Error importing theme. Please check the file format.')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }, [])

  const deleteTheme = useCallback((themeId: string) => {
    setThemes((prev) => prev.filter((t) => t.id !== themeId))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Template Themes</h2>
          <p className="text-muted-foreground">Customize the visual appearance of your templates</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={importTheme}>
            <Upload className="mr-2 h-4 w-4" />
            Import Theme
          </Button>
          <Button onClick={createCustomTheme}>
            <Palette className="mr-2 h-4 w-4" />
            Create Custom
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList>
          <TabsTrigger value="themes">
            <Layout className="mr-2 h-4 w-4" />
            Pre-built Themes
          </TabsTrigger>
          <TabsTrigger value="custom">
            <Palette className="mr-2 h-4 w-4" />
            Custom Theme
          </TabsTrigger>
        </TabsList>

        <TabsContent value="themes" className="space-y-4">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {themes.map((theme) => (
              <Card
                key={theme.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedTheme?.id === theme.id ? 'ring-2 ring-primary' : ''
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{theme.name}</CardTitle>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => applyTheme(theme)}>
                          <Palette className="mr-2 h-4 w-4" />
                          Apply Theme
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => exportTheme(theme)}>
                          <Download className="mr-2 h-4 w-4" />
                          Export
                        </DropdownMenuItem>
                        {!['professional', 'minimal', 'corporate', 'modern'].includes(theme.id) && (
                          <DropdownMenuItem
                            onClick={() => deleteTheme(theme.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <p className="text-sm text-muted-foreground">{theme.description}</p>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Color Palette */}
                  <div>
                    <Label className="text-xs font-medium">Colors</Label>
                    <div className="mt-1 flex gap-2">
                      {Object.entries(theme.colors)
                        .slice(0, 4)
                        .map(([name, color]) => (
                          <div
                            key={name}
                            className="h-6 w-6 rounded border"
                            style={{ backgroundColor: color }}
                            title={`${name}: ${color}`}
                          />
                        ))}
                    </div>
                  </div>

                  {/* Font Preview */}
                  <div>
                    <Label className="text-xs font-medium">Typography</Label>
                    <div className="mt-1 space-y-1">
                      <div
                        className="text-sm font-semibold"
                        style={{ fontFamily: theme.fonts.heading }}
                      >
                        Heading Font
                      </div>
                      <div className="text-xs" style={{ fontFamily: theme.fonts.body }}>
                        Body text preview
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => applyTheme(theme)}
                    className="w-full"
                    variant={selectedTheme?.id === theme.id ? 'default' : 'outline'}
                  >
                    {selectedTheme?.id === theme.id ? 'Applied' : 'Apply Theme'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="space-y-6">
          {customTheme ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Theme Editor */}
              <Card>
                <CardHeader>
                  <CardTitle>Theme Editor</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="theme-name">Theme Name</Label>
                      <Input
                        id="theme-name"
                        value={customTheme.name}
                        onChange={(e) => updateCustomTheme({ name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="theme-description">Description</Label>
                      <Input
                        id="theme-description"
                        value={customTheme.description}
                        onChange={(e) => updateCustomTheme({ description: e.target.value })}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Colors */}
                  <div className="space-y-4">
                    <Label>Colors</Label>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(customTheme.colors).map(([key, value]) => (
                        <div key={key}>
                          <Label htmlFor={`color-${key}`} className="text-xs capitalize">
                            {key}
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id={`color-${key}`}
                              type="color"
                              value={value}
                              onChange={(e) =>
                                updateCustomTheme({
                                  colors: { ...customTheme.colors, [key]: e.target.value },
                                })
                              }
                              className="h-8 w-16 border p-0"
                            />
                            <Input
                              value={value}
                              onChange={(e) =>
                                updateCustomTheme({
                                  colors: { ...customTheme.colors, [key]: e.target.value },
                                })
                              }
                              className="text-xs"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Fonts */}
                  <div className="space-y-4">
                    <Label>Typography</Label>
                    <div className="space-y-3">
                      {Object.entries(customTheme.fonts).map(([key, value]) => (
                        <div key={key}>
                          <Label htmlFor={`font-${key}`} className="text-xs capitalize">
                            {key} Font
                          </Label>
                          <Input
                            id={`font-${key}`}
                            value={value}
                            onChange={(e) =>
                              updateCustomTheme({
                                fonts: { ...customTheme.fonts, [key]: e.target.value },
                              })
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={saveCustomTheme} className="flex-1">
                      <Save className="mr-2 h-4 w-4" />
                      Save Theme
                    </Button>
                    <Button variant="outline" onClick={() => applyTheme(customTheme)}>
                      Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="space-y-4 rounded border p-4"
                    style={{
                      backgroundColor: customTheme.colors.background,
                      color: customTheme.colors.text,
                    }}
                  >
                    <h1
                      className="text-2xl font-bold"
                      style={{
                        fontFamily: customTheme.fonts.heading,
                        color: customTheme.colors.primary,
                      }}
                    >
                      Sample Heading
                    </h1>
                    <p
                      style={{
                        fontFamily: customTheme.fonts.body,
                        color: customTheme.colors.text,
                      }}
                    >
                      This is a sample paragraph showing how your theme will look. The text uses the
                      body font and text color from your theme.
                    </p>
                    <div
                      className="rounded p-3"
                      style={{
                        backgroundColor: customTheme.colors.accent + '20',
                        borderLeft: `4px solid ${customTheme.colors.accent}`,
                      }}
                    >
                      <p
                        style={{
                          fontFamily: customTheme.fonts.body,
                          color: customTheme.colors.text,
                        }}
                      >
                        This is an accented callout box.
                      </p>
                    </div>
                    <code
                      className="block rounded p-2 text-sm"
                      style={{
                        fontFamily: customTheme.fonts.monospace,
                        backgroundColor: customTheme.colors.muted + '20',
                        color: customTheme.colors.text,
                      }}
                    >
                      {`{{variable_placeholder}}`}
                    </code>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="py-12 text-center">
              <Palette className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">Create Custom Theme</h3>
              <p className="mb-4 text-muted-foreground">
                Design your own theme with custom colors, fonts, and styling.
              </p>
              <Button onClick={createCustomTheme}>
                <Palette className="mr-2 h-4 w-4" />
                Start Creating
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
