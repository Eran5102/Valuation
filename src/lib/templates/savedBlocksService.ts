import type { TemplateBlock } from './types'

export interface SavedBlock {
  id: string
  name: string
  description?: string
  block: TemplateBlock
  category: string
  tags: string[]
  createdAt: string
  updatedAt: string
  isPublic?: boolean
  userId?: string
}

const STORAGE_KEY = 'saved_blocks'
const STORAGE_VERSION = '1.0'

class SavedBlocksService {
  private cache: Map<string, SavedBlock> = new Map()
  private initialized = false

  private async initialize() {
    if (this.initialized) return

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const { version, blocks } = JSON.parse(stored)
        if (version === STORAGE_VERSION && Array.isArray(blocks)) {
          blocks.forEach((block) => {
            this.cache.set(block.id, block)
          })
        }
      }
      this.initialized = true
    } catch (error) {
      console.error('Failed to load saved blocks from localStorage:', error)
      this.initialized = true
    }
  }

  private async persist() {
    try {
      const blocks = Array.from(this.cache.values())
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: STORAGE_VERSION,
          blocks,
        })
      )
    } catch (error) {
      console.error('Failed to persist saved blocks to localStorage:', error)
      throw new Error('Failed to save blocks')
    }
  }

  async getSavedBlocks(): Promise<SavedBlock[]> {
    await this.initialize()
    return Array.from(this.cache.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  }

  async getSavedBlocksByCategory(category: string): Promise<SavedBlock[]> {
    await this.initialize()
    return Array.from(this.cache.values())
      .filter((block) => block.category === category)
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  async getSavedBlockById(id: string): Promise<SavedBlock | null> {
    await this.initialize()
    return this.cache.get(id) || null
  }

  async saveBlock(block: Omit<SavedBlock, 'id' | 'createdAt' | 'updatedAt'>): Promise<SavedBlock> {
    await this.initialize()

    const savedBlock: SavedBlock = {
      ...block,
      id: `saved_block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    this.cache.set(savedBlock.id, savedBlock)
    await this.persist()
    return savedBlock
  }

  async updateBlock(
    id: string,
    updates: Partial<Omit<SavedBlock, 'id' | 'createdAt'>>
  ): Promise<SavedBlock | null> {
    await this.initialize()

    const existing = this.cache.get(id)
    if (!existing) return null

    const updated: SavedBlock = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    this.cache.set(id, updated)
    await this.persist()
    return updated
  }

  async deleteBlock(id: string): Promise<boolean> {
    await this.initialize()

    const deleted = this.cache.delete(id)
    if (deleted) {
      await this.persist()
    }
    return deleted
  }

  async searchBlocks(query: string): Promise<SavedBlock[]> {
    await this.initialize()

    const lowercaseQuery = query.toLowerCase()
    return Array.from(this.cache.values()).filter(
      (block) =>
        block.name.toLowerCase().includes(lowercaseQuery) ||
        block.description?.toLowerCase().includes(lowercaseQuery) ||
        block.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery))
    )
  }

  async getCategories(): Promise<string[]> {
    await this.initialize()

    const categories = new Set<string>()
    this.cache.forEach((block) => categories.add(block.category))
    return Array.from(categories).sort()
  }

  async getTags(): Promise<string[]> {
    await this.initialize()

    const tags = new Set<string>()
    this.cache.forEach((block) => {
      block.tags.forEach((tag) => tags.add(tag))
    })
    return Array.from(tags).sort()
  }

  // Create default saved blocks for common use cases
  async createDefaultBlocks() {
    await this.initialize()

    if (this.cache.size > 0) return // Already have blocks

    const defaultBlocks: Omit<SavedBlock, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Executive Summary Header',
        description: 'Standard header for executive summary sections',
        category: 'Headers',
        tags: ['header', 'executive', 'summary'],
        block: {
          id: 'default_exec_header',
          type: 'header',
          content: 'Executive Summary',
          styling: {
            fontSize: 24,
            fontWeight: 'bold',
            textAlign: 'center',
            margin: '0 0 20px 0',
          },
        },
      },
      {
        name: 'Valuation Conclusion',
        description: 'Standard valuation conclusion paragraph',
        category: 'Conclusions',
        tags: ['conclusion', 'valuation', 'summary'],
        block: {
          id: 'default_conclusion',
          type: 'paragraph',
          content:
            'Based on our comprehensive analysis of {{company.name}}, we have determined the fair market value of the {{valuation.security_type}} to be ${{valuation.fair_market_value}} per share as of {{valuation.date}}.',
          styling: {
            fontSize: 14,
            textAlign: 'justify',
            margin: '10px 0',
          },
        },
      },
      {
        name: 'Financial Metrics Table',
        description: 'Standard table for key financial metrics',
        category: 'Tables',
        tags: ['table', 'financial', 'metrics'],
        block: {
          id: 'default_metrics_table',
          type: 'table',
          content: {
            headers: ['Metric', 'Current Period', 'Prior Period', 'Change'],
            rows: [
              ['Revenue', '{{revenue.current}}', '{{revenue.prior}}', '{{revenue.change}}'],
              ['EBITDA', '{{ebitda.current}}', '{{ebitda.prior}}', '{{ebitda.change}}'],
              [
                'Net Income',
                '{{net_income.current}}',
                '{{net_income.prior}}',
                '{{net_income.change}}',
              ],
            ],
          },
          styling: {
            margin: '20px 0',
            width: '100%',
          },
        },
      },
      {
        name: 'Disclaimer',
        description: 'Standard disclaimer text',
        category: 'Legal',
        tags: ['disclaimer', 'legal', 'footer'],
        block: {
          id: 'default_disclaimer',
          type: 'quote',
          content:
            'This valuation report is provided for informational purposes only and should not be relied upon as the sole basis for any investment decision.',
          styling: {
            fontStyle: 'italic',
            borderLeft: '4px solid #dc2626',
            paddingLeft: '20px',
            margin: '20px 0',
            fontSize: 12,
          },
        },
      },
    ]

    for (const block of defaultBlocks) {
      await this.saveBlock(block)
    }
  }
}

// Singleton instance
const savedBlocksService = new SavedBlocksService()
export default savedBlocksService
