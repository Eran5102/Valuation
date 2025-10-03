# API Integration Guide

## Table of Contents

1. [Overview](#overview)
2. [API Route Structure](#api-route-structure)
3. [Request Flow](#request-flow)
4. [Response Formats](#response-formats)
5. [Error Handling](#error-handling)
6. [Caching Strategy](#caching-strategy)
7. [Authentication & Authorization](#authentication--authorization)
8. [Rate Limiting](#rate-limiting)
9. [Example Implementation](#example-implementation)

---

## Overview

The BreakpointAnalyzer V3 integrates with Next.js 15 App Router through dedicated API routes that handle:

- Cap table data loading
- Breakpoint analysis orchestration
- Result persistence
- Response caching
- Error handling

### Key Design Principles

1. **Server-Side Analysis**: All analysis runs on the server (CPU-intensive, requires Decimal.js precision)
2. **Idempotent Requests**: Re-analyzing the same cap table produces identical results
3. **Stateless**: Each request is independent; no session state required for analysis
4. **Cacheable**: Results are cached based on cap table hash
5. **Incremental Updates**: Only re-analyze when cap table changes

---

## API Route Structure

### Endpoint Overview

```
/api/valuations/[id]/breakpoints/
├── GET     - Fetch or generate breakpoint analysis
├── POST    - Force re-analysis (bypass cache)
├── DELETE  - Clear cached analysis
└── PATCH   - Update specific breakpoint metadata
```

### File Structure

```
src/app/api/valuations/[id]/breakpoints/
├── route.ts                    # Main analysis endpoint
├── cache/
│   └── route.ts               # Cache management
├── validate/
│   └── route.ts               # Pre-analysis validation
└── types.ts                   # API-specific types
```

---

## Request Flow

### Complete Request Flow

```
1. CLIENT REQUEST
   ↓
   GET /api/valuations/:id/breakpoints

2. AUTHENTICATION CHECK
   ↓
   Verify user has access to valuation
   (Supabase Row-Level Security + JWT validation)

3. CACHE CHECK
   ↓
   const cacheKey = `breakpoints:${valuationId}:${capTableHash}`
   const cached = await redis.get(cacheKey)
   if (cached && !forceRefresh) return cached

4. LOAD CAP TABLE
   ↓
   const dbCapTable = await loadCapTableFromDB(valuationId)

5. TRANSFORM DB → DOMAIN
   ↓
   const transformer = new DatabaseToBreakpointTransformer()
   const capTable = await transformer.transform(valuationId)

6. VALIDATE INPUT
   ↓
   const validator = new CapTableValidator()
   const validation = validator.validate(capTable)
   if (!validation.isValid) throw new ValidationError(...)

7. ANALYZE BREAKPOINTS
   ↓
   const orchestrator = createOrchestrator() // Dependency injection
   const analysis = await orchestrator.analyzeBreakpoints(capTable)

8. PERSIST RESULTS
   ↓
   const dbTransformer = new BreakpointToDatabaseTransformer()
   await dbTransformer.transform(analysis, valuationId, companyId)

9. CACHE RESULTS
   ↓
   await redis.set(cacheKey, JSON.stringify(analysis), 'EX', 3600)

10. RETURN RESPONSE
    ↓
    return NextResponse.json({
      success: true,
      data: analysis,
      metadata: {
        cached: false,
        analysisTimeMs: 1243,
        version: 'v3.0.0'
      }
    })
```

---

## Response Formats

### Success Response

```typescript
// GET /api/valuations/:id/breakpoints
{
  "success": true,
  "data": {
    "totalBreakpoints": 12,
    "breakpointsByType": {
      "liquidation_preference": 3,
      "pro_rata_distribution": 1,
      "option_exercise": 4,
      "voluntary_conversion": 3,
      "participation_cap": 1
    },
    "rangeBasedBreakpoints": [
      {
        "breakpointType": "liquidation_preference",
        "breakpointOrder": 1,
        "rangeFrom": "0",
        "rangeTo": "10000000",
        "isOpenEnded": false,
        "participants": [
          {
            "securityName": "Series A",
            "securityType": "preferred_series",
            "participatingShares": "10000000",
            "participationPercentage": "1.0",
            "rvpsAtBreakpoint": "1.0",
            "cumulativeRVPS": "1.0",
            "sectionValue": "10000000",
            "cumulativeValue": "10000000",
            "participationStatus": "active"
          }
        ],
        "totalParticipatingShares": "10000000",
        "sectionRVPS": "1.0",
        "explanation": "Series A liquidation preference satisfied",
        "mathematicalDerivation": "LP = 10M shares × $1.00 × 1x = $10M",
        "calculationMethod": "cumulative_liquidation_preference",
        "dependencies": [],
        "affectedSecurities": ["Series A"],
        "priorityOrder": 100
      },
      // ... more breakpoints
    ],
    "classRVPSAnalysis": {
      "orderedClasses": [
        {
          "seriesName": "Series A",
          "classLiquidationPreference": "10000000",
          "classTotalShares": "10000000",
          "classRVPS": "1.0",
          "isParticipating": false,
          "preferenceType": "non-participating",
          "conversionPriority": 1,
          "calculationDetails": "Class RVPS = $10M LP ÷ 10M shares = $1.00/share"
        }
      ],
      "orderingLogic": "Lower RVPS converts first (lower opportunity cost)",
      "timeline": [...]
    },
    "conversionOrder": [...],
    "criticalValues": [
      {
        "value": "10000000",
        "description": "Series A liquidation preference satisfied",
        "affectedSecurities": ["Series A"],
        "triggers": ["Series A LP satisfied", "Series B LP begins"]
      }
    ],
    "auditTrail": "Step 1: Validating cap table\\nStep 2: ...",
    "validationResults": [
      {
        "testName": "LP breakpoint count matches seniority ranks",
        "passed": true,
        "expected": 3,
        "actual": 3,
        "message": "Expected 3 LP breakpoints, found 3",
        "severity": "info"
      }
    ],
    "performanceMetrics": {
      "analysisTimeMs": 1243,
      "iterationsUsed": {
        "option_exercise_solver": 24
      },
      "cacheHits": 0
    }
  },
  "metadata": {
    "cached": false,
    "version": "v3.0.0",
    "capTableHash": "a3f2e9d8c7b6...",
    "timestamp": "2024-01-15T10:30:45.123Z"
  }
}
```

### Error Response

```typescript
// Validation error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Cap table validation failed",
    "details": [
      {
        "testName": "Seniority ranks are sequential",
        "passed": false,
        "expected": [0, 1, 2],
        "actual": [0, 2, 3],
        "message": "Seniority gap detected: missing rank 1",
        "severity": "error"
      }
    ],
    "timestamp": "2024-01-15T10:30:45.123Z"
  }
}

// Solver convergence error
{
  "success": false,
  "error": {
    "code": "SOLVER_ERROR",
    "message": "Option exercise solver failed to converge",
    "details": {
      "optionPool": "2020 Employee Pool",
      "strikePrice": "1.25",
      "iterations": 50,
      "finalError": "0.0523",
      "tolerance": "0.01"
    },
    "recommendation": "Check option exercise price and cap table totals",
    "timestamp": "2024-01-15T10:30:45.123Z"
  }
}

// Authorization error
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Access denied to valuation",
    "timestamp": "2024-01-15T10:30:45.123Z"
  }
}
```

---

## Error Handling

### Error Hierarchy

```typescript
// Base error classes
class BreakpointAnalysisError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'BreakpointAnalysisError'
  }
}

class ValidationError extends BreakpointAnalysisError {
  constructor(validationResults: ValidationTestResult[]) {
    super(
      'VALIDATION_ERROR',
      'Cap table validation failed',
      validationResults.filter((r) => !r.passed)
    )
  }
}

class SolverError extends BreakpointAnalysisError {
  constructor(message: string, solverDetails: any) {
    super('SOLVER_ERROR', message, solverDetails)
  }
}

class CalculationError extends BreakpointAnalysisError {
  constructor(message: string, calculationDetails: any) {
    super('CALCULATION_ERROR', message, calculationDetails)
  }
}
```

### API Error Handler

```typescript
// src/app/api/valuations/[id]/breakpoints/route.ts

import { NextRequest, NextResponse } from 'next/server'
import {
  ValidationError,
  SolverError,
  CalculationError,
  BreakpointAnalysisError,
} from '@/lib/services/comprehensiveBreakpoints/v3/errors'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Analysis logic...
    const analysis = await analyzeBreakpoints(params.id)

    return NextResponse.json({
      success: true,
      data: analysis,
      metadata: {
        cached: false,
        version: 'v3.0.0',
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    // Structured error handling
    if (error instanceof ValidationError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      )
    }

    if (error instanceof SolverError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
            recommendation: 'Check option exercise prices and cap table totals',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 500 }
      )
    }

    if (error instanceof BreakpointAnalysisError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 500 }
      )
    }

    // Unexpected errors
    console.error('Unexpected error in breakpoint analysis:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred during analysis',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    )
  }
}
```

---

## Caching Strategy

### Cache Key Structure

```typescript
// Cache key format: breakpoints:{valuationId}:{capTableHash}
function generateCacheKey(valuationId: string, capTable: CapTableSnapshot): string {
  const capTableHash = hashCapTable(capTable)
  return `breakpoints:${valuationId}:${capTableHash}`
}

function hashCapTable(capTable: CapTableSnapshot): string {
  // Create deterministic hash from cap table state
  const hashInput = {
    preferredSeries: capTable.preferredSeries.map((p) => ({
      name: p.name,
      shares: p.sharesOutstanding.toString(),
      price: p.pricePerShare.toString(),
      multiple: p.liquidationMultiple.toString(),
      seniority: p.seniority,
      preferenceType: p.preferenceType,
      participationCap: p.participationCap?.toString() || null,
    })),
    commonShares: capTable.commonStock.sharesOutstanding.toString(),
    options: capTable.options.map((o) => ({
      poolName: o.poolName,
      numOptions: o.numOptions.toString(),
      exercisePrice: o.exercisePrice.toString(),
    })),
  }

  return crypto
    .createHash('sha256')
    .update(JSON.stringify(hashInput))
    .digest('hex')
    .substring(0, 16)
}
```

### Cache Implementation

```typescript
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

async function getCachedAnalysis(
  valuationId: string,
  capTable: CapTableSnapshot
): Promise<BreakpointAnalysisResult | null> {
  const cacheKey = generateCacheKey(valuationId, capTable)
  const cached = await redis.get(cacheKey)

  if (cached) {
    console.log(`Cache hit for ${cacheKey}`)
    return JSON.parse(cached as string)
  }

  return null
}

async function cacheAnalysis(
  valuationId: string,
  capTable: CapTableSnapshot,
  analysis: BreakpointAnalysisResult,
  ttlSeconds: number = 3600
): Promise<void> {
  const cacheKey = generateCacheKey(valuationId, capTable)

  await redis.set(cacheKey, JSON.stringify(analysis), 'EX', ttlSeconds)

  console.log(`Cached analysis: ${cacheKey} (TTL: ${ttlSeconds}s)`)
}

async function invalidateCache(valuationId: string): Promise<void> {
  // Delete all cache keys for this valuation
  const pattern = `breakpoints:${valuationId}:*`
  const keys = await redis.keys(pattern)

  if (keys.length > 0) {
    await redis.del(...keys)
    console.log(`Invalidated ${keys.length} cache entries for valuation ${valuationId}`)
  }
}
```

### Cache Invalidation Triggers

```typescript
// When cap table changes (share class updated, option added, etc.)
// Trigger: Supabase webhook or database trigger

export async function POST(req: NextRequest) {
  const { valuationId, changeType } = await req.json()

  // Invalidate cache for this valuation
  await invalidateCache(valuationId)

  console.log(`Cache invalidated for valuation ${valuationId} due to ${changeType}`)

  return NextResponse.json({ success: true })
}
```

---

## Authentication & Authorization

### Supabase Row-Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE share_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE options_warrants ENABLE ROW LEVEL SECURITY;
ALTER TABLE breakpoint_analyses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their company's data
CREATE POLICY "Users access own company data"
ON share_classes
FOR SELECT
USING (
  company_id IN (
    SELECT company_id
    FROM user_company_access
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users access own company data"
ON options_warrants
FOR SELECT
USING (
  company_id IN (
    SELECT company_id
    FROM user_company_access
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users access own company breakpoints"
ON breakpoint_analyses
FOR SELECT
USING (
  company_id IN (
    SELECT company_id
    FROM user_company_access
    WHERE user_id = auth.uid()
  )
);
```

### API Route Authorization

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // 1. Create Supabase client with user session
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  // 2. Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        timestamp: new Date().toISOString()
      }
    }, { status: 401 })
  }

  // 3. Check user has access to this valuation
  const { data: valuation, error: accessError } = await supabase
    .from('valuations')
    .select('id, company_id')
    .eq('id', params.id)
    .single()

  if (accessError || !valuation) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Valuation not found or access denied',
        timestamp: new Date().toISOString()
      }
    }, { status: 404 })
  }

  // 4. RLS automatically enforces company-level access
  // If we got here, user has access

  // Proceed with analysis...
  const analysis = await analyzeBreakpoints(params.id)

  return NextResponse.json({
    success: true,
    data: analysis,
    metadata: { ... }
  })
}
```

---

## Rate Limiting

### Upstash Rate Limiting

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

// 10 requests per 60 seconds per user
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '60 s'),
  analytics: true,
  prefix: 'breakpoint_analysis',
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  // Get user ID from session
  const userId = await getUserId(req)

  // Check rate limit
  const { success, limit, reset, remaining } = await ratelimit.limit(`user:${userId}`)

  if (!success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          details: {
            limit,
            remaining,
            resetAt: new Date(reset).toISOString(),
          },
          timestamp: new Date().toISOString(),
        },
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      }
    )
  }

  // Add rate limit headers to successful response
  const response = await analyzeBreakpoints(params.id)

  return NextResponse.json(response, {
    headers: {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': reset.toString(),
    },
  })
}
```

---

## Example Implementation

### Complete API Route

```typescript
// src/app/api/valuations/[id]/breakpoints/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// V3 Imports
import { BreakpointOrchestrator } from '@/lib/services/comprehensiveBreakpoints/v3/orchestrator/BreakpointOrchestrator'
import { DatabaseToBreakpointTransformer } from '@/lib/services/comprehensiveBreakpoints/v3/transformers/DatabaseToBreakpointTransformer'
import { BreakpointToDatabaseTransformer } from '@/lib/services/comprehensiveBreakpoints/v3/transformers/BreakpointToDatabaseTransformer'
import { CapTableValidator } from '@/lib/services/comprehensiveBreakpoints/v3/validators/CapTableValidator'
import {
  ValidationError,
  SolverError,
  BreakpointAnalysisError,
} from '@/lib/services/comprehensiveBreakpoints/v3/errors'

// Cache & rate limiting
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '60 s'),
  prefix: 'breakpoint_analysis',
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const startTime = Date.now()

  try {
    // 1. AUTHENTICATION
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 401 }
      )
    }

    // 2. RATE LIMITING
    const {
      success: rateLimitOk,
      limit,
      reset,
      remaining,
    } = await ratelimit.limit(`user:${user.id}`)

    if (!rateLimitOk) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests',
            details: { limit, remaining, resetAt: new Date(reset).toISOString() },
            timestamp: new Date().toISOString(),
          },
        },
        { status: 429 }
      )
    }

    // 3. LOAD CAP TABLE
    const transformer = new DatabaseToBreakpointTransformer(supabase)
    const capTable = await transformer.transform(params.id)

    // 4. CHECK CACHE
    const forceRefresh = req.nextUrl.searchParams.get('refresh') === 'true'
    const cacheKey = generateCacheKey(params.id, capTable)

    if (!forceRefresh) {
      const cached = await redis.get(cacheKey)
      if (cached) {
        return NextResponse.json(
          {
            success: true,
            data: JSON.parse(cached as string),
            metadata: {
              cached: true,
              version: 'v3.0.0',
              timestamp: new Date().toISOString(),
            },
          },
          {
            headers: {
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': remaining.toString(),
              'X-RateLimit-Reset': reset.toString(),
              'X-Cache': 'HIT',
            },
          }
        )
      }
    }

    // 5. VALIDATE INPUT
    const validator = new CapTableValidator()
    const validation = validator.validate(capTable)

    if (!validation.isValid) {
      throw new ValidationError(validation.errors)
    }

    // 6. ANALYZE BREAKPOINTS
    const orchestrator = createOrchestrator() // Dependency injection
    const analysis = await orchestrator.analyzeBreakpoints(capTable)

    // 7. PERSIST RESULTS
    const dbTransformer = new BreakpointToDatabaseTransformer(supabase)
    await dbTransformer.transform(analysis, params.id, capTable.companyId)

    // 8. CACHE RESULTS
    await redis.set(cacheKey, JSON.stringify(analysis), 'EX', 3600)

    // 9. RETURN RESPONSE
    const totalTime = Date.now() - startTime

    return NextResponse.json(
      {
        success: true,
        data: analysis,
        metadata: {
          cached: false,
          version: 'v3.0.0',
          timestamp: new Date().toISOString(),
          totalRequestTimeMs: totalTime,
        },
      },
      {
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
          'X-Cache': 'MISS',
        },
      }
    )
  } catch (error) {
    // ERROR HANDLING
    if (error instanceof ValidationError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      )
    }

    if (error instanceof SolverError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
            recommendation: 'Check option exercise prices and cap table totals',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 500 }
      )
    }

    if (error instanceof BreakpointAnalysisError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 500 }
      )
    }

    console.error('Unexpected error in breakpoint analysis:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    )
  }
}

