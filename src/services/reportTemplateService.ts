import { optimizedSupabase } from '@/lib/supabase/optimized-client'
import type { ReportTemplate, SaveViewRequest, VariableMapping } from '@/types/reports'

const supabase = optimizedSupabase.getClient()

/**
 * Service for managing report templates and variable mappings
 */
export class ReportTemplateService {
  /**
   * Save a new report template or update existing one
   */
  static async saveTemplate(
    template: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt' | 'version'>
  ): Promise<ReportTemplate | null> {
    try {
      // For development purposes, we'll use a mock user ID if no user is authenticated
      const { data: user } = await supabase.auth.getUser()
      const userId = user.user?.id || 'demo-user-id'

      const templateData = {
        name: template.name,
        description: template.description,
        type: template.type,
        is_system: template.isSystem,
        is_active: template.isActive,
        owner_id: template.ownerId || userId,
        organization_id: template.organizationId,
        blocks: template.blocks,
        variables_schema: template.variablesSchema,
        branding: template.branding,
      }

      const { data, error } = await supabase
        .from('report_templates')
        .insert(templateData)
        .select()
        .single()

      if (error) throw error
      return this.mapDbTemplateToType(data)
    } catch (error) {
      return null
    }
  }

  /**
   * Update an existing report template
   */
  static async updateTemplate(
    templateId: string,
    updates: Partial<ReportTemplate>
  ): Promise<ReportTemplate | null> {
    try {
      // For development purposes, we'll use a mock user ID if no user is authenticated
      const { data: user } = await supabase.auth.getUser()
      const userId = user.user?.id || 'demo-user-id'
      if (!userId) throw new Error('User not authenticated')

      const updateData: any = {
        updated_at: new Date().toISOString(),
      }

      if (updates.name) updateData.name = updates.name
      if (updates.description !== undefined) updateData.description = updates.description
      if (updates.blocks) updateData.blocks = updates.blocks
      if (updates.variablesSchema) updateData.variables_schema = updates.variablesSchema
      if (updates.branding) updateData.branding = updates.branding
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive

      const { data, error } = await supabase
        .from('report_templates')
        .update(updateData)
        .eq('id', templateId)
        .eq('owner_id', userId)
        .select()
        .single()

      if (error) throw error
      return this.mapDbTemplateToType(data)
    } catch (error) {
      return null
    }
  }

