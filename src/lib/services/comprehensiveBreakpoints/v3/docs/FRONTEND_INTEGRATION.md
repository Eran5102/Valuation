# Frontend Integration Guide

## Table of Contents

1. [Overview](#overview)
2. [Component Architecture](#component-architecture)
3. [Data Fetching Patterns](#data-fetching-patterns)
4. [UI Components](#ui-components)
5. [State Management](#state-management)
6. [Real-Time Updates](#real-time-updates)
7. [Error Handling](#error-handling)
8. [Performance Optimization](#performance-optimization)
9. [Example Implementation](#example-implementation)

---

## Overview

The frontend displays breakpoint analysis results in an intuitive, interactive UI that helps users understand:

- **When** behavioral changes occur (breakpoint ranges)
- **Who** participates in each range (securities and their shares)
- **How much** each participant receives (RVPS and cumulative value)
- **Why** breakpoints exist (mathematical explanations)

### Key Design Principles

1. **Range-Based Visualization**: Display breakpoints as ranges ($X → $Y), not single points
2. **Cumulative RVPS Tracking**: Show both section RVPS and cumulative RVPS for each participant
3. **Mathematical Transparency**: Provide clear derivations and explanations
4. **Responsive Design**: Work seamlessly on desktop and mobile
5. **Real-Time Updates**: Reflect cap table changes immediately

---

## Component Architecture

### Component Hierarchy

```
BreakpointsAnalysis (Page Component)
├── BreakpointAnalysisHeader
│   ├── AnalysisSummary (counts by type)
│   ├── ConversionOrderTimeline (visual sequence)
│   └── RefreshButton (force re-analysis)
│
├── ClassRVPSAnalysisCard
│   ├── RVPSTable (per-class RVPS)
│   └── ConversionPriorityBadges
│
├── BreakpointRangeTable (Main Display)
│   ├── BreakpointRangeRow (for each breakpoint)
│   │   ├── RangeDisplay ($X → $Y)
│   │   ├── BreakpointTypeBadge
│   │   ├── ParticipantsList
│   │   │   └── ParticipantRow
│   │   │       ├── SecurityName
│   │   │       ├── SharesDisplay
│   │   │       ├── RVPSDisplay (section + cumulative)
│   │   │       └── ValueDisplay (section + cumulative)
│   │   ├── ExplanationAccordion
│   │   └── MathematicalDerivationModal
│   │
│   └── BreakpointFilters (filter by type)
│
├── CriticalValuesChart
│   └── InteractiveTimeline (visual breakpoint sequence)
│
├── AuditTrailPanel (collapsible)
│   └── AuditLogViewer
│
└── ValidationResultsPanel (collapsible)
    └── ValidationTestsList
```

### File Structure

```
src/components/breakpoints/v3/
├── BreakpointsAnalysis.tsx              # Main page component
├── BreakpointAnalysisHeader.tsx         # Summary header
├── ClassRVPSAnalysisCard.tsx            # Per-class RVPS display
├── BreakpointRangeTable.tsx             # Main table
│   ├── BreakpointRangeRow.tsx
│   ├── ParticipantRow.tsx
│   └── BreakpointFilters.tsx
├── CriticalValuesChart.tsx              # Visual timeline
├── AuditTrailPanel.tsx                  # Audit log
├── ValidationResultsPanel.tsx           # Validation tests
└── types.ts                             # Frontend-specific types
```

---

## Data Fetching Patterns

### Server Component with Streaming

```tsx
// src/app/valuations/[id]/breakpoints/page.tsx
import { Suspense } from 'react'
import { BreakpointsAnalysis } from '@/components/breakpoints/v3/BreakpointsAnalysis'
import { BreakpointsAnalysisSkeleton } from '@/components/breakpoints/v3/BreakpointsAnalysisSkeleton'

export default async function BreakpointsPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto p-6">
      <Suspense fallback={<BreakpointsAnalysisSkeleton />}>
        <BreakpointsAnalysis valuationId={params.id} />
      </Suspense>
    </div>
  )
}
```

### Client-Side Fetching with SWR

```tsx
// src/components/breakpoints/v3/BreakpointsAnalysis.tsx
'use client'

import useSWR from 'swr'
import { BreakpointAnalysisResult } from '@/lib/services/comprehensiveBreakpoints/v3/types/BreakpointTypes'

interface BreakpointsAnalysisProps {
  valuationId: string
}

export function BreakpointsAnalysis({ valuationId }: BreakpointsAnalysisProps) {
  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean
    data: BreakpointAnalysisResult
    metadata: {
      cached: boolean
      version: string
      timestamp: string
    }
  }>(`/api/valuations/${valuationId}/breakpoints`, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000, // 1 minute
  })

  if (error) {
    return <ErrorDisplay error={error} />
  }

  if (isLoading || !data) {
    return <BreakpointsAnalysisSkeleton />
  }

  const analysis = data.data

  return (
    <div className="space-y-6">
      <BreakpointAnalysisHeader
        analysis={analysis}
        metadata={data.metadata}
        onRefresh={() => mutate()}
      />

      <ClassRVPSAnalysisCard
        classRVPSAnalysis={analysis.classRVPSAnalysis}
        conversionOrder={analysis.conversionOrder}
      />

      <BreakpointRangeTable breakpoints={analysis.rangeBasedBreakpoints} />

      <CriticalValuesChart
        criticalValues={analysis.criticalValues}
        breakpoints={analysis.rangeBasedBreakpoints}
      />

      <AuditTrailPanel auditTrail={analysis.auditTrail} />

      <ValidationResultsPanel validationResults={analysis.validationResults} />
    </div>
  )
}

async function fetcher(url: string) {
  const res = await fetch(url)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error?.message || 'Failed to fetch analysis')
  }
  return res.json()
}
```

### Force Refresh Pattern

```tsx
// Force re-analysis (bypass cache)
async function handleRefresh() {
  setIsRefreshing(true)

  try {
    await fetch(`/api/valuations/${valuationId}/breakpoints`, {
      method: 'POST', // POST bypasses cache
    })

    // Revalidate SWR cache
    await mutate()

    toast.success('Analysis refreshed successfully')
  } catch (error) {
    toast.error('Failed to refresh analysis')
  } finally {
    setIsRefreshing(false)
  }
}
```

---

## UI Components

### 1. Breakpoint Range Table

**Purpose:** Main table displaying all breakpoints with participants and RVPS

```tsx
// src/components/breakpoints/v3/BreakpointRangeTable.tsx
'use client'

import { useState } from 'react'
import {
  RangeBasedBreakpoint,
  BreakpointType,
} from '@/lib/services/comprehensiveBreakpoints/v3/types/BreakpointTypes'
import { formatCurrency, formatNumber } from '@/lib/utils/formatting'

interface BreakpointRangeTableProps {
  breakpoints: RangeBasedBreakpoint[]
}

export function BreakpointRangeTable({ breakpoints }: BreakpointRangeTableProps) {
  const [selectedType, setSelectedType] = useState<BreakpointType | 'all'>('all')
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  const filteredBreakpoints =
    selectedType === 'all'
      ? breakpoints
      : breakpoints.filter((bp) => bp.breakpointType === selectedType)

  return (
    <div className="rounded-lg bg-white shadow">
      {/* Filter Bar */}
      <div className="border-b p-4">
        <BreakpointFilters
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          breakpointCounts={getBreakpointCounts(breakpoints)}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Order</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Type</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Range</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                Participants
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                Total Shares
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                Section RVPS
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredBreakpoints.map((breakpoint) => (
              <BreakpointRangeRow
                key={breakpoint.breakpointOrder}
                breakpoint={breakpoint}
                isExpanded={expandedRows.has(breakpoint.breakpointOrder)}
                onToggleExpand={() => {
                  const newExpanded = new Set(expandedRows)
                  if (expandedRows.has(breakpoint.breakpointOrder)) {
                    newExpanded.delete(breakpoint.breakpointOrder)
                  } else {
                    newExpanded.add(breakpoint.breakpointOrder)
                  }
                  setExpandedRows(newExpanded)
                }}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function getBreakpointCounts(breakpoints: RangeBasedBreakpoint[]): Record<BreakpointType, number> {
  return breakpoints.reduce(
    (counts, bp) => {
      counts[bp.breakpointType] = (counts[bp.breakpointType] || 0) + 1
      return counts
    },
    {} as Record<BreakpointType, number>
  )
}
```

### 2. Breakpoint Range Row (Expandable)

```tsx
// src/components/breakpoints/v3/BreakpointRangeRow.tsx
interface BreakpointRangeRowProps {
  breakpoint: RangeBasedBreakpoint
  isExpanded: boolean
  onToggleExpand: () => void
}

export function BreakpointRangeRow({
  breakpoint,
  isExpanded,
  onToggleExpand,
}: BreakpointRangeRowProps) {
  return (
    <>
      {/* Main Row */}
      <tr className="hover:bg-gray-50">
        <td className="px-4 py-3 text-sm">
          <span className="font-mono font-medium">{breakpoint.breakpointOrder}</span>
        </td>
        <td className="px-4 py-3">
          <BreakpointTypeBadge type={breakpoint.breakpointType} />
        </td>
        <td className="px-4 py-3 text-sm">
          <RangeDisplay
            rangeFrom={breakpoint.rangeFrom}
            rangeTo={breakpoint.rangeTo}
            isOpenEnded={breakpoint.isOpenEnded}
          />
        </td>
        <td className="px-4 py-3 text-sm">{breakpoint.participants.length} securities</td>
        <td className="px-4 py-3 font-mono text-sm">
          {formatNumber(breakpoint.totalParticipatingShares)}
        </td>
        <td className="px-4 py-3 font-mono text-sm">${formatNumber(breakpoint.sectionRVPS, 4)}</td>
        <td className="px-4 py-3">
          <button
            onClick={onToggleExpand}
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            {isExpanded ? 'Hide Details' : 'Show Details'}
          </button>
        </td>
      </tr>

      {/* Expanded Details */}
      {isExpanded && (
        <tr>
          <td colSpan={7} className="bg-gray-50 px-4 py-4">
            <div className="space-y-4">
              {/* Participants Table */}
              <div>
                <h4 className="mb-2 text-sm font-medium text-gray-700">Participants</h4>
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="py-2 text-left">Security</th>
                      <th className="py-2 text-right">Shares</th>
                      <th className="py-2 text-right">Participation %</th>
                      <th className="py-2 text-right">Section RVPS</th>
                      <th className="py-2 text-right">Cumulative RVPS</th>
                      <th className="py-2 text-right">Section Value</th>
                      <th className="py-2 text-right">Cumulative Value</th>
                      <th className="py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {breakpoint.participants.map((participant) => (
                      <ParticipantRow key={participant.securityName} participant={participant} />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Explanation */}
              <div>
                <h4 className="mb-2 text-sm font-medium text-gray-700">Explanation</h4>
                <p className="text-sm text-gray-600">{breakpoint.explanation}</p>
              </div>

              {/* Mathematical Derivation */}
              <div>
                <h4 className="mb-2 text-sm font-medium text-gray-700">Mathematical Derivation</h4>
                <pre className="overflow-x-auto rounded bg-gray-100 p-3 font-mono text-xs">
                  {breakpoint.mathematicalDerivation}
                </pre>
              </div>

              {/* Dependencies */}
              {breakpoint.dependencies.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-gray-700">Dependencies</h4>
                  <div className="flex flex-wrap gap-2">
                    {breakpoint.dependencies.map((dep) => (
                      <span
                        key={dep}
                        className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800"
                      >
                        {dep}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
```

### 3. Participant Row

```tsx
// src/components/breakpoints/v3/ParticipantRow.tsx
import { BreakpointParticipant } from '@/lib/services/comprehensiveBreakpoints/v3/types/BreakpointTypes'
import { formatCurrency, formatNumber } from '@/lib/utils/formatting'

interface ParticipantRowProps {
  participant: BreakpointParticipant
}

export function ParticipantRow({ participant }: ParticipantRowProps) {
  return (
    <tr className="hover:bg-gray-100">
      <td className="py-2">
        <div className="flex items-center gap-2">
          <SecurityIcon type={participant.securityType} />
          <span className="font-medium">{participant.securityName}</span>
        </div>
      </td>
      <td className="py-2 text-right font-mono">{formatNumber(participant.participatingShares)}</td>
      <td className="py-2 text-right font-mono">
        {(participant.participationPercentage * 100).toFixed(2)}%
      </td>
      <td className="py-2 text-right font-mono">
        ${formatNumber(participant.rvpsAtBreakpoint, 4)}
      </td>
      <td className="py-2 text-right font-mono font-semibold">
        ${formatNumber(participant.cumulativeRVPS, 4)}
      </td>
      <td className="py-2 text-right font-mono">{formatCurrency(participant.sectionValue)}</td>
      <td className="py-2 text-right font-mono font-semibold">
        {formatCurrency(participant.cumulativeValue)}
      </td>
      <td className="py-2">
        <ParticipationStatusBadge status={participant.participationStatus} />
      </td>
    </tr>
  )
}

function ParticipationStatusBadge({ status }: { status: string }) {
  const styles = {
    active: 'bg-green-100 text-green-800',
    capped: 'bg-yellow-100 text-yellow-800',
    converted: 'bg-blue-100 text-blue-800',
    exercised: 'bg-purple-100 text-purple-800',
    inactive: 'bg-gray-100 text-gray-800',
  }

  return (
    <span
      className={`rounded px-2 py-1 text-xs font-medium ${styles[status as keyof typeof styles]}`}
    >
      {status}
    </span>
  )
}
```

### 4. Class RVPS Analysis Card

```tsx
// src/components/breakpoints/v3/ClassRVPSAnalysisCard.tsx
import {
  ClassRVPSAnalysis,
  ConversionOrderResult,
} from '@/lib/services/comprehensiveBreakpoints/v3/types/FormulaTypes'

interface ClassRVPSAnalysisCardProps {
  classRVPSAnalysis: ConversionOrderResult
  conversionOrder: ClassRVPSAnalysis[]
}

export function ClassRVPSAnalysisCard({
  classRVPSAnalysis,
  conversionOrder,
}: ClassRVPSAnalysisCardProps) {
  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h3 className="mb-4 text-lg font-semibold">Per-Class RVPS Analysis</h3>

      <p className="mb-4 text-sm text-gray-600">{classRVPSAnalysis.orderingLogic}</p>

      <table className="w-full">
        <thead className="border-b">
          <tr>
            <th className="py-2 text-left">Priority</th>
            <th className="py-2 text-left">Series</th>
            <th className="py-2 text-right">Class LP</th>
            <th className="py-2 text-right">Class Shares</th>
            <th className="py-2 text-right">Class RVPS</th>
            <th className="py-2 text-left">Preference Type</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {conversionOrder.map((classAnalysis) => (
            <tr key={classAnalysis.seriesName} className="hover:bg-gray-50">
              <td className="py-3">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-800">
                  {classAnalysis.conversionPriority}
                </span>
              </td>
              <td className="py-3 font-medium">{classAnalysis.seriesName}</td>
              <td className="py-3 text-right font-mono">
                {formatCurrency(classAnalysis.classLiquidationPreference)}
              </td>
              <td className="py-3 text-right font-mono">
                {formatNumber(classAnalysis.classTotalShares)}
              </td>
              <td className="py-3 text-right font-mono font-semibold">
                ${formatNumber(classAnalysis.classRVPS, 4)}
              </td>
              <td className="py-3">
                <PreferenceTypeBadge type={classAnalysis.preferenceType} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Visual Timeline */}
      <div className="mt-6">
        <h4 className="mb-3 text-sm font-medium text-gray-700">Conversion Timeline</h4>
        <ConversionTimeline timeline={classRVPSAnalysis.timeline} />
      </div>
    </div>
  )
}
```

### 5. Critical Values Chart

```tsx
// src/components/breakpoints/v3/CriticalValuesChart.tsx
'use client'

import { CriticalValue } from '@/lib/services/comprehensiveBreakpoints/v3/types/BreakpointTypes'
import { formatCurrency } from '@/lib/utils/formatting'

interface CriticalValuesChartProps {
  criticalValues: CriticalValue[]
  breakpoints: RangeBasedBreakpoint[]
}

export function CriticalValuesChart({ criticalValues, breakpoints }: CriticalValuesChartProps) {
  // Calculate max value for scale
  const maxValue = Math.max(
    ...criticalValues.map((cv) => Number(cv.value)),
    ...breakpoints.map((bp) => Number(bp.rangeTo || bp.rangeFrom))
  )

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h3 className="mb-4 text-lg font-semibold">Critical Exit Values Timeline</h3>

      <div className="relative">
        {/* Timeline bar */}
        <div className="relative h-4 rounded-full bg-gray-200">
          {criticalValues.map((cv, idx) => {
            const position = (Number(cv.value) / maxValue) * 100
            return (
              <div
                key={idx}
                className="absolute top-0 h-full w-1 bg-blue-600"
                style={{ left: `${position}%` }}
              >
                <div className="absolute top-6 -translate-x-1/2 whitespace-nowrap">
                  <div className="text-xs font-medium text-gray-700">
                    {formatCurrency(cv.value)}
                  </div>
                  <div className="max-w-xs text-xs text-gray-500">{cv.description}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Scale markers */}
        <div className="mt-16 flex justify-between text-xs text-gray-500">
          <span>$0</span>
          <span>{formatCurrency(maxValue / 2)}</span>
          <span>{formatCurrency(maxValue)}</span>
        </div>
      </div>
    </div>
  )
}
```

---

## State Management

### Local State with useState

```tsx
// For simple UI state (filters, expanded rows, etc.)
const [selectedType, setSelectedType] = useState<BreakpointType | 'all'>('all')
const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
```

### Global State with Zustand (if needed)

```typescript
// src/stores/breakpointAnalysisStore.ts
import { create } from 'zustand'
import { BreakpointAnalysisResult } from '@/lib/services/comprehensiveBreakpoints/v3/types/BreakpointTypes'

interface BreakpointAnalysisStore {
  analyses: Record<string, BreakpointAnalysisResult>
  setAnalysis: (valuationId: string, analysis: BreakpointAnalysisResult) => void
  getAnalysis: (valuationId: string) => BreakpointAnalysisResult | undefined
}

export const useBreakpointAnalysisStore = create<BreakpointAnalysisStore>((set, get) => ({
  analyses: {},
  setAnalysis: (valuationId, analysis) =>
    set((state) => ({
      analyses: { ...state.analyses, [valuationId]: analysis },
    })),
  getAnalysis: (valuationId) => get().analyses[valuationId],
}))
```

---

## Real-Time Updates

### Supabase Realtime Subscriptions

```tsx
// Subscribe to cap table changes
useEffect(() => {
  const channel = supabase
    .channel(`cap_table_changes:${valuationId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'share_classes',
        filter: `valuation_id=eq.${valuationId}`,
      },
      async (payload) => {
        console.log('Cap table changed:', payload)

        // Invalidate cache
        await fetch(`/api/valuations/${valuationId}/breakpoints/cache`, {
          method: 'DELETE',
        })

        // Revalidate analysis
        await mutate()

        toast.info('Cap table updated. Analysis refreshed.')
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [valuationId, mutate])
```

---

## Error Handling

### Error Display Component

```tsx
// src/components/breakpoints/v3/ErrorDisplay.tsx
interface ErrorDisplayProps {
  error: {
    code: string
    message: string
    details?: any
    recommendation?: string
  }
}

export function ErrorDisplay({ error }: ErrorDisplayProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-red-600" />
        <div className="flex-1">
          <h3 className="mb-2 text-lg font-semibold text-red-900">{error.code}</h3>
          <p className="mb-4 text-red-800">{error.message}</p>

          {error.recommendation && (
            <div className="mb-4 rounded bg-red-100 p-3">
              <p className="text-sm text-red-900">
                <strong>Recommendation:</strong> {error.recommendation}
              </p>
            </div>
          )}

          {error.details && (
            <details className="text-sm">
              <summary className="mb-2 cursor-pointer font-medium text-red-900">
                Technical Details
              </summary>
              <pre className="overflow-x-auto rounded bg-red-100 p-3 text-xs">
                {JSON.stringify(error.details, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}
```

---

## Performance Optimization

### Virtualized Lists for Large Datasets

```tsx
// Use react-window for large participant lists
import { FixedSizeList } from 'react-window'

function VirtualizedParticipantList({ participants }: { participants: BreakpointParticipant[] }) {
  return (
    <FixedSizeList height={400} itemCount={participants.length} itemSize={50} width="100%">
      {({ index, style }) => (
        <div style={style}>
          <ParticipantRow participant={participants[index]} />
        </div>
      )}
    </FixedSizeList>
  )
}
```

### Memoization

```tsx
import { useMemo } from 'react'

// Memoize expensive calculations
const filteredBreakpoints = useMemo(() => {
  return selectedType === 'all'
    ? breakpoints
    : breakpoints.filter((bp) => bp.breakpointType === selectedType)
}, [breakpoints, selectedType])

// Memoize components
const MemoizedParticipantRow = memo(ParticipantRow)
```

### Code Splitting

```tsx
// Lazy load heavy components
import dynamic from 'next/dynamic'

const CriticalValuesChart = dynamic(
  () => import('./CriticalValuesChart').then((mod) => mod.CriticalValuesChart),
  { loading: () => <ChartSkeleton /> }
)

const AuditTrailPanel = dynamic(
  () => import('./AuditTrailPanel').then((mod) => mod.AuditTrailPanel),
  { ssr: false } // Don't render on server (large data)
)
```

---

## Example Implementation

### Complete Page Component

```tsx
// src/app/valuations/[id]/breakpoints/page.tsx
import { Suspense } from 'react'
import { BreakpointsAnalysis } from '@/components/breakpoints/v3/BreakpointsAnalysis'
import { BreakpointsAnalysisSkeleton } from '@/components/breakpoints/v3/BreakpointsAnalysisSkeleton'

export default async function BreakpointsPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-7xl p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Breakpoint Analysis</h1>
          <p className="mt-1 text-gray-600">
            Range-based distribution analysis with cumulative RVPS tracking
          </p>
        </div>

        <Suspense fallback={<BreakpointsAnalysisSkeleton />}>
          <BreakpointsAnalysis valuationId={params.id} />
        </Suspense>
      </div>
    </div>
  )
}
```

---

## Next Steps

For API integration, see [API_INTEGRATION.md](./API_INTEGRATION.md)

For database schema, see [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)

For module interactions, see [MODULE_INTERACTIONS.md](./MODULE_INTERACTIONS.md)

For system architecture, see [ARCHITECTURE.md](./ARCHITECTURE.md)
