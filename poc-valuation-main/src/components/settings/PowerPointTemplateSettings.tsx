import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileUp, X } from 'lucide-react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'
import { PowerPointTemplateOptions } from '@/components/report/DynamicContentFormatting'

interface PowerPointTemplateSettingsProps {
  powerPointTemplate: PowerPointTemplateOptions
  onTemplateChange: (template: PowerPointTemplateOptions) => void
}

export function PowerPointTemplateSettings({
  powerPointTemplate,
  onTemplateChange,
}: PowerPointTemplateSettingsProps) {
  const [fileInputKey, setFileInputKey] = useState<number>(0)

  const handleTemplateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.name.endsWith('.pptx')) {
      toast.error('Please upload a PowerPoint (.pptx) file')
      return
    }

    // Update template options
    onTemplateChange({
      ...powerPointTemplate,
      templateFile: file,
      templateName: file.name,
    })

    toast.success(`Template "${file.name}" uploaded successfully`)
  }

  const handleRemoveTemplate = () => {
    onTemplateChange({
      ...powerPointTemplate,
      templateFile: null,
      templateName: undefined,
    })
    setFileInputKey((prevKey) => prevKey + 1) // Reset file input
    toast.info('PowerPoint template removed')
  }

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-lg font-medium">PowerPoint Export Settings</CardTitle>
        <CardDescription>
          Customize how your reports are exported to PowerPoint presentations
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <div className="space-y-4">
          <div>
            <Label htmlFor="pptx-template">PowerPoint Template</Label>
            <div className="mt-1 space-y-2">
              {!powerPointTemplate.templateName ? (
                <div className="flex items-center gap-2">
                  <Input
                    id="pptx-template"
                    type="file"
                    accept=".pptx"
                    key={fileInputKey}
                    className="max-w-md"
                    onChange={handleTemplateUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('pptx-template')?.click()}
                  >
                    <FileUp className="mr-1 h-4 w-4" />
                    Upload Template
                  </Button>
                </div>
              ) : (
                <div className="flex max-w-md items-center gap-2 rounded-md bg-muted/50 p-2">
                  <div className="flex-1 truncate text-sm">{powerPointTemplate.templateName}</div>
                  <Button type="button" variant="ghost" size="sm" onClick={handleRemoveTemplate}>
                    <X className="h-4 w-4" />
                    Remove
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Optional. Upload a .pptx file with your branded master slides and pre-defined
                layouts (e.g., 'Title Slide', 'Content with Chart Left', 'Full Table'). The export
                will attempt to use these layouts.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
