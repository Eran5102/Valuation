# Module Interactions & Dependencies

## Table of Contents

1. [Overview](#overview)
2. [Module Dependency Graph](#module-dependency-graph)
3. [Data Flow Patterns](#data-flow-patterns)
4. [Analyzer Interactions](#analyzer-interactions)
5. [Calculator Usage Patterns](#calculator-usage-patterns)
6. [Solver Integration](#solver-integration)
7. [Orchestration Flow](#orchestration-flow)
8. [Error Handling & Validation](#error-handling--validation)

---

## Overview

This document maps how the 26+ modules in BreakpointAnalyzer V3 interact with each other. Understanding these interactions is critical for:

- Implementing new modules
- Debugging issues
- Understanding data flow
- Maintaining consistency

### Key Interaction Principles

1. **Dependency Injection**: All dependencies are injected through constructors
2. **Unidirectional Data Flow**: Data flows down from Orchestrator → Analyzers → Calculators → Utilities
3. **Immutable Inputs**: Cap table snapshots are immutable; modules never modify input data
4. **Sequential Execution**: Some analyzers MUST run in order (especially voluntary conversion)
5. **Lazy Evaluation**: Formulas calculate values only when needed

---

## Module Dependency Graph

### High-Level Dependencies

```
┌──────────────────────────────────────────────────────┐
│                  ORCHESTRATOR                         │
│           BreakpointOrchestrator                     │
│           AnalysisSequencer                          │
└──────────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┬───────────────┐
        ↓               ↓               ↓               ↓
   VALIDATORS      ANALYZERS       CALCULATORS     TRANSFORMERS
   │               │               │               │
   ├─CapTable      ├─LP Analyzer   ├─PerClass      ├─DB→Domain
   ├─Breakpoint    ├─ProRata       │  RVPS         ├─Domain→DB
   └─Consistency   ├─Option        ├─Cumulative
                   ├─Conversion    │  RVPS
                   └─Cap           ├─Participation
                                   └─Indifference
                        │               │
                        └───────┬───────┘
                                ↓
                           UTILITIES
                           │
                           ├─CapTableHelpers
                           ├─AuditLogger
                           ├─MathProofs
                           └─DecimalHelpers
                                │
                                ↓
                            SOLVERS
                            │
                            ├─CircularDependency
                            ├─NewtonRaphson
                            └─BinarySearch
```

### Detailed Module Dependencies

#### BreakpointOrchestrator

```typescript
class BreakpointOrchestrator {
  constructor(
    private capTableValidator: CapTableValidator,
    private rvpsCalculator: PerClassRVPSCalculator,
    private lpAnalyzer: LiquidationPreferenceAnalyzer,
    private proRataAnalyzer: ProRataAnalyzer,
    private optionAnalyzer: OptionExerciseAnalyzer,
    private conversionAnalyzer: VoluntaryConversionAnalyzer,
    private capAnalyzer: ParticipationCapAnalyzer,
    private breakpointValidator: BreakpointValidator,
    private auditLogger: AuditTrailLogger
  ) {}
}
```

**Uses:**

- `CapTableValidator` → Validates input before analysis
- `PerClassRVPSCalculator` → Calculates conversion order
- All 5 analyzers → Identifies breakpoints
- `BreakpointValidator` → Validates results
- `AuditTrailLogger` → Records all decisions

#### LiquidationPreferenceAnalyzer

```typescript
class LiquidationPreferenceAnalyzer {
  constructor(
    private capTableHelpers: CapTableHelpers,
    private auditLogger: AuditTrailLogger
  ) {}
}
```

**Uses:**

- `CapTableHelpers.groupBySeniority()` → Groups classes by seniority rank
- `CapTableHelpers.calculateCumulativeLP()` → Calculates cumulative LP at each rank
- `AuditLogger.logBreakpoint()` → Records LP breakpoint details

#### ProRataAnalyzer

```typescript
class ProRataAnalyzer {
  constructor(
    private participationCalculator: ParticipationCalculator,
    private capTableHelpers: CapTableHelpers,
    private auditLogger: AuditTrailLogger
  ) {}
}
```

**Uses:**

- `ParticipationCalculator.determineParticipants()` → Identifies who participates
- `CapTableHelpers.getTotalParticipatingShares()` → Calculates total shares
- `AuditLogger.logBreakpoint()` → Records pro-rata start point

#### OptionExerciseAnalyzer

```typescript
class OptionExerciseAnalyzer {
  constructor(
    private rvpsTracker: CumulativeRVPSTracker,
    private circularSolver: CircularDependencySolver,
    private capTableHelpers: CapTableHelpers,
    private auditLogger: AuditTrailLogger
  ) {}
}
```

**Uses:**

- `RVPSTracker.getCumulativeRVPS()` → Gets current cumulative RVPS for common
- `CircularSolver.solve()` → Resolves circular dependency (RVPS depends on total shares, which depends on exercise decision, which depends on RVPS)
- `CapTableHelpers.groupOptionsByStrike()` → Groups options with same strike price
- `AuditLogger.logCircularResolution()` → Records solver iterations

#### VoluntaryConversionAnalyzer

```typescript
class VoluntaryConversionAnalyzer {
  constructor(
    private indifferenceCalculator: IndifferencePointCalculator,
    private rvpsCalculator: PerClassRVPSCalculator,
    private auditLogger: AuditTrailLogger
  ) {}
}
```

**Uses:**

- `RVPSCalculator.getConversionOrder()` → Gets ordered list (lowest RVPS first)
- `IndifferenceCalculator.calculate()` → Calculates indifference point for each class SEQUENTIALLY
- `AuditLogger.logConversionStep()` → Records each conversion decision

#### ParticipationCapAnalyzer

```typescript
class ParticipationCapAnalyzer {
  constructor(
    private rvpsTracker: CumulativeRVPSTracker,
    private participationCalculator: ParticipationCalculator,
    private auditLogger: AuditTrailLogger
  ) {}
}
```

**Uses:**

- `RVPSTracker.getRVPSForSeries()` → Gets cumulative RVPS for participating series
- `ParticipationCalculator.calculateCapThreshold()` → Calculates when cap is reached
- `AuditLogger.logCapReached()` → Records cap event

---

## Data Flow Patterns

### Pattern 1: Linear Analysis (LP Breakpoints)

```
CapTableSnapshot
    ↓
CapTableHelpers.groupBySeniority()
    ↓
SeniorityGroup[]
    ↓
LiquidationPreferenceAnalyzer.analyze()
    ↓
[Breakpoint 1: Seniority 0 LP satisfied]
[Breakpoint 2: Seniority 1 LP satisfied]
[...]
    ↓
RangeBasedBreakpoint[]
```

**No circular dependencies, no sequential constraints.**

### Pattern 2: Dependent Analysis (Pro Rata)

```
CapTableSnapshot + LP Breakpoints
    ↓
ParticipationCalculator.determineParticipants()
    ↓
- Common (always)
- Participating Preferred (always)
- Options (NOT YET - depends on cumulative RVPS)
    ↓
ProRataAnalyzer.analyze()
    ↓
[Breakpoint N: Pro Rata Begins]
    ↓
RangeBasedBreakpoint
```

**Depends on:** LP breakpoints completed (to know when LP is satisfied)

### Pattern 3: Circular Dependency (Option Exercise)

```
CapTableSnapshot + Prior Breakpoints
    ↓
CumulativeRVPSTracker.track(priorBreakpoints)
    ↓
For each option strike price:
    ↓
    Condition: Cumulative RVPS >= Strike Price
    But: RVPS = Exit Value ÷ Total Shares
    And: Total Shares = Base + Exercised Options
    And: Exercised = f(RVPS >= Strike)
    → CIRCULAR!
    ↓
    CircularDependencySolver.solve(
      condition: rvps >= strike,
      solver: NewtonRaphsonSolver
    )
    ↓
    Converges to exit value where:
    RVPS(exitValue, totalShares(exercised)) = strike
    ↓
[Breakpoint M: Options @ $X.XX Exercise]
    ↓
RangeBasedBreakpoint
```

**Requires:** Iterative solver (Newton-Raphson or Binary Search)

### Pattern 4: Sequential Analysis (Voluntary Conversion)

```
CapTableSnapshot
    ↓
PerClassRVPSCalculator.analyze()
    ↓
ClassRVPSAnalysis[] (sorted by RVPS: lowest first)
    ↓
ConversionOrder: [Series A, Series B, Series C, ...]
    ↓
For each series in order:
    ↓
    Step 1: Series A Conversion
        ├─ Calculate indifference point
        ├─ LP waived = $20M (Series A)
        ├─ Remaining LP = $35M - $20M = $15M
        └─ Create breakpoint
    ↓
    Step 2: Series B Conversion (DEPENDS on Step 1!)
        ├─ Calculate indifference point
        ├─ LP ALREADY WAIVED = $20M (from Series A)
        ├─ Remaining LP = $15M - $10M = $5M
        └─ Create breakpoint
    ↓
    Step 3: Series C Conversion (DEPENDS on Steps 1 & 2!)
        ├─ Calculate indifference point
        ├─ LP ALREADY WAIVED = $30M (from A + B)
        ├─ Remaining LP = $5M - $5M = $0
        └─ Create breakpoint
    ↓
[Breakpoint P: Series A Converts]
[Breakpoint Q: Series B Converts]
[Breakpoint R: Series C Converts]
    ↓
RangeBasedBreakpoint[]
```

**Critical:** Must execute in RVPS order. Each step depends on prior conversions.

---

## Analyzer Interactions

### Interaction 1: LP → Pro Rata

**Scenario:** Pro-rata distribution starts AFTER all liquidation preferences are satisfied.

```typescript
// LiquidationPreferenceAnalyzer outputs:
const lpBreakpoints: RangeBasedBreakpoint[] = [
  { breakpointOrder: 1, rangeFrom: 0, rangeTo: 10M, type: 'LP' },      // Seniority 0
  { breakpointOrder: 2, rangeFrom: 10M, rangeTo: 25M, type: 'LP' },    // Seniority 1
  { breakpointOrder: 3, rangeFrom: 25M, rangeTo: 35M, type: 'LP' },    // Seniority 2
]

// ProRataAnalyzer uses this to determine start point:
const totalLP = new Decimal(35_000_000) // Last LP breakpoint's rangeTo
const proRataStartPoint = totalLP       // Pro-rata begins here

const proRataBreakpoint: RangeBasedBreakpoint = {
  breakpointOrder: 4,
  rangeFrom: totalLP,          // $35M (after all LP satisfied)
  rangeTo: null,               // Open-ended
  type: 'PRO_RATA_DISTRIBUTION',
  // ...
}
```

**Data Passed:** Last LP breakpoint's `rangeTo` value

### Interaction 2: Pro Rata → Option Exercise

**Scenario:** Options exercise when cumulative RVPS >= strike price. RVPS accumulates through pro-rata participation.

```typescript
// ProRataAnalyzer creates a range:
const proRataRange: RangeBasedBreakpoint = {
  rangeFrom: 35M,
  rangeTo: null,
  participants: [
    { securityName: 'Common', shares: 10M, rvps: 0, cumulative: 0 },
    { securityName: 'Series A (converted)', shares: 10M, rvps: 0, cumulative: 0 }
  ],
  totalParticipatingShares: 20M
}

// CumulativeRVPSTracker tracks RVPS growth:
// At $40M exit: common gets ($40M - $35M) / 20M = $0.25 per share
// At $45M exit: common gets ($45M - $35M) / 20M = $0.50 per share
// ...

// OptionExerciseAnalyzer checks exercise condition:
for (const optionPool of optionPools) {
  const strike = optionPool.exercisePrice // e.g., $1.25

  // Find exit value where cumulative RVPS = strike
  // This requires solver because exercising changes total shares!
  const exercisePoint = circularSolver.solve({
    condition: (exitValue) => {
      const rvps = rvpsTracker.getCumulativeRVPS('Common', exitValue)
      return rvps.gte(strike)
    }
  })

  // Creates breakpoint at exercisePoint
}
```

**Data Passed:** Prior breakpoints to `CumulativeRVPSTracker` for RVPS calculation

### Interaction 3: RVPS Calculator → Conversion Analyzer

**Scenario:** Voluntary conversion must happen in RVPS order (lowest first).

```typescript
// PerClassRVPSCalculator determines order:
const rvpsAnalysis: ClassRVPSAnalysis[] = [
  { seriesName: 'Series A', classRVPS: 2.0, priority: 1 }, // Lowest RVPS
  { seriesName: 'Series B', classRVPS: 3.0, priority: 2 },
  { seriesName: 'Series C', classRVPS: 5.0, priority: 3 }, // Highest RVPS
]

// VoluntaryConversionAnalyzer uses this order:
const conversionBreakpoints: RangeBasedBreakpoint[] = []
let waivedLP = new Decimal(0)

for (const classAnalysis of rvpsAnalysis) {
  // Step 1: Series A (no prior waivers)
  const result = indifferenceCalculator.calculate({
    targetSeries: classAnalysis,
    waivedLP: waivedLP, // $0 initially
    remainingLP: totalLP.minus(waivedLP),
  })

  conversionBreakpoints.push({
    breakpointType: 'VOLUNTARY_CONVERSION',
    rangeFrom: result.breakpointValue,
    dependencies:
      classAnalysis.priority > 1
        ? [`${rvpsAnalysis[classAnalysis.priority - 2].seriesName} conversion`]
        : [],
  })

  // Update waived LP for next iteration
  waivedLP = waivedLP.plus(classAnalysis.classLiquidationPreference)
}
```

**Data Passed:** Ordered `ClassRVPSAnalysis[]` + cumulative `waivedLP` state

---

## Calculator Usage Patterns

### PerClassRVPSCalculator Usage

**Used By:**

- `BreakpointOrchestrator` (to determine conversion order)
- `VoluntaryConversionAnalyzer` (to get sequential conversion priorities)

**Input:** `CapTableSnapshot`

**Output:** `ConversionOrderResult`

```typescript
{
  orderedClasses: [
    { seriesName: 'Series A', classRVPS: 2.00, priority: 1 },
    { seriesName: 'Series B', classRVPS: 3.00, priority: 2 }
  ],
  orderingLogic: 'Lower RVPS converts first (lower opportunity cost)',
  timeline: [...]
}
```

### CumulativeRVPSTracker Usage

**Used By:**

- `OptionExerciseAnalyzer` (to check exercise conditions)
- `ParticipationCapAnalyzer` (to check cap reached)

**Input:** Prior `RangeBasedBreakpoint[]`

**Output:** `SecurityRVPSHistory` for each security

```typescript
{
  securityName: 'Common Stock',
  cumulativeRVPS: 1.25,
  history: [
    { breakpointOrder: 1, rvpsIncrement: 0, cumulativeAfter: 0 },     // LP range (no participation)
    { breakpointOrder: 2, rvpsIncrement: 0, cumulativeAfter: 0 },     // LP range (no participation)
    { breakpointOrder: 3, rvpsIncrement: 0.50, cumulativeAfter: 0.50 }, // Pro-rata range 1
    { breakpointOrder: 4, rvpsIncrement: 0.75, cumulativeAfter: 1.25 }  // Pro-rata range 2
  ]
}
```

### ParticipationCalculator Usage

**Used By:**

- `ProRataAnalyzer` (to determine initial participants)
- `OptionExerciseAnalyzer` (to add exercised options to participants)
- `ParticipationCapAnalyzer` (to update when cap reached)

**Input:**

- `CapTableSnapshot`
- Current breakpoint context
- Conversion decisions
- Exercise decisions

**Output:** `ParticipationCalculationResult`

```typescript
{
  totalParticipatingShares: 25_000_000,
  participants: [
    { securityName: 'Common', shares: 10M, percentage: 40%, reason: 'Always participates' },
    { securityName: 'Series A', shares: 10M, percentage: 40%, reason: 'Participating preferred' },
    { securityName: 'Options @ $1.25', shares: 5M, percentage: 20%, reason: 'Exercised (RVPS >= strike)' }
  ],
  logicApplied: 'Pro-rata distribution among all common-equivalent shares'
}
```

### IndifferencePointCalculator Usage

**Used By:**

- `VoluntaryConversionAnalyzer` (for each non-participating series)

**Input:**

- Target series `ClassRVPSAnalysis`
- `waivedLP` (from prior conversions)
- `remainingLP` (total LP minus waived)
- Conversion step number

**Output:** `IndifferencePointResult`

```typescript
{
  breakpointValue: 45_000_000,  // Exit value where indifferent
  mathematicalProof: '
    Step 2: Series B Conversion Indifference Point

    Given:
    - Series A already converted (Step 1), waived $20M LP
    - Series B LP: $10M
    - Remaining LP: $15M
    - Series B shares: 5M
    - Total shares after conversions: 25M

    LP Path: $10M
    Conversion Path: ($X - $15M) × (5M ÷ 25M) = $10M
    Solve: X = $65M
  ',
  waivedLP: 20_000_000,
  remainingLP: 15_000_000,
  proRataPercentage: 0.20,  // 5M ÷ 25M
  stepNumber: 2,
  priorConversions: ['Series A']
}
```

---

## Solver Integration

### Newton-Raphson Solver Usage

**Used By:** `CircularDependencySolver` → Used by `OptionExerciseAnalyzer`

**Problem:** Options exercise when `cumulativeRVPS >= strikePrice`, but `cumulativeRVPS` depends on `totalShares`, which depends on how many options are exercised, which depends on `cumulativeRVPS`. **Circular!**

**Solution:**

```typescript
// OptionExerciseAnalyzer
const exercisePoint = circularSolver.solve({
  initialGuess: totalLP.plus(strikePrice.times(optionShares)),

  // Function: f(x) = RVPS(x) - strike = 0
  targetFunction: (exitValue: Decimal) => {
    const totalShares = baseTotalShares.plus(optionShares) // Assume exercised
    const cumulativeRVPS = rvpsTracker.getCumulativeRVPS('Common', exitValue, totalShares)
    return cumulativeRVPS.minus(strikePrice)
  },

  // Derivative: f'(x) ≈ [f(x + h) - f(x)] / h
  derivative: (exitValue: Decimal) => {
    const h = new Decimal(1000) // Small step
    const f_x = targetFunction(exitValue)
    const f_x_h = targetFunction(exitValue.plus(h))
    return f_x_h.minus(f_x).dividedBy(h)
  },

  tolerance: new Decimal(0.01),
  maxIterations: 50,
})

// Result:
const solution: CircularSolutionResult = {
  exitValue: 62_500_000, // Converged solution
  iterations: 8,
  tolerance: 0.0003,
  converged: true,
  method: 'newton_raphson',
  explanation: 'Solved exercise condition via Newton-Raphson iteration',
}
```

**Why Newton-Raphson?**

- Fast convergence (quadratic)
- Reliable for smooth functions
- Handles high-precision decimal math
- Typically converges in < 10 iterations

---

## Orchestration Flow

### Complete Analysis Sequence

```typescript
class BreakpointOrchestrator {
  async analyzeBreakpoints(capTable: CapTableSnapshot): Promise<BreakpointAnalysisResult> {
    const startTime = Date.now()
    this.auditLogger.start('Breakpoint Analysis V3')

    // STEP 1: VALIDATE INPUT
    this.auditLogger.log('Step 1: Validating cap table')
    const validation = this.capTableValidator.validate(capTable)
    if (!validation.isValid) {
      throw new ValidationError(validation.errors)
    }

    // STEP 2: CALCULATE PER-CLASS RVPS & CONVERSION ORDER
    this.auditLogger.log('Step 2: Calculating per-class RVPS')
    const rvpsAnalysis = this.rvpsCalculator.analyze(capTable)
    const conversionOrder = rvpsAnalysis.orderedClasses
    this.auditLogger.log(
      `Conversion order: ${conversionOrder.map((c) => c.seriesName).join(' → ')}`
    )

    // STEP 3: ANALYZE LP BREAKPOINTS
    this.auditLogger.log('Step 3: Analyzing liquidation preferences')
    const lpBreakpoints = this.lpAnalyzer.analyze(capTable)
    this.auditLogger.log(`Found ${lpBreakpoints.length} LP breakpoints`)

    // STEP 4: ANALYZE PRO RATA START
    this.auditLogger.log('Step 4: Determining pro-rata start point')
    const proRataBreakpoint = this.proRataAnalyzer.analyze(capTable, lpBreakpoints)

    // STEP 5: ANALYZE OPTION EXERCISE (with circular solver)
    this.auditLogger.log('Step 5: Analyzing option exercise breakpoints')
    const optionBreakpoints = this.optionAnalyzer.analyze(capTable, [
      ...lpBreakpoints,
      proRataBreakpoint,
    ])
    this.auditLogger.log(`Found ${optionBreakpoints.length} option exercise breakpoints`)

    // STEP 6: ANALYZE VOLUNTARY CONVERSION (SEQUENTIAL!)
    this.auditLogger.log('Step 6: Analyzing voluntary conversion (sequential)')
    const conversionBreakpoints = this.conversionAnalyzer.analyze(capTable, conversionOrder, [
      ...lpBreakpoints,
      proRataBreakpoint,
      ...optionBreakpoints,
    ])
    this.auditLogger.log(`Found ${conversionBreakpoints.length} conversion breakpoints`)

    // STEP 7: ANALYZE PARTICIPATION CAPS
    this.auditLogger.log('Step 7: Analyzing participation caps')
    const capBreakpoints = this.capAnalyzer.analyze(capTable, [
      ...lpBreakpoints,
      proRataBreakpoint,
      ...optionBreakpoints,
      ...conversionBreakpoints,
    ])

    // STEP 8: COMBINE & SORT ALL BREAKPOINTS
    const allBreakpoints = [
      ...lpBreakpoints,
      proRataBreakpoint,
      ...optionBreakpoints,
      ...conversionBreakpoints,
      ...capBreakpoints,
    ].sort((a, b) => a.rangeFrom.comparedTo(b.rangeFrom))

    // Assign sequential order
    allBreakpoints.forEach((bp, idx) => {
      bp.breakpointOrder = idx + 1
    })

    // STEP 9: VALIDATE RESULTS
    this.auditLogger.log('Step 9: Validating results')
    const breakpointValidation = this.breakpointValidator.validate(allBreakpoints, capTable)

    if (!breakpointValidation.isValid) {
      this.auditLogger.error('Validation failed', breakpointValidation.errors)
      throw new ValidationError(breakpointValidation.errors)
    }

    // STEP 10: BUILD RESULT
    const analysisTime = Date.now() - startTime
    this.auditLogger.log(`Analysis complete in ${analysisTime}ms`)

    return {
      totalBreakpoints: allBreakpoints.length,
      breakpointsByType: {
        liquidation_preference: lpBreakpoints.length,
        pro_rata_distribution: 1,
        option_exercise: optionBreakpoints.length,
        voluntary_conversion: conversionBreakpoints.length,
        participation_cap: capBreakpoints.length,
      },
      rangeBasedBreakpoints: allBreakpoints,
      classRVPSAnalysis: rvpsAnalysis,
      conversionOrder: conversionOrder,
      auditTrail: this.auditLogger.getFullLog(),
      validationResults: breakpointValidation.tests,
      performanceMetrics: {
        analysisTimeMs: analysisTime,
        iterationsUsed: {
          option_exercise_solver: optionBreakpoints.reduce(
            (sum, bp) => sum + (bp.metadata?.solverIterations || 0),
            0
          ),
        },
      },
    }
  }
}
```

---

## Error Handling & Validation

### Validation Points

#### 1. Input Validation (CapTableValidator)

```typescript
const validation = capTableValidator.validate(capTable)

// Checks:
// - All required fields present
// - No negative values
// - Seniority ranks are unique and sequential
// - Conversion ratios are positive
// - Option strikes are reasonable
// - No duplicate share class names
```

#### 2. Calculation Validation (Throughout Analysis)

```typescript
// In each analyzer:
if (calculatedValue.isNaN() || calculatedValue.isNegative()) {
  throw new CalculationError(`Invalid calculation result: ${calculatedValue}`)
}

// In solvers:
if (!solution.converged) {
  throw new SolverError(
    `Failed to converge after ${maxIterations} iterations. ` + `Last error: ${solution.tolerance}`
  )
}
```

#### 3. Consistency Validation (BreakpointValidator)

```typescript
const validation = breakpointValidator.validate(breakpoints, capTable)

// Checks:
// - Ranges are continuous (no gaps)
// - Ranges are non-overlapping
// - Dependencies are satisfied (e.g., pro-rata after LP)
// - Conversion order matches RVPS order
// - Expected counts match actual (e.g., LP breakpoints = distinct seniority ranks)
// - Mathematical formulas are correct
```

#### 4. Output Validation (Before Return)

```typescript
// Verify totals match expectations
const totalLP = lpBreakpoints.reduce(
  (sum, bp) => sum.plus(bp.rangeTo.minus(bp.rangeFrom)),
  new Decimal(0)
)

const expectedTotalLP = capTable.preferredSeries.reduce(
  (sum, series) => sum.plus(series.totalLiquidationPreference),
  new Decimal(0)
)

if (!totalLP.equals(expectedTotalLP)) {
  throw new ValidationError(`Total LP mismatch: calculated ${totalLP}, expected ${expectedTotalLP}`)
}
```

### Error Propagation

```
Utility Error
    ↓ (throws)
Calculator Error
    ↓ (throws)
Analyzer Error
    ↓ (catches & enriches)
Orchestrator
    ↓ (logs & re-throws)
API Layer
    ↓ (returns 500 with details)
Frontend
    ↓ (displays user-friendly message)
```

---

## Integration with External Modules

### API Layer Integration

**File:** `/api/valuations/[id]/breakpoints/route.ts`

```typescript
import { BreakpointOrchestrator } from '@/lib/services/comprehensiveBreakpoints/v3/orchestrator'
import { DatabaseToBreakpointTransformer } from '@/lib/services/comprehensiveBreakpoints/v3/transformers'

export async function GET(req, { params }) {
  // 1. Load from database
  const dbCapTable = await supabase.from('share_classes').select('*').eq('valuation_id', params.id)

  // 2. Transform DB → Domain
  const transformer = new DatabaseToBreakpointTransformer()
  const capTable = transformer.transform(dbCapTable)

  // 3. Analyze
  const orchestrator = new BreakpointOrchestrator(/* inject dependencies */)
  const analysis = await orchestrator.analyzeBreakpoints(capTable)

  // 4. Transform Domain → DB (for persistence)
  const dbRecords = new BreakpointToDatabaseTransformer().transform(analysis)

  // 5. Save to database
  await supabase.from('breakpoint_analyses').insert(dbRecords)

  // 6. Return to frontend
  return NextResponse.json(analysis)
}
```

### Database Integration

**Transformer Flow:**

```
PostgreSQL Tables
    ↓
share_classes, options_warrants
    ↓
DatabaseToBreakpointTransformer
    ↓
CapTableSnapshot (domain model)
    ↓
BreakpointOrchestrator
    ↓
BreakpointAnalysisResult (domain model)
    ↓
BreakpointToDatabaseTransformer
    ↓
breakpoint_analyses, ui_breakpoints, breakpoint_participation_details
    ↓
PostgreSQL Tables
```

### Frontend Integration

**React Component Flow:**

```tsx
// Frontend fetches analysis
const { data: analysis } = await fetch(`/api/valuations/${id}/breakpoints`)

// Renders range-based breakpoints
<BreakpointRangeTable
  breakpoints={analysis.rangeBasedBreakpoints}
  rvpsAnalysis={analysis.classRVPSAnalysis}
  conversionOrder={analysis.conversionOrder}
/>

// Each breakpoint shows:
// - Range: $X → $Y
// - Type: LP / Pro-Rata / Option / Conversion / Cap
// - Participants: Who participates in this range
// - RVPS: Section RVPS and cumulative RVPS per participant
```

---

## Next Steps

For database schema details, see [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)

For API integration details, see [API_INTEGRATION.md](./API_INTEGRATION.md)

For frontend integration details, see [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md)
