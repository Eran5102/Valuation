import { standard409ABlocksList } from './409a-standard-blocks'

/**
 * Initialize standard 409A blocks in the saved blocks system
 * This should be called when the template editor loads
 */

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined'

// Storage key for saved blocks - MUST match savedBlocksServiceDB
const SAVED_BLOCKS_KEY = 'savedBlocks'
const INITIALIZED_KEY = '409a-blocks-initialized-v2'

export function initialize409ABlocks(forceReset = false) {
  if (!isBrowser) return

  // Check if already initialized (unless forcing reset)
  const isInitialized = localStorage.getItem(INITIALIZED_KEY)
  if (isInitialized === 'true' && !forceReset) {
    // Still check if blocks exist, in case localStorage was cleared
    const existingBlocks = localStorage.getItem(SAVED_BLOCKS_KEY)
    if (existingBlocks) {
      const blocks = JSON.parse(existingBlocks)
      const has409ABlocks = blocks.some((b: any) => b.category === '409A Standards')
      if (has409ABlocks) {
        return // Already has 409A blocks
      }
    }
  }

  // Get existing saved blocks
  const existingBlocks = localStorage.getItem(SAVED_BLOCKS_KEY)
  let savedBlocks = existingBlocks ? JSON.parse(existingBlocks) : []

  // Add standard 409A blocks if not already present
  standard409ABlocksList.forEach((blockTemplate) => {
    const exists = savedBlocks.some((b: any) => b.id === blockTemplate.id)
    if (!exists) {
      const now = new Date().toISOString()
      // Transform to SavedBlock format expected by SavedBlocksManager
      savedBlocks.push({
        id: blockTemplate.id,
        name: blockTemplate.name,
        category: blockTemplate.category || '409A Standards',
        description: `Standard 409A section: ${blockTemplate.name}`,
        tags: ['409A', 'standard', 'system'],
        block: {
          id: `block_${blockTemplate.id}`,
          type: 'composite' as const,
          content: '',
          styling: {},
          children: blockTemplate.blocks,
        },
        createdAt: now,
        updatedAt: now, // This was missing!
      })
    }
  })

  // Save back to localStorage
  localStorage.setItem(SAVED_BLOCKS_KEY, JSON.stringify(savedBlocks))
  localStorage.setItem(INITIALIZED_KEY, 'true')

  console.log(`409A standard blocks initialized successfully. Total blocks: ${savedBlocks.length}`)
}

// Function to get all standard block categories
export function get409ABlockCategories() {
  return ['Legal & Compliance', 'Reference', 'Methodology', 'Analysis']
}

// Function to reset initialization (useful for development)
export function reset409ABlocksInitialization() {
  if (!isBrowser) return
  localStorage.removeItem(INITIALIZED_KEY)
  console.log('409A blocks initialization reset')
}
