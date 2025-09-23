import { useState } from 'react'
import { generateProjectionLabels } from '@/utils/fiscalYearUtils'
import { AssumptionTable } from './AssumptionTable'

// This component is deprecated and should not be used.
// Use ScenarioManager for assumption management instead
// and DCFAssumptionsTab for read-only display in the DCF model

export function DCFAssumptionsInput() {
  console.error('DCFAssumptionsInput is deprecated - use Scenario Manager instead')
  return (
    <div className="rounded border border-red-400 bg-red-50 px-4 py-3 text-red-700">
      <h2 className="text-lg font-bold">DEPRECATED COMPONENT</h2>
      <p>This component should not be used. Please use the Scenario Manager instead.</p>
    </div>
  )
}