  /**
   * Load all templates for current user with pagination support
   */
  static async loadTemplates(
    type?: string,
    options?: { page?: number; limit?: number }
  ): Promise<{ data: ReportTemplate[]; count: number; hasMore: boolean }> {
    try {
      // For development purposes, we'll use a mock user ID if no user is authenticated
      const { data: user } = await supabase.auth.getUser()
      const userId = user.user?.id || 'demo-user-id'
      if (!userId) return { data: [], count: 0, hasMore: false }

      const { page = 1, limit = 50 } = options || {}
      const offset = (page - 1) * limit

      // Build filter for optimized query
      const filter: Record<string, any> = {
        is_active: true,
      }

      if (type) {
        filter.type = type
      }

      // Note: Complex OR conditions need to be handled with regular Supabase client
      // For system templates or simple user filtering, we can use optimized queries
      if (!type || type === 'system') {
        // Use optimized query for system templates
        const systemFilter = { ...filter, is_system: true }
        const result = await optimizedSupabase.optimizedQuery<any>('report_templates', {
          select: '*',
          filter: systemFilter,
          order: { column: 'created_at', ascending: false },
          limit,
          offset,
          cache: true,
          cacheTTL: 10 * 60 * 1000, // 10 minutes cache for templates
        })

        if (result.error) throw result.error

        return {
          data: (result.data || []).map(this.mapDbTemplateToType),
          count: result.count || 0,
          hasMore: result.count ? result.count > offset + limit : false,
        }
      } else {
        // Fall back to regular client for complex OR queries
        let query = supabase
          .from('report_templates')
          .select('*', { count: 'exact' })
          .or(`owner_id.eq.${userId},is_system.eq.true`)
          .eq('is_active', true)

        if (type) {
          query = query.eq('type', type)
        }

        const { data, error, count } = await query
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)

        if (error) {
          throw error
        }

        return {
          data: (data || []).map(this.mapDbTemplateToType),
          count: count || 0,
          hasMore: count ? count > offset + limit : false,
        }
      }
    } catch (error) {
      return { data: [], count: 0, hasMore: false }
    }
  }

  /**
   * Load a specific template by ID
   */
  static async loadTemplate(templateId: string): Promise<ReportTemplate | null> {
    try {
      const result = await optimizedSupabase.optimizedQuery<any>('report_templates', {
        select:
          'id, name, description, type, is_system, is_active, owner_id, organization_id, blocks, variables_schema, branding, created_at, updated_at, version',
        filter: { id: templateId },
        limit: 1,
        cache: true,
        cacheTTL: 15 * 60 * 1000, // 15 minutes cache for individual templates
      })

      if (result.error) throw result.error
      return result.data?.[0] ? this.mapDbTemplateToType(result.data[0]) : null
    } catch (error) {
      return null
    }
  }

  /**
   * Delete a template
   */
  static async deleteTemplate(templateId: string): Promise<boolean> {
    try {
      // For development purposes, we'll use a mock user ID if no user is authenticated
      const { data: user } = await supabase.auth.getUser()
      const userId = user.user?.id || 'demo-user-id'
      if (!userId) return false

      const { error } = await supabase
        .from('report_templates')
        .delete()
        .eq('id', templateId)
        .eq('owner_id', userId)
        .neq('is_system', true) // Prevent deletion of system templates

      if (error) throw error
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Duplicate a template
   */
  static async duplicateTemplate(
    templateId: string,
    newName: string
  ): Promise<ReportTemplate | null> {
    try {
      const originalTemplate = await this.loadTemplate(templateId)
      if (!originalTemplate) return null

      const duplicateTemplate = {
        ...originalTemplate,
        name: newName,
        isSystem: false,
        ownerId: undefined, // Will be set to current user
        organizationId: originalTemplate.organizationId,
      }

      // Remove computed fields
      delete (duplicateTemplate as any).id
      delete (duplicateTemplate as any).createdAt
      delete (duplicateTemplate as any).updatedAt
      delete (duplicateTemplate as any).version

      return await this.saveTemplate(duplicateTemplate)
    } catch (error) {
      return null
    }
  }

  /**
   * Save variable mapping for a template
   */
  static async saveVariableMapping(
    mapping: Omit<VariableMapping, 'id'>
  ): Promise<VariableMapping | null> {
    try {
      const { data, error } = await supabase
        .from('report_variable_mappings')
        .upsert(
          {
            template_id: mapping.templateId,
            variable_path: mapping.variablePath,
            data_source: mapping.dataSource,
            source_field: mapping.sourceField,
            transform: mapping.transform,
            default_value: mapping.defaultValue,
          },
          {
            onConflict: 'template_id,variable_path',
          }
        )
        .select()
        .single()

      if (error) throw error
      return this.mapDbMappingToType(data)
    } catch (error) {
      return null
    }
  }

  /**
   * Load variable mappings for a template with pagination support
   */
  static async loadVariableMappings(
    templateId: string,
    options?: { page?: number; limit?: number }
  ): Promise<{ data: VariableMapping[]; count: number; hasMore: boolean }> {
    try {
      const { page = 1, limit = 100 } = options || {}
      const offset = (page - 1) * limit

      const result = await optimizedSupabase.optimizedQuery<any>('report_variable_mappings', {
        select: '*',
        filter: { template_id: templateId },
        limit,
        offset,
        cache: true,
        cacheTTL: 5 * 60 * 1000, // 5 minutes cache for variable mappings
      })

      if (result.error) throw result.error

      return {
        data: (result.data || []).map(this.mapDbMappingToType),
        count: result.count || 0,
        hasMore: result.count ? result.count > offset + limit : false,
      }
    } catch (error) {
      return { data: [], count: 0, hasMore: false }
    }
  }

  /**
   * Delete variable mapping
   */
  static async deleteVariableMapping(mappingId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('report_variable_mappings').delete().eq('id', mappingId)

      if (error) throw error
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Generate variables from valuation data
   */
  static async generateVariablesFromValuation(valuationId: number): Promise<Record<string, any>> {
    try {
      // This would fetch actual valuation data from your database
      // For now, returning sample structure
      return {
        company: {
          name: 'Sample Company Inc.',
          state: 'Delaware',
          description: 'Technology company',
        },
        valuation: {
          date: new Date().toISOString().split('T')[0],
          fairMarketValue: 12.5,
          totalEquityValue: 50000000,
          totalShares: 4000000,
          method: 'Black-Scholes Option Pricing Model',
        },
        assumptions: {
          discountRate: 0.25,
          termYears: 5,
          volatility: 0.45,
        },
      }
    } catch (error) {
      return {}
    }
  }

  /**
   * Map database template to TypeScript type
   */
  private static mapDbTemplateToType(dbTemplate: any): ReportTemplate {
    return {
      id: dbTemplate.id,
      name: dbTemplate.name,
      description: dbTemplate.description,
      type: dbTemplate.type,
      isSystem: dbTemplate.is_system,
      isActive: dbTemplate.is_active,
      ownerId: dbTemplate.owner_id,
      organizationId: dbTemplate.organization_id,
      blocks: dbTemplate.blocks || [],
      variablesSchema: dbTemplate.variables_schema || {},
      branding: dbTemplate.branding || {
        primaryColor: '#124E66',
        fontFamily: 'Inter',
        headerEnabled: true,
        footerEnabled: true,
      },
      createdAt: dbTemplate.created_at,
      updatedAt: dbTemplate.updated_at,
      version: dbTemplate.version || 1,
    }
  }

  /**
   * Map database mapping to TypeScript type
   */
  private static mapDbMappingToType(dbMapping: any): VariableMapping {
    return {
      id: dbMapping.id,
      templateId: dbMapping.template_id,
      variablePath: dbMapping.variable_path,
      dataSource: dbMapping.data_source,
      sourceField: dbMapping.source_field,
      transform: dbMapping.transform,
      defaultValue: dbMapping.default_value,
    }
  }
}
