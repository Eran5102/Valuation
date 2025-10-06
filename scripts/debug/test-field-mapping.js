// Test field mapping service
import { fieldMappingService } from './src/lib/templates/fieldMappingService.ts'

console.log('Testing Field Mapping Service...')

const mappings = fieldMappingService.getAllMappings()
console.log('Total mappings:', Object.keys(mappings).length)

const variables = fieldMappingService.getMappedFieldsAsVariables()
console.log('Total variables:', variables.length)

// Group by category
const categorized = {}
variables.forEach((v) => {
  const category = v.category || 'Other'
  if (!categorized[category]) {
    categorized[category] = []
  }
  categorized[category].push(v)
})

console.log('\nCategories:')
Object.entries(categorized).forEach(([cat, vars]) => {
  console.log(`  ${cat}: ${vars.length} fields`)
})

// Show first few fields from Cap Table
const capTableCategory = categorized['Cap Table'] || []
console.log('\nCap Table fields (first 5):')
capTableCategory.slice(0, 5).forEach((field) => {
  console.log(`  - ${field.name} (${field.id})`)
})
