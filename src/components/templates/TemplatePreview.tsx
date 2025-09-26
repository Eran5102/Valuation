'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Eye, Download, Printer, RefreshCw } from 'lucide-react'
import { TemplateEngine, sampleValuationData } from '@/lib/templates'
import type { ReportTemplate, GeneratedReport } from '@/lib/templates/types'

interface TemplatePreviewProps {
  template: ReportTemplate
  data?: Record<string, any>
  className?: string
}

export function TemplatePreview({ template, data, className }: TemplatePreviewProps) {
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState(data || sampleValuationData)
  const [scale, setScale] = useState('100')

  useEffect(() => {
    generatePreview()
  }, [template, previewData])

  const generatePreview = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const validation = TemplateEngine.validateData(template, previewData)

      if (!validation.isValid) {
        console.warn('Validation warnings:', validation.errors)
      }

      // Debug: log template settings

      const report = TemplateEngine.processTemplate(template, previewData, {
        watermark: template.settings?.watermark?.enabled || false,
      })

      setGeneratedReport(report)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate preview')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = () => {
    if (!generatedReport) return

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(generatedReport.html)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
    }
  }

  const handleDownload = () => {
    if (!generatedReport) return

    const blob = new Blob([generatedReport.html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${template.name.replace(/\\s+/g, '_')}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className={`flex h-full flex-col ${className}`}>
      {/* Preview Controls */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-base">
            <Eye className="mr-2 h-4 w-4" />
            Template Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor="scale" className="text-sm">
                  Scale:
                </Label>
                <Select value={scale} onValueChange={setScale}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="75">75%</SelectItem>
                    <SelectItem value="100">100%</SelectItem>
                    <SelectItem value="125">125%</SelectItem>
                    <SelectItem value="150">150%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={generatePreview} disabled={isLoading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={handleDownload}
                disabled={!generatedReport}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>

              <Button size="sm" onClick={handleExport} disabled={!generatedReport}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Content */}
      <Card className="flex-1">
        <CardContent className="h-full p-0">
          {isLoading && (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <RefreshCw className="mx-auto mb-2 h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground">Generating preview...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex h-full items-center justify-center">
              <div className="text-center text-destructive">
                <p className="font-medium">Preview Error</p>
                <p className="mt-1 text-sm">{error}</p>
                <Button size="sm" variant="outline" onClick={generatePreview} className="mt-4">
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {generatedReport && !isLoading && !error && (
            <div className="h-full overflow-auto bg-gray-100 p-4">
              <div
                className="mx-auto bg-white shadow-lg"
                style={{
                  transform: `scale(${parseInt(scale) / 100})`,
                  transformOrigin: 'top center',
                  width: '8.5in',
                  minHeight: '11in',
                  padding: '1in',
                }}
              >
                <div
                  dangerouslySetInnerHTML={{ __html: generatedReport.html }}
                  className="template-preview-content"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Info */}
      {generatedReport && (
        <div className="mt-2 text-xs text-muted-foreground">
          Generated: {new Date(generatedReport.generatedAt).toLocaleString()} • Status:{' '}
          {generatedReport.status} • Watermark: {generatedReport.watermark ? 'Yes' : 'No'}
        </div>
      )}
    </div>
  )
}
