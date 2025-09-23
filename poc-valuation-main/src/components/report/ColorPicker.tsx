import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { TabsContent, Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ColorPickerProps {
  onChange: (color: string) => void
  color?: string
  id?: string
}

// Standard color palette
const colors = [
  '#000000',
  '#434343',
  '#666666',
  '#999999',
  '#B7B7B7',
  '#CCCCCC',
  '#FFFFFF',
  '#FF0000',
  '#FF9900',
  '#FFCC00',
  '#FFFF00',
  '#00FF00',
  '#00FFFF',
  '#0000FF',
  '#9900FF',
  '#FF00FF',
  '#F44336',
  '#E91E63',
  '#9C27B0',
  '#673AB7',
  '#3F51B5',
  '#2196F3',
  '#03A9F4',
  '#00BCD4',
  '#009688',
  '#4CAF50',
  '#8BC34A',
  '#CDDC39',
  '#FFEB3B',
  '#FFC107',
  '#FF9800',
  '#FF5722',
  '#795548',
  '#9E9E9E',
  '#607D8B',
]

// Professional palette with more muted, business-appropriate colors
const professionalColors = [
  '#0F172A',
  '#1E293B',
  '#334155',
  '#475569',
  '#64748B',
  '#94A3B8',
  '#CBD5E1',
  '#E2E8F0',
  '#F1F5F9',
  '#F8FAFC',
  '#1E40AF',
  '#1D4ED8',
  '#2563EB',
  '#3B82F6',
  '#60A5FA',
  '#93C5FD',
  '#BFDBFE',
  '#DBEAFE',
  '#EFF6FF',
  '#15803D',
  '#16A34A',
  '#22C55E',
  '#4ADE80',
  '#86EFAC',
  '#BBF7D0',
  '#DCFCE7',
  '#A16207',
  '#CA8A04',
  '#EAB308',
  '#FACC15',
  '#FDE047',
  '#FEF08A',
  '#FEF9C3',
  '#9F1239',
  '#BE123C',
  '#E11D48',
  '#F43F5E',
  '#FB7185',
  '#FDA4AF',
  '#FECDD3',
  '#6B21A8',
  '#7E22CE',
  '#9333EA',
  '#A855F7',
  '#C084FC',
  '#D8B4FE',
  '#E9D5FF',
]

export function ColorPicker({ onChange, color, id }: ColorPickerProps) {
  const [customColor, setCustomColor] = useState(color || '#000000')
  const [isOpen, setIsOpen] = useState(false)

  const handleColorChange = (newColor: string) => {
    onChange(newColor)
    setCustomColor(newColor)
    setIsOpen(false)
  }

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value
    setCustomColor(newColor)
  }

  const handleCustomColorSubmit = () => {
    onChange(customColor)
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="flex h-10 w-full items-center justify-between border border-gray-200 px-3"
          id={id}
        >
          <div className="flex items-center gap-2">
            <div
              className="h-5 w-5 rounded-sm border border-gray-200"
              style={{ backgroundColor: color || '#000000' }}
            />
            <span className="font-mono text-xs">{color || '#000000'}</span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3">
        <Tabs defaultValue="standard" className="w-full">
          <TabsList className="mb-3 grid grid-cols-2">
            <TabsTrigger value="standard">Standard</TabsTrigger>
            <TabsTrigger value="professional">Professional</TabsTrigger>
          </TabsList>
          <TabsContent value="standard" className="mt-0">
            <div className="flex flex-wrap gap-1">
              {colors.map((colorValue) => (
                <Button
                  key={colorValue}
                  onClick={() => handleColorChange(colorValue)}
                  className={`h-6 w-6 rounded-sm p-0 ${color === colorValue ? 'ring-2 ring-primary' : 'border border-gray-200'}`}
                  style={{ backgroundColor: colorValue }}
                  variant="ghost"
                  title={colorValue}
                  aria-selected={color === colorValue}
                  type="button"
                />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="professional" className="mt-0">
            <div className="flex flex-wrap gap-1">
              {professionalColors.map((colorValue) => (
                <Button
                  key={colorValue}
                  onClick={() => handleColorChange(colorValue)}
                  className={`h-6 w-6 rounded-sm p-0 ${color === colorValue ? 'ring-2 ring-primary' : 'border border-gray-200'}`}
                  style={{ backgroundColor: colorValue }}
                  variant="ghost"
                  title={colorValue}
                  aria-selected={color === colorValue}
                  type="button"
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-3 space-y-2">
          <label className="text-xs font-medium">Custom Color</label>
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={customColor}
              onChange={handleCustomColorChange}
              className="h-9 w-10 p-1"
            />
            <Input
              type="text"
              value={customColor}
              onChange={handleCustomColorChange}
              className="h-9 flex-1"
              placeholder="#000000"
            />
            <Button size="sm" onClick={handleCustomColorSubmit}>
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
