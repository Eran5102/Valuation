import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BadgePlus, FileText, Hash } from 'lucide-react'
import { ScrollArea } from '../ui/scroll-area'

// Define types for header and footer content
export interface HeaderFooterSection {
  left: string
  center: string
  right: string
}

export interface HeaderFooterConfig {
  header: HeaderFooterSection
  footer: HeaderFooterSection
  showOnFirstPage: boolean
}

interface HeaderFooterSettingsProps {
  config: HeaderFooterConfig
  onConfigChange: (newConfig: HeaderFooterConfig) => void
  projectName: string
  companyName: string
  valuationDate: string
  reportTitle?: string
}

interface DynamicField {
  id: string
  label: string
  value: string
}

export function HeaderFooterSettings({
  config,
  onConfigChange,
  projectName,
  companyName,
  valuationDate,
  reportTitle = 'Valuation Report',
}: HeaderFooterSettingsProps) {
  const [activeTab, setActiveTab] = useState<string>('header')

  // Dynamic fields that can be inserted
  const dynamicFields: DynamicField[] = [
    { id: 'page', label: 'Page Number', value: '[Page]' },
    { id: 'totalPages', label: 'Total Pages', value: '[TotalPages]' },
    { id: 'project', label: 'Project Name', value: '[Project]' },
    { id: 'company', label: 'Company Name', value: '[Company]' },
    { id: 'valuation', label: 'Valuation Date', value: '[ValuationDate]' },
    { id: 'title', label: 'Report Title', value: '[Title]' },
    { id: 'date', label: 'Current Date', value: '[Date]' },
  ]

  // Update specific section of the header or footer
  const updateSection = (
    type: 'header' | 'footer',
    position: 'left' | 'center' | 'right',
    value: string
  ) => {
    const newConfig = { ...config }
    newConfig[type][position] = value
    onConfigChange(newConfig)
  }

  // Insert a dynamic field at cursor position or append to the end
  const insertDynamicField = (
    type: 'header' | 'footer',
    position: 'left' | 'center' | 'right',
    field: DynamicField
  ) => {
    const currentValue = config[type][position]
    const newValue = `${currentValue}${currentValue ? ' ' : ''}${field.value}`
    updateSection(type, position, newValue)
  }

  // Toggle whether to show header/footer on first page
  const toggleShowOnFirstPage = () => {
    onConfigChange({
      ...config,
      showOnFirstPage: !config.showOnFirstPage,
    })
  }

  // Renders the form for a specific section (header or footer)
  const renderSectionForm = (type: 'header' | 'footer') => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor={`${type}-left`}>Left</Label>
          <div className="relative">
            <Input
              id={`${type}-left`}
              value={config[type].left}
              onChange={(e) => updateSection(type, 'left', e.target.value)}
              placeholder={`Left ${type} content`}
            />
            <div className="absolute right-2 top-2">
              <DynamicFieldsDropdown
                onSelect={(field) => insertDynamicField(type, 'left', field)}
                fields={dynamicFields}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${type}-center`}>Center</Label>
          <div className="relative">
            <Input
              id={`${type}-center`}
              value={config[type].center}
              onChange={(e) => updateSection(type, 'center', e.target.value)}
              placeholder={`Center ${type} content`}
            />
            <div className="absolute right-2 top-2">
              <DynamicFieldsDropdown
                onSelect={(field) => insertDynamicField(type, 'center', field)}
                fields={dynamicFields}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${type}-right`}>Right</Label>
          <div className="relative">
            <Input
              id={`${type}-right`}
              value={config[type].right}
              onChange={(e) => updateSection(type, 'right', e.target.value)}
              placeholder={`Right ${type} content`}
            />
            <div className="absolute right-2 top-2">
              <DynamicFieldsDropdown
                onSelect={(field) => insertDynamicField(type, 'right', field)}
                fields={dynamicFields}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-md border bg-muted/20 p-4">
        <h4 className="mb-2 font-medium">Preview</h4>
        <div className="flex items-center justify-between border-b pb-2">
          <div className="w-1/3 text-left text-sm text-muted-foreground">
            {replaceTokens(config[type].left, {
              projectName,
              companyName,
              valuationDate,
              reportTitle,
              pageNumber: '1',
              totalPages: '10',
            })}
          </div>
          <div className="w-1/3 text-center text-sm text-muted-foreground">
            {replaceTokens(config[type].center, {
              projectName,
              companyName,
              valuationDate,
              reportTitle,
              pageNumber: '1',
              totalPages: '10',
            })}
          </div>
          <div className="w-1/3 text-right text-sm text-muted-foreground">
            {replaceTokens(config[type].right, {
              projectName,
              companyName,
              valuationDate,
              reportTitle,
              pageNumber: '1',
              totalPages: '10',
            })}
          </div>
        </div>
      </div>
    </div>
  )

  // Helper component for dynamic field dropdown
  const DynamicFieldsDropdown = ({
    onSelect,
    fields,
  }: {
    onSelect: (field: DynamicField) => void
    fields: DynamicField[]
  }) => {
    const [isOpen, setIsOpen] = useState(false)

    return (
      <div className="relative inline-block">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-full"
          onClick={() => setIsOpen(!isOpen)}
        >
          <BadgePlus size={14} />
        </Button>

        {isOpen && (
          <div className="absolute right-0 z-50 mt-2 w-56 rounded-md border bg-background shadow-md">
            <ScrollArea className="h-auto max-h-48">
              <div className="p-1">
                {fields.map((field) => (
                  <Button
                    key={field.id}
                    variant="ghost"
                    className="h-8 w-full justify-start text-left text-xs"
                    onClick={() => {
                      onSelect(field)
                      setIsOpen(false)
                    }}
                  >
                    {field.id === 'page' || field.id === 'totalPages' ? (
                      <Hash className="mr-2 h-3 w-3" />
                    ) : (
                      <FileText className="mr-2 h-3 w-3" />
                    )}
                    {field.label}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Header & Footer</CardTitle>
        <CardDescription>
          Customize the header and footer for your report. You can insert dynamic fields like page
          numbers and project information.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4 grid grid-cols-2">
            <TabsTrigger value="header">Header</TabsTrigger>
            <TabsTrigger value="footer">Footer</TabsTrigger>
          </TabsList>

          <TabsContent value="header" className="mt-0">
            {renderSectionForm('header')}
          </TabsContent>

          <TabsContent value="footer" className="mt-0">
            {renderSectionForm('footer')}
          </TabsContent>
        </Tabs>

        <div className="mt-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="show-first-page"
              checked={config.showOnFirstPage}
              onChange={toggleShowOnFirstPage}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="show-first-page">Show on first page</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Helper function to replace tokens with actual values
function replaceTokens(
  text: string,
  values: {
    projectName: string
    companyName: string
    valuationDate: string
    reportTitle: string
    pageNumber: string
    totalPages: string
  }
): string {
  if (!text) return ''

  const now = new Date()
  const currentDate = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`

  return text
    .replace(/\[Page\]/g, values.pageNumber)
    .replace(/\[TotalPages\]/g, values.totalPages)
    .replace(/\[Project\]/g, values.projectName)
    .replace(/\[Company\]/g, values.companyName)
    .replace(/\[ValuationDate\]/g, values.valuationDate)
    .replace(/\[Title\]/g, values.reportTitle)
    .replace(/\[Date\]/g, currentDate)
}
