'use client'

import type { ReportTemplate, GeneratedReport } from '@/lib/templates/types'

export interface SavedDraft {
  id: string
  name: string
  template: ReportTemplate
  data: Record<string, any>
  generatedHTML?: string
  status: 'draft' | 'final'
  createdAt: string
  updatedAt: string
  clientName?: string
  description?: string
}

class DraftService {
  private readonly STORAGE_KEY = 'valuation_drafts'

  /**
   * Get all saved drafts from localStorage
   */
  getAllDrafts(): SavedDraft[] {
    try {
      const drafts = localStorage.getItem(this.STORAGE_KEY)
      return drafts ? JSON.parse(drafts) : []
    } catch (error) {
      return []
    }
  }

  /**
   * Get a specific draft by ID
   */
  getDraft(id: string): SavedDraft | null {
    const drafts = this.getAllDrafts()
    return drafts.find((draft) => draft.id === id) || null
  }

  /**
   * Save a new draft or update existing one
   */
  saveDraft(
    draft: Omit<SavedDraft, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): SavedDraft {
    const drafts = this.getAllDrafts()
    const now = new Date().toISOString()

    let savedDraft: SavedDraft

    if (draft.id) {
      // Update existing draft
      const index = drafts.findIndex((d) => d.id === draft.id)
      if (index !== -1) {
        savedDraft = {
          ...drafts[index],
          ...draft,
          id: draft.id,
          updatedAt: now,
        }
        drafts[index] = savedDraft
      } else {
        // Create new if not found
        savedDraft = {
          ...draft,
          id: this.generateId(),
          createdAt: now,
          updatedAt: now,
        }
        drafts.unshift(savedDraft)
      }
    } else {
      // Create new draft
      savedDraft = {
        ...draft,
        id: this.generateId(),
        createdAt: now,
        updatedAt: now,
      }
      drafts.unshift(savedDraft)
    }

    this.saveDrafts(drafts)
    return savedDraft
  }

  /**
   * Delete a draft
   */
  deleteDraft(id: string): boolean {
    const drafts = this.getAllDrafts()
    const filteredDrafts = drafts.filter((draft) => draft.id !== id)

    if (filteredDrafts.length !== drafts.length) {
      this.saveDrafts(filteredDrafts)
      return true
    }
    return false
  }

  /**
   * Duplicate a draft
   */
  duplicateDraft(id: string, newName?: string): SavedDraft | null {
    const originalDraft = this.getDraft(id)
    if (!originalDraft) return null

    const duplicatedDraft = {
      ...originalDraft,
      name: newName || `${originalDraft.name} (Copy)`,
      status: 'draft' as const,
    }

    delete (duplicatedDraft as any).id
    return this.saveDraft(duplicatedDraft)
  }

  /**
   * Finalize a draft (change status to final)
   */
  finalizeDraft(id: string): SavedDraft | null {
    const draft = this.getDraft(id)
    if (!draft) return null

    return this.saveDraft({
      ...draft,
      status: 'final',
    })
  }

  /**
   * Get drafts with statistics
   */
  getDraftStatistics() {
    const drafts = this.getAllDrafts()
    return {
      total: drafts.length,
      drafts: drafts.filter((d) => d.status === 'draft').length,
      final: drafts.filter((d) => d.status === 'final').length,
      recent: drafts.filter((d) => {
        const updatedAt = new Date(d.updatedAt)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return updatedAt > weekAgo
      }).length,
    }
  }

  /**
   * Export draft as JSON
   */
  exportDraft(id: string): string | null {
    const draft = this.getDraft(id)
    if (!draft) return null

    return JSON.stringify(draft, null, 2)
  }

  /**
   * Import draft from JSON
   */
  importDraft(jsonString: string): SavedDraft | null {
    try {
      const draft = JSON.parse(jsonString)

      // Validate basic structure
      if (!draft.template || !draft.name) {
        throw new Error('Invalid draft format')
      }

      // Remove ID to create as new
      delete draft.id
      return this.saveDraft(draft)
    } catch (error) {
      return null
    }
  }

  /**
   * Clear all drafts (for cleanup)
   */
  clearAllDrafts(): void {
    localStorage.removeItem(this.STORAGE_KEY)
  }

  /**
   * Private methods
   */
  private saveDrafts(drafts: SavedDraft[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(drafts))
    } catch (error) {
    }
  }

  private generateId(): string {
    return `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// Export singleton instance
export const draftService = new DraftService()
export default draftService
