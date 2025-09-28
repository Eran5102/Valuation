/**
 * Utility to clear all 409A saved blocks from localStorage
 */

const SAVED_BLOCKS_KEY = 'savedBlocks'

export function clear409ASavedBlocks() {
  if (typeof window === 'undefined') {
    console.log('Cannot clear blocks - not in browser environment')
    return
  }

  try {
    const existingBlocks = localStorage.getItem(SAVED_BLOCKS_KEY)
    if (!existingBlocks) {
      console.log('No saved blocks found')
      return
    }

    const blocks = JSON.parse(existingBlocks)
    const filtered = blocks.filter((block: any) => {
      // Remove all 409A related blocks
      const is409A =
        block.category === '409A Standards' ||
        block.tags?.includes('409A') ||
        block.tags?.includes('standard') ||
        block.id?.startsWith('409a_')

      if (is409A) {
        console.log(`Removing 409A block: ${block.name}`)
      }

      return !is409A
    })

    localStorage.setItem(SAVED_BLOCKS_KEY, JSON.stringify(filtered))
    console.log(
      `Cleared ${blocks.length - filtered.length} 409A blocks. ${filtered.length} blocks remaining.`
    )

    // Also clear the initialization flag
    localStorage.removeItem('409a-blocks-initialized-v2')

    return filtered
  } catch (error) {
    console.error('Error clearing 409A blocks:', error)
  }
}
