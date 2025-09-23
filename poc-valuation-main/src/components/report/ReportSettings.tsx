import React, { useState, ChangeEvent } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ColorPicker } from '@/components/report/ColorPicker'
import { Upload, Trash2, Plus, Minus, Save } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  LogoOptions,
  WatermarkOptions,
  TypographyOptions,
  PageMarginOptions,
} from './DynamicContentFormatting'
import { PowerPointTemplateSettings } from '@/components/settings/PowerPointTemplateSettings'
import { PowerPointTemplateOptions } from './DynamicContentFormatting'
import { Slider } from '@/components/ui/slider'

// Theme presets
const THEME_PRESETS = {
  'default-light': {
    name: 'Default Light',
    colors: {
      primary: '#0f172a',
      secondary: '#475569',
      accent: '#3b82f6',
      bodyText: '#334155',
      pageBackground: '#ffffff',
      tableHeaderBg: '#0f172a',
      tableHeaderText: '#ffffff',
      tableAltRowBg: '#f8fafc',
      tableBorderColor: '#e2e8f0',
      chartColors: [
        '#3b82f6',
        '#ef4444',
        '#10b981',
        '#f59e0b',
        '#6366f1',
        '#ec4899',
        '#8b5cf6',
        '#06b6d4',
        '#84cc16',
        '#d946ef',
      ],
    },
    tableOptions: {
      headerBold: true,
      useAltRowShading: true,
    },
  },
  'professional-blue': {
    name: 'Professional Blue',
    colors: {
      primary: '#1e40af',
      secondary: '#3b82f6',
      accent: '#60a5fa',
      bodyText: '#1e293b',
      pageBackground: '#f8fafc',
      tableHeaderBg: '#1e40af',
      tableHeaderText: '#ffffff',
      tableAltRowBg: '#eff6ff',
      tableBorderColor: '#dbeafe',
      chartColors: [
        '#1e40af',
        '#3b82f6',
        '#60a5fa',
        '#93c5fd',
        '#0891b2',
        '#06b6d4',
        '#22d3ee',
        '#0ea5e9',
        '#38bdf8',
        '#7dd3fc',
      ],
    },
    tableOptions: {
      headerBold: true,
      useAltRowShading: true,
    },
  },
  'modern-dark': {
    name: 'Modern Dark',
    colors: {
      primary: '#f8fafc',
      secondary: '#cbd5e1',
      accent: '#3b82f6',
      bodyText: '#e2e8f0',
      pageBackground: '#0f172a',
      tableHeaderBg: '#1e293b',
      tableHeaderText: '#f8fafc',
      tableAltRowBg: '#1e293b',
      tableBorderColor: '#334155',
      chartColors: [
        '#3b82f6',
        '#ef4444',
        '#10b981',
        '#f59e0b',
        '#6366f1',
        '#ec4899',
        '#8b5cf6',
        '#06b6d4',
        '#84cc16',
        '#d946ef',
      ],
    },
    tableOptions: {
      headerBold: true,
      useAltRowShading: true,
    },
  },
}

// Types
export interface ThemeBranding {
  logo?: string
  logoOptions?: LogoOptions
  primary: string
  secondary: string
  accent: string
  bodyText: string
  pageBackground: string
  tableHeaderBg: string
  tableHeaderText: string
  tableAltRowBg: string
  tableBorderColor: string
  chartColors: string[]
  tableOptions?: {
    headerBold?: boolean
    useAltRowShading?: boolean
  }
  powerPointTemplate?: PowerPointTemplateOptions
  watermark?: WatermarkOptions
  typography?: TypographyOptions
  pageMargins?: PageMarginOptions
}

interface TableOptions {
  headerBold?: boolean
  useAltRowShading?: boolean
}

interface ReportSettingsProps {
  branding: ThemeBranding
  onBrandingChange: (branding: ThemeBranding) => void
}

