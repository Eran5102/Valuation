import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ReportTemplateService } from '@/services/reportTemplateService'
import type { ReportTemplate, VariableMapping } from '@/types/reports'

// Query Keys
export const reportTemplateKeys = {
  all: ['reportTemplates'] as const,
  byType: (type?: string) => [...reportTemplateKeys.all, 'byType', type] as const,
  byId: (id: string) => [...reportTemplateKeys.all, 'byId', id] as const,
  variableMappings: (templateId: string) =>
    [...reportTemplateKeys.all, 'variableMappings', templateId] as const,
}

// Template Queries
export function useReportTemplates(type?: string, options?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: [...reportTemplateKeys.byType(type), { ...options }],
    queryFn: () => ReportTemplateService.loadTemplates(type, options),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes (templates are relatively stable)
  })
}

export function useReportTemplate(templateId: string) {
  return useQuery({
    queryKey: reportTemplateKeys.byId(templateId),
    queryFn: () => ReportTemplateService.loadTemplate(templateId),
    enabled: !!templateId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 20 * 60 * 1000, // 20 minutes (individual templates are stable)
  })
}

export function useVariableMappings(
  templateId: string,
  options?: { page?: number; limit?: number }
) {
  return useQuery({
    queryKey: [...reportTemplateKeys.variableMappings(templateId), { ...options }],
    queryFn: () => ReportTemplateService.loadVariableMappings(templateId, options),
    enabled: !!templateId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  })
}

// Template Mutations
export function useSaveReportTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (template: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt' | 'version'>) =>
      ReportTemplateService.saveTemplate(template),
    onSuccess: (data, variables) => {
      // Invalidate relevant template lists
      queryClient.invalidateQueries({ queryKey: reportTemplateKeys.all })
      if (variables.type) {
        queryClient.invalidateQueries({ queryKey: reportTemplateKeys.byType(variables.type) })
      }
      // Update the specific template in cache if we have its ID
      if (data?.id) {
        queryClient.setQueryData(reportTemplateKeys.byId(data.id), data)
      }
    },
  })
}

export function useUpdateReportTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      templateId,
      updates,
    }: {
      templateId: string
      updates: Partial<Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt'>>
    }) => ReportTemplateService.updateTemplate(templateId, updates),
    onSuccess: (data, variables) => {
      if (data) {
        // Update the specific template in cache
        queryClient.setQueryData(reportTemplateKeys.byId(variables.templateId), data)
        // Invalidate template lists to reflect changes
        queryClient.invalidateQueries({ queryKey: reportTemplateKeys.all })
        if (data.type) {
          queryClient.invalidateQueries({ queryKey: reportTemplateKeys.byType(data.type) })
        }
      }
    },
  })
}

export function useDeleteReportTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (templateId: string) => ReportTemplateService.deleteTemplate(templateId),
    onSuccess: (_data, templateId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: reportTemplateKeys.byId(templateId) })
      queryClient.removeQueries({ queryKey: reportTemplateKeys.variableMappings(templateId) })
      // Invalidate all template lists
      queryClient.invalidateQueries({ queryKey: reportTemplateKeys.all })
    },
  })
}

// Variable Mapping Mutations
export function useSaveVariableMapping() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (mapping: Omit<VariableMapping, 'id'>) =>
      ReportTemplateService.saveVariableMapping(mapping),
    onSuccess: (data, variables) => {
      // Invalidate variable mappings for the template
      queryClient.invalidateQueries({
        queryKey: reportTemplateKeys.variableMappings(variables.templateId),
      })
    },
  })
}

export function useDeleteVariableMapping() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ mappingId, templateId }: { mappingId: string; templateId: string }) =>
      ReportTemplateService.deleteVariableMapping(mappingId),
    onSuccess: (_data, variables) => {
      // Invalidate variable mappings for the template
      queryClient.invalidateQueries({
        queryKey: reportTemplateKeys.variableMappings(variables.templateId),
      })
    },
  })
}
