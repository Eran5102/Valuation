'use client'

import { useState, useCallback } from 'react'
import { TemplateEngine, standard409ATemplate, sampleValuationData } from '@/lib/templates'
import type { ReportTemplate, GeneratedReport } from '@/lib/templates/types'

interface UseTemplateEngineReturn {
  generateReport: (
    template: ReportTemplate,
    data: Record<string, any>,
    options?: { status?: 'draft' | 'final'; watermark?: boolean }
  ) => Promise<GeneratedReport>
  validateData: (
    template: ReportTemplate,
    data: Record<string, any>
  ) => { isValid: boolean; errors: string[]; warnings: string[] }
  getTemplate: () => ReportTemplate
  getSampleData: () => Record<string, any>
  isProcessing: boolean
  error: string | null
}

export function useTemplateEngine(): UseTemplateEngineReturn {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateReport = useCallback(
    async (
      template: ReportTemplate,
      data: Record<string, any>,
      options: { status?: 'draft' | 'final'; watermark?: boolean } = {}
    ): Promise<GeneratedReport> => {
      setIsProcessing(true)
      setError(null)

      try {
        // Validate data first
        const validation = TemplateEngine.validateData(template, data)
        if (!validation.isValid) {
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
        }

        // Generate the report
        const report = TemplateEngine.processTemplate(template, data, options)

        return report
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to generate report'
        setError(errorMessage)
        throw err
      } finally {
        setIsProcessing(false)
      }
    },
    []
  )

  const validateData = useCallback((template: ReportTemplate, data: Record<string, any>) => {
    return TemplateEngine.validateData(template, data)
  }, [])

  const getTemplate = useCallback(() => {
    return standard409ATemplate
  }, [])

  const getSampleData = useCallback(() => {
    return sampleValuationData
  }, [])

  return {
    generateReport,
    validateData,
    getTemplate,
    getSampleData,
    isProcessing,
    error,
  }
}