export function ReportSettings({ branding, onBrandingChange }: ReportSettingsProps) {
  const [customPresetName, setCustomPresetName] = useState('')
  const [savedPresets, setSavedPresets] = useState(() => {
    try {
      const saved = localStorage.getItem('report_theme_presets')
      return saved ? JSON.parse(saved) : {}
    } catch (e) {
      console.error('Error loading saved presets:', e)
      return {}
    }
  })
  const [showAddPreset, setShowAddPreset] = useState(false)

  // Initialize defaults for any missing color values and table options
  const theme: ThemeBranding = {
    logo: branding.logo,
    logoOptions: branding.logoOptions || {
      placement: 'header-left',
      size: 'medium',
    },
    primary: branding.primary || '#0f172a',
    secondary: branding.secondary || '#475569',
    accent: branding.accent || '#3b82f6',
    bodyText: branding.bodyText || '#334155',
    pageBackground: branding.pageBackground || '#ffffff',
    tableHeaderBg: branding.tableHeaderBg || '#0f172a',
    tableHeaderText: branding.tableHeaderText || '#ffffff',
    tableAltRowBg: branding.tableAltRowBg || '#f8fafc',
    tableBorderColor: branding.tableBorderColor || '#e2e8f0',
    chartColors: branding.chartColors || [
      '#3b82f6',
      '#ef4444',
      '#10b981',
      '#f59e0b',
      '#6366f1',
      '#ec4899',
      '#8b5cf6',
      '#06b6d4',
      '#84cc16',
      '#d946ef',
    ],
    tableOptions: {
      headerBold:
        branding.tableOptions?.headerBold !== undefined ? branding.tableOptions.headerBold : true,
      useAltRowShading:
        branding.tableOptions?.useAltRowShading !== undefined
          ? branding.tableOptions.useAltRowShading
          : true,
    },
    powerPointTemplate: branding.powerPointTemplate || {
      templateFile: null,
      templateName: undefined,
    },
    watermark: branding.watermark || {
      type: 'none',
      opacity: 30,
      rotation: -45,
      fontSize: 72,
      color: '#8E9196',
    },
    typography: branding.typography || {
      headingFont: 'Inter',
      bodyFont: 'Inter',
    },
    pageMargins: branding.pageMargins || {
      top: 1,
      bottom: 1,
      left: 1,
      right: 1,
      unit: 'inches',
    },
  }

  const [powerPointTemplate, setPowerPointTemplate] = useState<PowerPointTemplateOptions>(
    branding.powerPointTemplate || {
      templateFile: null,
      templateName: undefined,
    }
  )

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      onBrandingChange({
        ...theme,
        logo: event.target?.result as string,
      })
    }
    reader.readAsDataURL(file)
  }

  const handleColorChange = (color: string, type: keyof ThemeBranding) => {
    onBrandingChange({
      ...theme,
      [type]: color,
    })
  }

  const handleTableOptionChange = (value: boolean, option: keyof TableOptions) => {
    onBrandingChange({
      ...theme,
      tableOptions: {
        ...theme.tableOptions,
        [option]: value,
      },
    })
  }

  const handleChartColorChange = (color: string, index: number) => {
    const updatedChartColors = [...(theme.chartColors || [])]
    updatedChartColors[index] = color

    onBrandingChange({
      ...theme,
      chartColors: updatedChartColors,
    })
  }

  const addChartColor = () => {
    if (theme.chartColors && theme.chartColors.length >= 20) {
      toast.error('Maximum of 20 chart colors allowed')
      return
    }

    const defaultColor = '#' + Math.floor(Math.random() * 16777215).toString(16)
    const updatedChartColors = [...(theme.chartColors || []), defaultColor]

    onBrandingChange({
      ...theme,
      chartColors: updatedChartColors,
    })
  }

  const removeChartColor = (index: number) => {
    if (!theme.chartColors || theme.chartColors.length <= 3) {
      toast.error('Minimum of 3 chart colors required')
      return
    }

    const updatedChartColors = theme.chartColors.filter((_, i) => i !== index)

    onBrandingChange({
      ...theme,
      chartColors: updatedChartColors,
    })
  }

  const removeLogo = () => {
    onBrandingChange({
      ...theme,
      logo: undefined,
    })
  }

  const updateLogoOption = (value: string, option: keyof LogoOptions) => {
    onBrandingChange({
      ...theme,
      logoOptions: {
        ...theme.logoOptions,
        [option]: value,
      },
    })
  }

  const loadThemePreset = (presetId: string) => {
    let preset

    // Check built-in presets first
    if (THEME_PRESETS[presetId as keyof typeof THEME_PRESETS]) {
      preset = THEME_PRESETS[presetId as keyof typeof THEME_PRESETS]
    }
    // Then check custom presets
    else if (savedPresets[presetId]) {
      preset = savedPresets[presetId]
    }

    if (preset) {
      // Keep the logo while loading preset colors
      onBrandingChange({
        ...preset.colors,
        tableOptions: preset.tableOptions,
        logo: theme.logo,
        name: preset.name,
      })
      toast.success(`Applied "${preset.name}" theme`)
    }
  }

  const saveCurrentAsPreset = () => {
    if (!customPresetName.trim()) {
      toast.error('Please enter a name for your preset')
      return
    }

    const presetId = `custom-${Date.now()}`
    const newPreset = {
      name: customPresetName,
      colors: {
        primary: theme.primary,
        secondary: theme.secondary,
        accent: theme.accent,
        bodyText: theme.bodyText,
        pageBackground: theme.pageBackground,
        tableHeaderBg: theme.tableHeaderBg,
        tableHeaderText: theme.tableHeaderText,
        tableAltRowBg: theme.tableAltRowBg,
        tableBorderColor: theme.tableBorderColor,
        chartColors: theme.chartColors,
      },
      tableOptions: theme.tableOptions,
    }

    const updatedPresets = {
      ...savedPresets,
      [presetId]: newPreset,
    }

    setSavedPresets(updatedPresets)
    localStorage.setItem('report_theme_presets', JSON.stringify(updatedPresets))

    setCustomPresetName('')
    setShowAddPreset(false)
    toast.success('Theme preset saved')
  }

  const updateBranding = (updates: Partial<ThemeBranding>) => {
    const updatedBranding = { ...branding, ...updates }
    onBrandingChange(updatedBranding)
  }

  const handlePowerPointTemplateChange = (templateOptions: PowerPointTemplateOptions) => {
    setPowerPointTemplate(templateOptions)
    updateBranding({ powerPointTemplate: templateOptions })
  }

  const handleWatermarkTypeChange = (value: 'none' | 'text' | 'image') => {
    onBrandingChange({
      ...theme,
      watermark: {
        ...theme.watermark!,
        type: value,
      },
    })
  }

  const handleWatermarkTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onBrandingChange({
      ...theme,
      watermark: {
        ...theme.watermark!,
        text: e.target.value,
      },
    })
  }

  const handleWatermarkOpacityChange = (value: number[]) => {
    onBrandingChange({
      ...theme,
      watermark: {
        ...theme.watermark!,
        opacity: value[0],
      },
    })
  }

  const handleWatermarkRotationChange = (value: number[]) => {
    onBrandingChange({
      ...theme,
      watermark: {
        ...theme.watermark!,
        rotation: value[0],
      },
    })
  }

  const handleWatermarkFontSizeChange = (value: number[]) => {
    onBrandingChange({
      ...theme,
      watermark: {
        ...theme.watermark!,
        fontSize: value[0],
      },
    })
  }

  const handleWatermarkColorChange = (color: string) => {
    onBrandingChange({
      ...theme,
      watermark: {
        ...theme.watermark!,
        color: color,
      },
    })
  }

  const handleWatermarkImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      onBrandingChange({
        ...theme,
        watermark: {
          ...theme.watermark!,
          imageUrl: event.target?.result as string,
          type: 'image',
        },
      })
    }
    reader.readAsDataURL(file)
  }

  // Typography handling functions
  const handleTypographyChange = (value: string, type: 'headingFont' | 'bodyFont') => {
    onBrandingChange({
      ...theme,
      typography: {
        ...theme.typography,
        [type]: value,
      },
    })
  }

  // Page margin handling functions
  const handleMarginChange = (value: string, margin: keyof Omit<PageMarginOptions, 'unit'>) => {
    const numValue = parseFloat(value)
    if (isNaN(numValue)) return

    onBrandingChange({
      ...theme,
      pageMargins: {
        ...theme.pageMargins!,
        [margin]: numValue,
      },
    })
  }

  const handleMarginUnitChange = (unit: 'inches' | 'cm') => {
    // Convert margins from old unit to new unit
    const conversionFactor = unit === 'cm' ? 2.54 : 1 / 2.54 // inches to cm or cm to inches
    const oldUnit = theme.pageMargins?.unit || 'inches'

    if (oldUnit !== unit) {
      onBrandingChange({
        ...theme,
        pageMargins: {
          top: parseFloat((theme.pageMargins!.top * conversionFactor).toFixed(2)),
          bottom: parseFloat((theme.pageMargins!.bottom * conversionFactor).toFixed(2)),
          left: parseFloat((theme.pageMargins!.left * conversionFactor).toFixed(2)),
          right: parseFloat((theme.pageMargins!.right * conversionFactor).toFixed(2)),
          unit,
        },
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Report Branding</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Accordion
          type="multiple"
          className="w-full"
          defaultValue={['logo', 'colors', 'table-styles', 'typography', 'page-margins']}
        >
          <AccordionItem value="logo">
            <AccordionTrigger>Company Logo</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="logo">Logo File</Label>
                  <div className="mt-2 flex items-center gap-4">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => document.getElementById('logo-upload')?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Logo
                      <Input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                    </Button>

                    {theme.logo && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={removeLogo}
                        className="flex-none"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {theme.logo && (
                    <div className="mt-3">
                      <p className="mb-1 text-sm font-medium">Preview:</p>
                      <img
                        src={theme.logo}
                        alt="Logo preview"
                        className="max-h-12 rounded border p-1"
                      />
                    </div>
                  )}
                </div>

                {theme.logo && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="logo-placement">Logo Placement</Label>
                      <RadioGroup
                        id="logo-placement"
                        value={theme.logoOptions?.placement || 'header-left'}
                        onValueChange={(value) => updateLogoOption(value, 'placement')}
                        className="grid grid-cols-2 gap-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="header-left" id="header-left" />
                          <Label htmlFor="header-left">Header Left</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="header-center" id="header-center" />
                          <Label htmlFor="header-center">Header Center</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="header-right" id="header-right" />
                          <Label htmlFor="header-right">Header Right</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="footer-left" id="footer-left" />
                          <Label htmlFor="footer-left">Footer Left</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="footer-center" id="footer-center" />
                          <Label htmlFor="footer-center">Footer Center</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="footer-right" id="footer-right" />
                          <Label htmlFor="footer-right">Footer Right</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="title-page" id="title-page" />
                          <Label htmlFor="title-page">Title Page Only</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="none" id="none-placement" />
                          <Label htmlFor="none-placement">None</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="logo-size">Logo Size</Label>
                      <Select
                        value={theme.logoOptions?.size || 'medium'}
                        onValueChange={(value) => updateLogoOption(value, 'size')}
                      >
                        <SelectTrigger id="logo-size">
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="mt-4 rounded border p-3">
                      <div className="mb-2 text-sm font-medium">Logo Placement Preview</div>
                      <div
                        className={`flex rounded bg-gray-100 p-4 justify-${
                          theme.logoOptions?.placement === 'header-left' ||
                          theme.logoOptions?.placement === 'footer-left'
                            ? 'start'
                            : theme.logoOptions?.placement === 'header-center' ||
                                theme.logoOptions?.placement === 'footer-center'
                              ? 'center'
                              : 'end'
                        }`}
                      >
                        <div
                          className={`rounded border bg-white p-2 ${
                            theme.logoOptions?.size === 'small'
                              ? 'h-8 w-16'
                              : theme.logoOptions?.size === 'medium'
                                ? 'h-12 w-24'
                                : 'h-16 w-32'
                          } flex items-center justify-center`}
                        >
                          {theme.logo ? (
                            <img
                              src={theme.logo}
                              alt="Logo preview"
                              className="max-h-full max-w-full object-contain"
                            />
                          ) : (
                            <span className="text-gray-400">Logo</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="colors">
            <AccordionTrigger>Brand Colors</AccordionTrigger>
            <AccordionContent>
              <div className="mb-4">
                <div className="mb-4 flex items-end gap-2">
                  <div className="flex-1">
                    <Label htmlFor="theme-preset">Load Theme Preset</Label>
                    <Select onValueChange={loadThemePreset}>
                      <SelectTrigger id="theme-preset" className="w-full">
                        <SelectValue placeholder="Select a theme..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default-light">Default Light</SelectItem>
                        <SelectItem value="professional-blue">Professional Blue</SelectItem>
                        <SelectItem value="modern-dark">Modern Dark</SelectItem>
                        {Object.keys(savedPresets).map((presetId) => (
                          <SelectItem key={presetId} value={presetId}>
                            {savedPresets[presetId].name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddPreset(!showAddPreset)}
                  >
                    Save Current
                  </Button>
                </div>

                {showAddPreset && (
                  <div className="mb-6 flex items-center gap-2">
                    <Input
                      value={customPresetName}
                      onChange={(e) => setCustomPresetName(e.target.value)}
                      placeholder="Enter preset name..."
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={saveCurrentAsPreset}
                      disabled={!customPresetName.trim()}
                    >
                      <Save className="mr-1 h-4 w-4" />
                      Save
                    </Button>
                  </div>
                )}

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-1 block text-sm">Primary Color</Label>
                    <p className="mb-1 text-xs text-gray-500">Used for major headings</p>
                    <ColorPicker
                      onChange={(color) => handleColorChange(color, 'primary')}
                      color={theme.primary}
                    />
                  </div>

                  <div>
                    <Label className="mb-1 block text-sm">Secondary Color</Label>
                    <p className="mb-1 text-xs text-gray-500">Used for sub-headings, borders</p>
                    <ColorPicker
                      onChange={(color) => handleColorChange(color, 'secondary')}
                      color={theme.secondary}
                    />
                  </div>

                  <div>
                    <Label className="mb-1 block text-sm">Accent Color</Label>
                    <p className="mb-1 text-xs text-gray-500">Used for highlights, active states</p>
                    <ColorPicker
                      onChange={(color) => handleColorChange(color, 'accent')}
                      color={theme.accent}
                    />
                  </div>

                  <div>
                    <Label className="mb-1 block text-sm">Body Text Color</Label>
                    <p className="mb-1 text-xs text-gray-500">Default text color</p>
                    <ColorPicker
                      onChange={(color) => handleColorChange(color, 'bodyText')}
                      color={theme.bodyText}
                    />
                  </div>

                  <div>
                    <Label className="mb-1 block text-sm">Page Background Color</Label>
                    <p className="mb-1 text-xs text-gray-500">Default page background</p>
                    <ColorPicker
                      onChange={(color) => handleColorChange(color, 'pageBackground')}
                      color={theme.pageBackground}
                    />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="table-styles">
            <AccordionTrigger>Table Styles</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <h4 className="mb-2 text-sm font-medium">Header Options</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-1 block text-sm">Header Background Color</Label>
                    <ColorPicker
                      onChange={(color) => handleColorChange(color, 'tableHeaderBg')}
                      color={theme.tableHeaderBg}
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block text-sm">Header Text Color</Label>
                    <ColorPicker
                      onChange={(color) => handleColorChange(color, 'tableHeaderText')}
                      color={theme.tableHeaderText}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="header-bold"
                    checked={theme.tableOptions?.headerBold}
                    onCheckedChange={(checked) =>
                      handleTableOptionChange(checked === true, 'headerBold')
                    }
                  />
                  <Label htmlFor="header-bold">Use Bold Font for Header Text</Label>
                </div>

                <h4 className="mb-2 mt-4 text-sm font-medium">Row & Border Options</h4>
                <div>
                  <Label className="mb-1 block text-sm">Row Border Color</Label>
                  <ColorPicker
                    onChange={(color) => handleColorChange(color, 'tableBorderColor')}
                    color={theme.tableBorderColor}
                  />
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="alt-row-shading"
                    checked={theme.tableOptions?.useAltRowShading}
                    onCheckedChange={(checked) =>
                      handleTableOptionChange(checked === true, 'useAltRowShading')
                    }
                  />
                  <Label htmlFor="alt-row-shading">
                    Use Alternating Row Shading (Zebra Striping)
                  </Label>
                </div>

                {theme.tableOptions?.useAltRowShading && (
                  <div className="ml-6 mt-3">
                    <Label className="mb-1 block text-sm">Alternating Row Background Color</Label>
                    <ColorPicker
                      onChange={(color) => handleColorChange(color, 'tableAltRowBg')}
                      color={theme.tableAltRowBg}
                    />
                  </div>
                )}

                <div className="mt-4 rounded-md border p-3">
                  <div className="mb-2 text-xs font-medium">Table Preview</div>
                  <div
                    className="overflow-hidden rounded border"
                    style={{ borderColor: theme.tableBorderColor }}
                  >
                    <table
                      className="min-w-full divide-y"
                      style={{ borderColor: theme.tableBorderColor }}
                    >
                      <thead style={{ backgroundColor: theme.tableHeaderBg }}>
                        <tr>
                          <th
                            className="px-3 py-2 text-left text-xs"
                            style={{
                              color: theme.tableHeaderText,
                              fontWeight: theme.tableOptions?.headerBold ? 'bold' : 'normal',
                              borderColor: theme.tableBorderColor,
                            }}
                          >
                            Header 1
                          </th>
                          <th
                            className="px-3 py-2 text-left text-xs"
                            style={{
                              color: theme.tableHeaderText,
                              fontWeight: theme.tableOptions?.headerBold ? 'bold' : 'normal',
                              borderColor: theme.tableBorderColor,
                            }}
                          >
                            Header 2
                          </th>
                          <th
                            className="px-3 py-2 text-left text-xs"
                            style={{
                              color: theme.tableHeaderText,
                              fontWeight: theme.tableOptions?.headerBold ? 'bold' : 'normal',
                              borderColor: theme.tableBorderColor,
                            }}
                          >
                            Header 3
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y" style={{ borderColor: theme.tableBorderColor }}>
                        <tr>
                          <td
                            className="px-3 py-2 text-xs"
                            style={{ borderColor: theme.tableBorderColor }}
                          >
                            Data 1
                          </td>
                          <td
                            className="px-3 py-2 text-xs"
                            style={{ borderColor: theme.tableBorderColor }}
                          >
                            Data 2
                          </td>
                          <td
                            className="px-3 py-2 text-xs"
                            style={{ borderColor: theme.tableBorderColor }}
                          >
                            Data 3
                          </td>
                        </tr>
                        <tr
                          style={{
                            backgroundColor: theme.tableOptions?.useAltRowShading
                              ? theme.tableAltRowBg
                              : 'transparent',
                            borderColor: theme.tableBorderColor,
                          }}
                        >
                          <td
                            className="px-3 py-2 text-xs"
                            style={{ borderColor: theme.tableBorderColor }}
                          >
                            Data 4
                          </td>
                          <td
                            className="px-3 py-2 text-xs"
                            style={{ borderColor: theme.tableBorderColor }}
                          >
                            Data 5
                          </td>
                          <td
                            className="px-3 py-2 text-xs"
                            style={{ borderColor: theme.tableBorderColor }}
                          >
                            Data 6
                          </td>
                        </tr>
                        <tr>
                          <td
                            className="px-3 py-2 text-xs"
                            style={{ borderColor: theme.tableBorderColor }}
                          >
                            Data 7
                          </td>
                          <td
                            className="px-3 py-2 text-xs"
                            style={{ borderColor: theme.tableBorderColor }}
                          >
                            Data 8
                          </td>
                          <td
                            className="px-3 py-2 text-xs"
                            style={{ borderColor: theme.tableBorderColor }}
                          >
                            Data 9
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="watermark">
            <AccordionTrigger>Watermark</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <Label>Watermark Type</Label>
                <RadioGroup
                  value={theme.watermark?.type || 'none'}
                  onValueChange={(value: 'none' | 'text' | 'image') =>
                    handleWatermarkTypeChange(value)
                  }
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="none" />
                    <Label htmlFor="none">None</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="text" id="text" />
                    <Label htmlFor="text">Text</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="image" id="image" />
                    <Label htmlFor="image">Image</Label>
                  </div>
                </RadioGroup>

                {theme.watermark?.type === 'text' && (
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="watermark-text">Watermark Text</Label>
                      <Input
                        id="watermark-text"
                        value={theme.watermark.text || ''}
                        onChange={handleWatermarkTextChange}
                        placeholder="e.g., DRAFT, CONFIDENTIAL"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="watermark-color">Watermark Color</Label>
                      <ColorPicker
                        color={theme.watermark.color || '#8E9196'}
                        onChange={handleWatermarkColorChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="watermark-opacity">Opacity (%)</Label>
                        <span className="text-sm">{theme.watermark.opacity}%</span>
                      </div>
                      <Slider
                        id="watermark-opacity"
                        min={5}
                        max={100}
                        step={5}
                        value={[theme.watermark.opacity]}
                        onValueChange={handleWatermarkOpacityChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="watermark-rotation">Rotation (degrees)</Label>
                        <span className="text-sm">{theme.watermark.rotation}°</span>
                      </div>
                      <Slider
                        id="watermark-rotation"
                        min={-90}
                        max={90}
                        step={15}
                        value={[theme.watermark.rotation]}
                        onValueChange={handleWatermarkRotationChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="watermark-font-size">Font Size</Label>
                        <span className="text-sm">{theme.watermark.fontSize}</span>
                      </div>
                      <Slider
                        id="watermark-font-size"
                        min={24}
                        max={144}
                        step={12}
                        value={[theme.watermark.fontSize || 72]}
                        onValueChange={handleWatermarkFontSizeChange}
                      />
                    </div>

                    <div className="mt-4 rounded border p-3">
                      <div className="mb-2 text-sm font-medium">Watermark Preview</div>
                      <div className="relative h-48 overflow-hidden rounded bg-gray-100 p-8">
                        <div
                          style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: `translate(-50%, -50%) rotate(${theme.watermark.rotation}deg)`,
                            opacity: theme.watermark.opacity / 100,
                            fontSize: `${theme.watermark.fontSize}px`,
                            color: theme.watermark.color,
                            fontWeight: 'bold',
                            pointerEvents: 'none',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {theme.watermark.text || 'WATERMARK'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {theme.watermark?.type === 'image' && (
                  <div className="space-y-4 pt-4">
                    <div>
                      <Label htmlFor="watermark-image">Watermark Image</Label>
                      <div className="mt-2 flex items-center gap-4">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => document.getElementById('watermark-upload')?.click()}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Image
                          <Input
                            id="watermark-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleWatermarkImageUpload}
                          />
                        </Button>
                      </div>

                      {theme.watermark.imageUrl && (
                        <div className="mt-3">
                          <p className="mb-1 text-sm font-medium">Preview:</p>
                          <img
                            src={theme.watermark.imageUrl}
                            alt="Watermark preview"
                            className="max-h-12 rounded border p-1"
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="watermark-opacity-img">Opacity (%)</Label>
                        <span className="text-sm">{theme.watermark.opacity}%</span>
                      </div>
                      <Slider
                        id="watermark-opacity-img"
                        min={5}
                        max={100}
                        step={5}
                        value={[theme.watermark.opacity]}
                        onValueChange={handleWatermarkOpacityChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="watermark-rotation-img">Rotation (degrees)</Label>
                        <span className="text-sm">{theme.watermark.rotation}°</span>
                      </div>
                      <Slider
                        id="watermark-rotation-img"
                        min={-90}
                        max={90}
                        step={15}
                        value={[theme.watermark.rotation]}
                        onValueChange={handleWatermarkRotationChange}
                      />
                    </div>

                    {theme.watermark.imageUrl && (
                      <div className="mt-4 rounded border p-3">
                        <div className="mb-2 text-sm font-medium">Watermark Preview</div>
                        <div className="relative h-48 overflow-hidden rounded bg-gray-100 p-8">
                          <div
                            style={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: `translate(-50%, -50%) rotate(${theme.watermark.rotation}deg)`,
                              opacity: theme.watermark.opacity / 100,
                              pointerEvents: 'none',
                              maxWidth: '80%',
                              maxHeight: '80%',
                            }}
                          >
                            <img
                              src={theme.watermark.imageUrl}
                              alt="Watermark"
                              style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="chart-colors">
            <AccordionTrigger>Chart Color Palette</AccordionTrigger>
            <AccordionContent>
              <div className="mb-2">
                <p className="mb-3 text-xs text-gray-500">
                  These colors will be used sequentially for data series in generated charts
                  (Football Field, Scenario Comparison, etc.)
                </p>

                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-medium">Chart Colors</h4>
                  <Button variant="outline" size="sm" onClick={addChartColor}>
                    <Plus className="mr-1 h-4 w-4" />
                    Add Color
                  </Button>
                </div>

                <div className="space-y-2">
                  {theme.chartColors?.map((color, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="min-w-[70px] text-xs font-medium">Color {index + 1}</span>
                      <ColorPicker
                        onChange={(newColor) => handleChartColorChange(newColor, index)}
                        color={color}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto h-8 w-8 p-0"
                        onClick={() => removeChartColor(index)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-md border p-3">
                  <div className="mb-2 text-xs font-medium">Color Preview</div>
                  <div className="flex flex-wrap gap-1">
                    {theme.chartColors?.map((color, index) => (
                      <div
                        key={index}
                        className="h-8 w-8 rounded border border-gray-200"
                        style={{ backgroundColor: color }}
                        title={`Chart Color ${index + 1}: ${color}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* New Typography Section */}
          <AccordionItem value="typography">
            <AccordionTrigger>Typography</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="heading-font">Heading Font</Label>
                  <Select
                    value={theme.typography?.headingFont || 'Inter'}
                    onValueChange={(value) => handleTypographyChange(value, 'headingFont')}
                  >
                    <SelectTrigger id="heading-font">
                      <SelectValue placeholder="Select heading font" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter">Inter (Default)</SelectItem>
                      <SelectItem value="Arial">Arial</SelectItem>
                      <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                      <SelectItem value="Georgia">Georgia</SelectItem>
                      <SelectItem value="Verdana">Verdana</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="body-font">Body Font</Label>
                  <Select
                    value={theme.typography?.bodyFont || 'Inter'}
                    onValueChange={(value) => handleTypographyChange(value, 'bodyFont')}
                  >
                    <SelectTrigger id="body-font">
                      <SelectValue placeholder="Select body font" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter">Inter (Default)</SelectItem>
                      <SelectItem value="Arial">Arial</SelectItem>
                      <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                      <SelectItem value="Georgia">Georgia</SelectItem>
                      <SelectItem value="Verdana">Verdana</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="mt-4 rounded border p-3">
                  <div className="mb-2 text-sm font-medium">Typography Preview</div>
                  <div className="rounded bg-gray-50 p-3">
                    <h3
                      style={{ fontFamily: theme.typography?.headingFont || 'Inter' }}
                      className="mb-2 text-lg font-bold"
                    >
                      Heading Text Sample
                    </h3>
                    <p
                      style={{ fontFamily: theme.typography?.bodyFont || 'Inter' }}
                      className="text-sm"
                    >
                      This is an example of body text using the selected font. The text should be
                      readable and properly styled for your report.
                    </p>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* New Page Margins Section */}
          <AccordionItem value="page-margins">
            <AccordionTrigger>Page Margins</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-medium">Margin Unit</span>
                  <RadioGroup
                    defaultValue={theme.pageMargins?.unit || 'inches'}
                    className="flex space-x-4"
                    onValueChange={(value: 'inches' | 'cm') => handleMarginUnitChange(value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="inches" id="inches" />
                      <Label htmlFor="inches">Inches</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cm" id="cm" />
                      <Label htmlFor="cm">Centimeters</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="margin-top">Top Margin</Label>
                    <div className="flex items-center">
                      <Input
                        id="margin-top"
                        type="number"
                        min="0"
                        step="0.1"
                        value={theme.pageMargins?.top}
                        onChange={(e) => handleMarginChange(e.target.value, 'top')}
                        className="flex-1"
                      />
                      <span className="ml-2 text-sm text-gray-500">{theme.pageMargins?.unit}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="margin-bottom">Bottom Margin</Label>
                    <div className="flex items-center">
                      <Input
                        id="margin-bottom"
                        type="number"
                        min="0"
                        step="0.1"
                        value={theme.pageMargins?.bottom}
                        onChange={(e) => handleMarginChange(e.target.value, 'bottom')}
                        className="flex-1"
                      />
                      <span className="ml-2 text-sm text-gray-500">{theme.pageMargins?.unit}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="margin-left">Left Margin</Label>
                    <div className="flex items-center">
                      <Input
                        id="margin-left"
                        type="number"
                        min="0"
                        step="0.1"
                        value={theme.pageMargins?.left}
                        onChange={(e) => handleMarginChange(e.target.value, 'left')}
                        className="flex-1"
                      />
                      <span className="ml-2 text-sm text-gray-500">{theme.pageMargins?.unit}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="margin-right">Right Margin</Label>
                    <div className="flex items-center">
                      <Input
                        id="margin-right"
                        type="number"
                        min="0"
                        step="0.1"
                        value={theme.pageMargins?.right}
                        onChange={(e) => handleMarginChange(e.target.value, 'right')}
                        className="flex-1"
                      />
                      <span className="ml-2 text-sm text-gray-500">{theme.pageMargins?.unit}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded border p-3">
                  <div className="mb-2 text-sm font-medium">Page Margins Preview</div>
                  <div className="relative aspect-[1/1.414] max-h-48 w-full bg-gray-200">
                    <div
                      className="absolute bg-white"
                      style={{
                        top: `${Math.min(40, Math.max(5, (theme.pageMargins?.top || 1) * 20))}%`,
                        bottom: `${Math.min(40, Math.max(5, (theme.pageMargins?.bottom || 1) * 20))}%`,
                        left: `${Math.min(40, Math.max(5, (theme.pageMargins?.left || 1) * 20))}%`,
                        right: `${Math.min(40, Math.max(5, (theme.pageMargins?.right || 1) * 20))}%`,
                      }}
                    >
                      <div className="flex h-full w-full flex-col items-center justify-center border border-dashed border-gray-400 text-xs text-gray-500">
                        <span>Content Area</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="pptx">
            <AccordionTrigger>PowerPoint Export</AccordionTrigger>
            <AccordionContent>
              <PowerPointTemplateSettings
                powerPointTemplate={powerPointTemplate}
                onTemplateChange={handlePowerPointTemplateChange}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}
