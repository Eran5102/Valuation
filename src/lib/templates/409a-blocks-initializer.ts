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

  // DISABLED: No longer auto-adding 409A blocks
  // User can manually create and save their own blocks
  return
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
