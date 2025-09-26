import type { TemplateBlock } from './types'

export interface SavedBlock {
  id: string
  name: string
  description?: string
  category: string
  tags: string[]
  block: TemplateBlock
  createdAt: string
  updatedAt: string
}

export interface SavedBlockInput {
  name: string
  description?: string
  category: string
  tags: string[]
  block: TemplateBlock
}

class SavedBlocksServiceDB {
  private readonly CACHE_KEY = 'savedBlocks'
  private cache: SavedBlock[] | null = null

  // Initialize with both database fetch and localStorage cache
  async initialize(): Promise<void> {
    try {
      // Try to fetch from database first
      const blocks = await this.fetchFromDatabase()
      if (blocks.length > 0) {
        this.cache = blocks
        // Update localStorage cache for offline access
        this.saveToLocalStorage(blocks)
      } else {
        // Fall back to localStorage if database is empty
        this.cache = this.loadFromLocalStorage()
      }
    } catch (error) {
      // Fall back to localStorage on error
      this.cache = this.loadFromLocalStorage()
    }
  }

  // Fetch saved blocks from database
  private async fetchFromDatabase(): Promise<SavedBlock[]> {
    try {
      const response = await fetch('/api/saved-blocks')
      if (!response.ok) {
        throw new Error('Failed to fetch saved blocks')
      }
      return await response.json()
    } catch (error) {
      return []
    }
  }

  // Load from localStorage
  private loadFromLocalStorage(): SavedBlock[] {
    try {
      const stored = localStorage.getItem(this.CACHE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      return []
    }
  }

  // Save to localStorage for caching
  private saveToLocalStorage(blocks: SavedBlock[]): void {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(blocks))
    } catch (error) {
    }
  }

  // Get all saved blocks (from cache)
  async getSavedBlocks(): Promise<SavedBlock[]> {
    if (!this.cache) {
      await this.initialize()
    }
    return this.cache || []
  }

  // Get categories from saved blocks
  async getCategories(): Promise<string[]> {
    const blocks = await this.getSavedBlocks()
    const categories = new Set(blocks.map(b => b.category))
    return Array.from(categories).sort()
  }

  // Save a new block (to both database and cache)
  async saveBlock(input: SavedBlockInput): Promise<SavedBlock> {
    try {
      // Save to database
      const response = await fetch('/api/saved-blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        throw new Error('Failed to save block')
      }

      const savedBlock = await response.json()

      // Update cache
      if (this.cache) {
        this.cache.unshift(savedBlock)
        this.saveToLocalStorage(this.cache)
      }

      return savedBlock
    } catch (error) {
      // Fall back to localStorage-only save
      const localBlock: SavedBlock = {
        id: `local_${Date.now()}`,
        ...input,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      if (this.cache) {
        this.cache.unshift(localBlock)
        this.saveToLocalStorage(this.cache)
      }

      return localBlock
    }
  }

  // Update an existing block
  async updateBlock(id: string, updates: Partial<SavedBlockInput>): Promise<SavedBlock | null> {
    try {
      // Update in database
      const response = await fetch('/api/saved-blocks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      })

      if (!response.ok) {
        throw new Error('Failed to update block')
      }

      const updatedBlock = await response.json()

      // Update cache
      if (this.cache) {
        const index = this.cache.findIndex(b => b.id === id)
        if (index !== -1) {
          this.cache[index] = updatedBlock
          this.saveToLocalStorage(this.cache)
        }
      }

      return updatedBlock
    } catch (error) {

      // Fall back to localStorage-only update
      if (this.cache) {
        const index = this.cache.findIndex(b => b.id === id)
        if (index !== -1) {
          this.cache[index] = {
            ...this.cache[index],
            ...updates,
            updatedAt: new Date().toISOString(),
          }
          this.saveToLocalStorage(this.cache)
          return this.cache[index]
        }
      }

      return null
    }
  }

  // Delete a block
  async deleteBlock(id: string): Promise<boolean> {
    try {
      // Delete from database
      const response = await fetch(`/api/saved-blocks?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete block')
      }

      // Update cache
      if (this.cache) {
        this.cache = this.cache.filter(b => b.id !== id)
        this.saveToLocalStorage(this.cache)
      }

      return true
    } catch (error) {

      // Fall back to localStorage-only delete
      if (this.cache) {
        this.cache = this.cache.filter(b => b.id !== id)
        this.saveToLocalStorage(this.cache)
        return true
      }

      return false
    }
  }

  // Sync local changes with database
  async syncWithDatabase(): Promise<void> {
    try {
      const localBlocks = this.loadFromLocalStorage()
      const dbBlocks = await this.fetchFromDatabase()

      // Find blocks that exist locally but not in database (created offline)
      const localOnlyBlocks = localBlocks.filter(
        local => local.id.startsWith('local_') && !dbBlocks.find(db => db.id === local.id)
      )

      // Save local-only blocks to database
      for (const block of localOnlyBlocks) {
        await this.saveBlock({
          name: block.name,
          description: block.description,
          category: block.category,
          tags: block.tags,
          block: block.block,
        })
      }

      // Refresh cache with latest from database
      await this.initialize()
    } catch (error) {
    }
  }

  // Create default blocks if none exist
  async createDefaultBlocks(): Promise<void> {
    const blocks = await this.getSavedBlocks()
    if (blocks.length > 0) return

    const defaultBlocks: SavedBlockInput[] = [
      {
        name: 'Executive Summary Header',
        description: 'Standard header for executive summary section',
        category: 'Headers',
        tags: ['header', 'executive', 'summary'],
        block: {
          id: 'default_1',
          type: 'header',
          content: 'Executive Summary',
          styling: { fontSize: 28, fontWeight: 'bold', marginBottom: '20px' },
        },
      },
      {
        name: 'Standard Disclaimer',
        description: 'Legal disclaimer for valuation reports',
        category: 'Legal',
        tags: ['disclaimer', 'legal', 'compliance'],
        block: {
          id: 'default_2',
          type: 'paragraph',
          content: 'This valuation report is prepared for the sole use of {{company.name}} and should not be relied upon by any other party without our prior written consent.',
          styling: { fontSize: 12, fontStyle: 'italic' },
        },
      },
      {
        name: 'Valuation Methods Table',
        description: 'Table showing valuation methods and weights',
        category: 'Tables',
        tags: ['table', 'valuation', 'methods'],
        block: {
          id: 'default_3',
          type: 'table',
          content: {
            headers: ['Method', 'Weight', 'Value'],
            rows: [
              ['Market Approach', '40%', '{{valuation.market_value}}'],
              ['Income Approach', '35%', '{{valuation.income_value}}'],
              ['Asset Approach', '25%', '{{valuation.asset_value}}'],
            ],
          },
          styling: { width: '100%', margin: '20px 0' },
        },
      },
    ]

    // Save default blocks
    for (const block of defaultBlocks) {
      await this.saveBlock(block)
    }
  }
}

// Export singleton instance
const savedBlocksServiceDB = new SavedBlocksServiceDB()
export default savedBlocksServiceDB