// POST: Force re-analysis (bypass cache)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  // Same as GET but always bypass cache
  const url = new URL(req.url)
  url.searchParams.set('refresh', 'true')
  return GET(new NextRequest(url, req), { params })
}

// DELETE: Clear cache
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await invalidateCache(params.id)
  return NextResponse.json({ success: true })
}

// Helper: Create orchestrator with all dependencies
function createOrchestrator(): BreakpointOrchestrator {
  // Dependency injection setup
  // (Full implementation in Phase 7)
  return new BreakpointOrchestrator()
  // ... all dependencies
}

// Helper: Generate cache key
function generateCacheKey(valuationId: string, capTable: CapTableSnapshot): string {
  const capTableHash = hashCapTable(capTable)
  return `breakpoints:${valuationId}:${capTableHash}`
}

// Helper: Hash cap table for cache key
function hashCapTable(capTable: CapTableSnapshot): string {
  // Implementation as shown in Caching Strategy section
  // ...
}

// Helper: Invalidate cache
async function invalidateCache(valuationId: string): Promise<void> {
  const pattern = `breakpoints:${valuationId}:*`
  const keys = await redis.keys(pattern)
  if (keys.length > 0) {
    await redis.del(...keys)
  }
}
```

---

## Next Steps

For frontend integration, see [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md)

For database schema, see [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)

For module interactions, see [MODULE_INTERACTIONS.md](./MODULE_INTERACTIONS.md)
