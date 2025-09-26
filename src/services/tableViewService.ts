import { optimizedSupabase } from '@/lib/supabase/optimized-client'
import type { SavedTableView, SaveViewRequest } from '@/types/reports'

const supabase = optimizedSupabase.getClient()

/**
 * Service for managing saved table views
 */
export class TableViewService {
  /**
   * Save a new table view or update existing one
   */
  static async saveView(request: SaveViewRequest): Promise<SavedTableView | null> {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error('User not authenticated')

      // If setting as default, unset other defaults for this table
      if (request.isDefault) {
        await supabase
          .from('saved_table_views')
          .update({ is_default: false })
          .eq('table_id', request.tableId)
          .eq('created_by', user.user.id)
      }

      const { data, error } = await supabase
        .from('saved_table_views')
        .insert({
          name: request.name,
          table_id: request.tableId,
          config: request.config,
          data_source: request.dataSource,
          valuation_id: request.valuationId,
          is_global: request.isGlobal || false,
          is_default: request.isDefault || false,
          created_by: user.user.id,
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      return null
    }
  }

  /**
   * Load all views for a specific table with pagination support
   */
  static async loadViewsForTable(
    tableId: string,
    valuationId?: number,
    options?: { page?: number; limit?: number }
  ): Promise<{ data: SavedTableView[]; count: number; hasMore: boolean }> {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return { data: [], count: 0, hasMore: false }

      const { page = 1, limit = 50 } = options || {}
      const offset = (page - 1) * limit

      // Build filter for optimized query
      const filter: Record<string, any> = {
        table_id: tableId,
      }

      // Note: Complex OR conditions need to be handled with regular Supabase client
      // For now, we'll use the optimized client for simple cases and fall back for complex queries
      if (!valuationId) {
        // Use optimized query for simple case
        const result = await optimizedSupabase.optimizedQuery<SavedTableView>('saved_table_views', {
          select:
            'id, name, table_id, config, data_source, valuation_id, is_global, is_default, created_by, created_at, updated_at',
          filter,
          order: { column: 'created_at', ascending: false },
          limit,
          offset,
          cache: true,
          cacheTTL: 5 * 60 * 1000, // 5 minutes cache
        })

        if (result.error) throw result.error

        return {
          data: result.data || [],
          count: result.count || 0,
          hasMore: result.count ? result.count > offset + limit : false,
        }
      } else {
        // Fall back to regular client for complex OR queries
        let query = supabase
          .from('saved_table_views')
          .select(
            'id, name, table_id, config, data_source, valuation_id, is_global, is_default, created_by, created_at, updated_at',
            { count: 'exact' }
          )
          .eq('table_id', tableId)
          .or(`created_by.eq.${user.user.id},is_global.eq.true`)
          .or(`valuation_id.eq.${valuationId},valuation_id.is.null`)

        const { data, error, count } = await query
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)

        if (error) throw error

        return {
          data: data || [],
          count: count || 0,
          hasMore: count ? count > offset + limit : false,
        }
      }
    } catch (error) {
      return { data: [], count: 0, hasMore: false }
    }
  }

  /**
   * Load a specific view by ID
   */
  static async loadView(viewId: string): Promise<SavedTableView | null> {
    try {
      const result = await optimizedSupabase.optimizedQuery<SavedTableView>('saved_table_views', {
        select:
          'id, name, table_id, config, data_source, valuation_id, is_global, is_default, created_by, created_at, updated_at',
        filter: { id: viewId },
        limit: 1,
        cache: true,
        cacheTTL: 10 * 60 * 1000, // 10 minutes cache
      })

      if (result.error) throw result.error
      return result.data?.[0] || null
    } catch (error) {
      return null
    }
  }

  /**
   * Delete a view
   */
  static async deleteView(viewId: string): Promise<boolean> {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return false

      const { error } = await supabase
        .from('saved_table_views')
        .delete()
        .eq('id', viewId)
        .eq('created_by', user.user.id)

      if (error) throw error
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Update an existing view
   */
  static async updateView(
    viewId: string,
    updates: Partial<SaveViewRequest>
  ): Promise<SavedTableView | null> {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return null

      // If setting as default, unset other defaults
      if (updates.isDefault && updates.tableId) {
        await supabase
          .from('saved_table_views')
          .update({ is_default: false })
          .eq('table_id', updates.tableId)
          .eq('created_by', user.user.id)
          .neq('id', viewId)
      }

      const { data, error } = await supabase
        .from('saved_table_views')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', viewId)
        .eq('created_by', user.user.id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      return null
    }
  }

  /**
   * Get default view for a table
   */
  static async getDefaultView(tableId: string): Promise<SavedTableView | null> {
    try {
      const { data, error } = await supabase
        .from('saved_table_views')
        .select(
          'id, name, table_id, config, data_source, valuation_id, is_global, is_default, created_by, created_at, updated_at'
        )
        .eq('table_id', tableId)
        .eq('is_default', true)
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows
      return data
    } catch (error) {
      return null
    }
  }

  /**
   * Export view configuration for use in reports
   */
  static async exportViewForReport(viewId: string): Promise<any> {
    const view = await this.loadView(viewId)
    if (!view) return null

    return {
      id: view.id,
      name: view.name,
      config: view.config,
      dataSource: view.dataSource,
    }
  }

  /**
   * Migrate existing localStorage views to Supabase
   */
  static async migrateLocalViews(tableId: string): Promise<void> {
    try {
      const localStorageKey = `table-views-${tableId}`
      const localViews = localStorage.getItem(localStorageKey)

      if (!localViews) return

      const views = JSON.parse(localViews)
      if (!Array.isArray(views)) return

      for (const view of views) {
        await this.saveView({
          name: view.name,
          tableId: tableId,
          config: view.config,
          isGlobal: false,
          isDefault: view.isDefault || false,
        })
      }

      // Clear localStorage after successful migration
      localStorage.removeItem(localStorageKey)
    } catch (error) {
    }
  }
}
