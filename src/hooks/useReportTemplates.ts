import { useState, useEffect, useCallback } from 'react'
import { ReportTemplateService } from '@/services/reportTemplateService'
import type { ReportTemplate, VariableMapping } from '@/types/reports'

interface UseReportTemplatesOptions {
  type?: string
  autoLoad?: boolean
}

export function useReportTemplates({ type, autoLoad = true }: UseReportTemplatesOptions = {}) {
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [currentTemplate, setCurrentTemplate] = useState<ReportTemplate | null>(null)
  const [variableMappings, setVariableMappings] = useState<VariableMapping[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load templates on mount
  useEffect(() => {
    if (autoLoad) {
      loadTemplates()
    }
  }, [type, autoLoad])

  // Load variable mappings when current template changes
  useEffect(() => {
    if (currentTemplate?.id) {
      loadVariableMappings(currentTemplate.id)
    } else {
      setVariableMappings([])
    }
  }, [currentTemplate?.id])

  const loadTemplates = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await ReportTemplateService.loadTemplates(type)
      setTemplates(response.data)
    } catch (err) {
      setError('Failed to load templates')
    } finally {
      setIsLoading(false)
    }
  }, [type])

  const loadTemplate = useCallback(async (templateId: string) => {
    try {
      setError(null)
      const template = await ReportTemplateService.loadTemplate(templateId)
      if (template) {
        setCurrentTemplate(template)
        return template
      }
      return null
    } catch (err) {
      setError('Failed to load template')
      return null
    }
  }, [])

  const saveTemplate = useCallback(
    async (template: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => {
      try {
        setError(null)
        const savedTemplate = await ReportTemplateService.saveTemplate(template)
        if (savedTemplate) {
          await loadTemplates() // Reload templates
          setCurrentTemplate(savedTemplate)
          return savedTemplate
        }
        return null
      } catch (err) {
        setError('Failed to save template')
        return null
      }
    },
    [loadTemplates]
  )

  const updateTemplate = useCallback(
    async (templateId: string, updates: Partial<ReportTemplate>) => {
      try {
        setError(null)
        const updatedTemplate = await ReportTemplateService.updateTemplate(templateId, updates)
        if (updatedTemplate) {
          await loadTemplates() // Reload templates
          if (currentTemplate?.id === templateId) {
            setCurrentTemplate(updatedTemplate)
          }
          return updatedTemplate
        }
        return null
      } catch (err) {
        setError('Failed to update template')
        return null
      }
    },
    [currentTemplate, loadTemplates]
  )

  const deleteTemplate = useCallback(
    async (templateId: string) => {
      try {
        setError(null)
        const success = await ReportTemplateService.deleteTemplate(templateId)
        if (success) {
          await loadTemplates() // Reload templates
          if (currentTemplate?.id === templateId) {
            setCurrentTemplate(null)
          }
        }
        return success
      } catch (err) {
        setError('Failed to delete template')
        return false
      }
    },
    [currentTemplate, loadTemplates]
  )

  const duplicateTemplate = useCallback(
    async (templateId: string, newName: string) => {
      try {
        setError(null)
        const duplicatedTemplate = await ReportTemplateService.duplicateTemplate(
          templateId,
          newName
        )
        if (duplicatedTemplate) {
          await loadTemplates() // Reload templates
          return duplicatedTemplate
        }
        return null
      } catch (err) {
        setError('Failed to duplicate template')
        return null
      }
    },
    [loadTemplates]
  )

  const loadVariableMappings = useCallback(async (templateId: string) => {
    try {
      const response = await ReportTemplateService.loadVariableMappings(templateId)
      setVariableMappings(response.data)
    } catch (err) {
    }
  }, [])

  const saveVariableMapping = useCallback(
    async (mapping: Omit<VariableMapping, 'id'>) => {
      try {
        setError(null)
        const savedMapping = await ReportTemplateService.saveVariableMapping(mapping)
        if (savedMapping && currentTemplate?.id) {
          await loadVariableMappings(currentTemplate.id) // Reload mappings
          return savedMapping
        }
        return null
      } catch (err) {
        setError('Failed to save variable mapping')
        return null
      }
    },
    [currentTemplate?.id, loadVariableMappings]
  )

  const deleteVariableMapping = useCallback(
    async (mappingId: string) => {
      try {
        setError(null)
        const success = await ReportTemplateService.deleteVariableMapping(mappingId)
        if (success && currentTemplate?.id) {
          await loadVariableMappings(currentTemplate.id) // Reload mappings
        }
        return success
      } catch (err) {
        setError('Failed to delete variable mapping')
        return false
      }
    },
    [currentTemplate?.id, loadVariableMappings]
  )

  const generateVariables = useCallback(async (valuationId: number) => {
    try {
      return await ReportTemplateService.generateVariablesFromValuation(valuationId)
    } catch (err) {
      return {}
    }
  }, [])

  return {
    // State
    templates,
    currentTemplate,
    variableMappings,
    isLoading,
    error,

    // Template operations
    loadTemplates,
    loadTemplate,
    saveTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    setCurrentTemplate,

    // Variable mapping operations
    saveVariableMapping,
    deleteVariableMapping,
    loadVariableMappings,

    // Utility operations
    generateVariables,
    refresh: loadTemplates,
  }
}
