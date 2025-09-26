'use client'

import { useEffect, useState } from 'react'
import { fieldMappingService } from '@/lib/templates/fieldMappingService'

export default function TestFieldsPage() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    const mappings = fieldMappingService.getAllMappings()
    const variables = fieldMappingService.getMappedFieldsAsVariables()

    // Group by category
    const categorized: Record<string, any[]> = {}
    variables.forEach(v => {
      const category = v.category || 'Other'
      if (!categorized[category]) {
        categorized[category] = []
      }
      categorized[category].push(v)
    })

    setData({
      totalMappings: Object.keys(mappings).length,
      totalVariables: variables.length,
      categories: categorized,
      sampleVariables: variables.slice(0, 5)
    })
  }, [])

  if (!data) return <div>Loading...</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Field Mapping Test</h1>

      <div className="mb-4">
        <p>Total Mappings: <strong>{data.totalMappings}</strong></p>
        <p>Total Variables: <strong>{data.totalVariables}</strong></p>
      </div>

      <h2 className="text-xl font-bold mb-2">Categories:</h2>
      <ul className="mb-4">
        {Object.entries(data.categories).map(([cat, vars]) => (
          <li key={cat}>
            {cat}: {(vars as any[]).length} fields
          </li>
        ))}
      </ul>

      <h2 className="text-xl font-bold mb-2">Sample Variables:</h2>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify(data.sampleVariables, null, 2)}
      </pre>

      <h2 className="text-xl font-bold mb-2">Cap Table Fields:</h2>
      <ul>
        {(data.categories['Cap Table'] || []).map((field: any) => (
          <li key={field.id}>
            {field.name} ({field.id}) - {field.type}
          </li>
        ))}
      </ul>
    </div>
  )
}