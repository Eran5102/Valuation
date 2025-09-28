/**
 * Template Persistence Service
 * Handles saving and loading templates via API routes
 * Converts between the template editor format and database format
 */

import type { ReportTemplate } from '@/lib/templates/types'

export class TemplatePersistenceService {
  /**
   * Save a template to the database
   */
  static async saveTemplate(
    template: ReportTemplate
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const method = template.id && !template.id.startsWith('template_') ? 'PUT' : 'POST'

      const response = await fetch('/api/templates', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(template),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save template')
      }

      const result = await response.json()
      return { success: true, id: result.id }
    } catch (error) {
      console.error('Failed to save template:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save template',
      }
    }
  }

  /**
   * Load a template from the database
   */
  static async loadTemplate(templateId: string): Promise<ReportTemplate | null> {
    try {
      const response = await fetch(`/api/templates?id=${templateId}`)

      if (!response.ok) {
        console.error('Failed to load template:', await response.text())
        return null
      }

      const template = await response.json()
      return template
    } catch (error) {
      console.error('Failed to load template:', error)
      return null
    }
  }

  /**
   * Load all templates from the database
   */
  static async loadTemplates(): Promise<ReportTemplate[]> {
    try {
      const response = await fetch('/api/templates')

      if (!response.ok) {
        console.error('Failed to load templates:', await response.text())
        return []
      }

      const templates = await response.json()
      return templates
    } catch (error) {
      console.error('Failed to load templates:', error)
      return []
    }
  }

  /**
   * Delete a template from the database
   */
  static async deleteTemplate(templateId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`/api/templates?id=${templateId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete template')
      }

      return { success: true }
    } catch (error) {
      console.error('Failed to delete template:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete template',
      }
    }
  }

  /**
   * Auto-save template (saves to localStorage for recovery)
   */
  static async autoSaveTemplate(template: ReportTemplate): Promise<void> {
    try {
      // Save to localStorage for recovery
      localStorage.setItem('template_autosave', JSON.stringify(template))
      localStorage.setItem('template_autosave_timestamp', new Date().toISOString())

      // Also try to save to database if template has a valid ID
      if (template.id && !template.id.startsWith('template_')) {
        await this.saveTemplate(template)
      }
    } catch (error) {
      console.error('Failed to auto-save template:', error)
    }
  }

  /**
   * Load auto-saved template from localStorage
   */
  static loadAutoSavedTemplate(): ReportTemplate | null {
    try {
      const savedTemplate = localStorage.getItem('template_autosave')
      const savedTimestamp = localStorage.getItem('template_autosave_timestamp')

      if (savedTemplate && savedTimestamp) {
        // Check if auto-save is less than 24 hours old
        const timestamp = new Date(savedTimestamp)
        const now = new Date()
        const hoursDiff = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60)

        if (hoursDiff < 24) {
          return JSON.parse(savedTemplate)
        }
      }

      return null
    } catch (error) {
      console.error('Failed to load auto-saved template:', error)
      return null
    }
  }

  /**
   * Clear auto-saved template
   */
  static clearAutoSave(): void {
    try {
      localStorage.removeItem('template_autosave')
      localStorage.removeItem('template_autosave_timestamp')
    } catch (error) {
      console.error('Failed to clear auto-save:', error)
    }
  }
}
