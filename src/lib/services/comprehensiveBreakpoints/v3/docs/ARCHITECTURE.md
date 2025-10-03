# BreakpointAnalyzer V3 - System Architecture

## Table of Contents

1. [Overview](#overview)
2. [Core Principles](#core-principles)
3. [Architecture Layers](#architecture-layers)
4. [Module Organization](#module-organization)
5. [Data Flow](#data-flow)
6. [Key Concepts](#key-concepts)

---

## Overview

The Breakpoint Analyzer V3 is a modular, theoretical analysis system that identifies behavioral change points in waterfall distributions. Unlike traditional approaches that assume specific exit values, V3 analyzes breakpoints as **theoretical formulas** that define WHEN behavior changes, not WHAT happens at a specific exit.

### Purpose

Breakpoints define critical exit values where:

- Liquidation preferences are satisfied (LP breakpoints)
- Pro-rata distribution begins
- Options become economically rational to exercise
- Preferred shareholders choose to convert voluntarily
- Participation caps are reached

### Key Difference from V2

**V2 Approach (❌ Problematic):**

- Assumed hardcoded exit values (e.g., $10M)
- Single-point breakpoints
- System-wide RVPS calculations
- Monolithic 1,026-line file

**V3 Approach (✅ Correct):**

- Formula-based breakpoints (no assumptions)
- Range-based breakpoints (from/to values)
- Per-class RVPS calculations
- 26 modular files averaging 100-150 lines each

---

## Core Principles

### 1. Theoretical Breakpoints

Breakpoints are **behavioral definitions**, not concrete exit events.

```typescript
// ❌ V2: Hardcoded assumption
exitValue: new Decimal(10000000)

// ✅ V3: Theoretical formula
breakpointFormula: {
  calculate(capTable) {
    return capTable.preferred
      .filter(s => s.seniority === 0)
      .reduce((sum, s) => sum + s.liquidationPreference, 0)
  }
}
```

### 2. Range-Based Representation

Each breakpoint defines a **range** where specific securities participate:

```
Range 1: $0 → $10M (Series A LP only)
Range 2: $10M → $15M (Series B LP only)
Range 3: $15M → ∞ (Pro-rata: Common + Participating Preferred)
```

### 3. Single Responsibility

Each module has ONE clearly defined job:

- **LiquidationPreferenceAnalyzer**: Analyze LP breakpoints ONLY
- **PerClassRVPSCalculator**: Calculate per-class RVPS ONLY
- **IndifferencePointCalculator**: Calculate conversion indifference points ONLY

### 4. Dependency Injection

Modules receive dependencies through constructor:

```typescript
class VoluntaryConversionAnalyzer {
  constructor(
    private indifferenceCalculator: IndifferencePointCalculator,
    private auditLogger: AuditTrailLogger
  ) {}
}
```

This enables:

- Easy testing (mock dependencies)
- Flexibility (swap implementations)
- Clear dependency graph

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────┐
│               PRESENTATION LAYER                    │
│   Frontend UI Components (React)                    │
│   - BreakpointsAnalysis.tsx                        │
│   - BreakpointRangeTable.tsx                       │
└─────────────────────────────────────────────────────┘
                        ↕ HTTP
┌─────────────────────────────────────────────────────┐
│                  API LAYER                          │
│   Next.js API Routes                                │
│   - /api/valuations/[id]/breakpoints                │
│   - Authentication, Caching, Rate Limiting          │
└─────────────────────────────────────────────────────┘
                        ↕
        ┌───────────────┴───────────────┐
        │                               │
        ↓                               ↓
┌─────────────────────┐      ┌──────────────────────────┐
│ TRANSFORMATION      │      │  CORE BUSINESS LOGIC     │
│ LAYER              │      │  (Breakpoint Analyzer V3) │
│                    │      │                           │
│ DB ↔ Domain        │      │  ┌────────────────────┐  │
│ Transformers       │      │  │  Orchestrator      │  │
│                    │      │  └────────────────────┘  │
│ - Input: DB → Cap  │      │           ↓              │
│   Table           │      │  ┌────────────────────┐  │
│ - Output: Analysis │      │  │   Analyzers        │  │
│   → DB Records     │      │  │  - LP              │  │
└─────────────────────┘      │  │  - ProRata         │  │
        ↓                    │  │  - Option          │  │
┌─────────────────────┐      │  │  - Conversion      │  │
│  PERSISTENCE LAYER  │      │  │  - Cap             │  │
│  PostgreSQL/Supabase│      │  └────────────────────┘  │
│                    │      │           ↓              │
│ - share_classes    │      │  ┌────────────────────┐  │
│ - options_warrants │      │  │   Calculators      │  │
│ - breakpoint_*     │      │  │  - RVPS            │  │
│   tables          │      │  │  - Participation   │  │
└─────────────────────┘      │  └────────────────────┘  │
                            │           ↓              │
                            │  ┌────────────────────┐  │
                            │  │   Utilities        │  │
                            │  │  - CapTable        │  │
                            │  │  - AuditLogger     │  │
                            │  └────────────────────┘  │
                            └──────────────────────────┘
```

---

## Module Organization

### Directory Structure

```
src/lib/services/comprehensiveBreakpoints/v3/
├── types/                    (Type definitions)
│   ├── BreakpointTypes.ts
│   ├── CapTableTypes.ts
│   ├── FormulaTypes.ts
│   └── ValidationTypes.ts
│
├── analyzers/                (Breakpoint-specific logic)
│   ├── BaseAnalyzer.ts
│   ├── LiquidationPreferenceAnalyzer.ts
│   ├── ProRataAnalyzer.ts
│   ├── OptionExerciseAnalyzer.ts
│   ├── VoluntaryConversionAnalyzer.ts
│   └── ParticipationCapAnalyzer.ts
│
├── calculators/              (Reusable calculations)
│   ├── PerClassRVPSCalculator.ts
│   ├── CumulativeRVPSTracker.ts
│   ├── ParticipationCalculator.ts
│   └── IndifferencePointCalculator.ts
│
├── solvers/                  (Circular dependency resolution)
│   ├── CircularDependencySolver.ts
│   ├── NewtonRaphsonSolver.ts
│   └── BinarySearchSolver.ts
│
├── validators/               (Input/output validation)
│   ├── CapTableValidator.ts
│   ├── BreakpointValidator.ts
│   └── ConsistencyValidator.ts
│
├── utilities/                (Shared helpers)
│   ├── CapTableHelpers.ts
│   ├── MathematicalProofs.ts
│   ├── AuditTrailLogger.ts
│   └── DecimalHelpers.ts
│
├── orchestrator/             (Main coordination)
│   ├── BreakpointOrchestrator.ts
│   └── AnalysisSequencer.ts
│
├── transformers/             (DB ↔ Domain conversion)
│   ├── DatabaseToBreakpointTransformer.ts
│   └── BreakpointToDatabaseTransformer.ts
│
└── docs/                     (Documentation)
    ├── ARCHITECTURE.md
    ├── MODULE_INTERACTIONS.md
    ├── DATABASE_SCHEMA.md
    ├── API_INTEGRATION.md
    └── FRONTEND_INTEGRATION.md
```

### Module Categories

| Category     | Purpose             | Files | Avg Lines |
| ------------ | ------------------- | ----- | --------- |
| Types        | Type definitions    | 4     | 80        |
| Analyzers    | Breakpoint analysis | 6     | 140       |
| Calculators  | Calculations        | 4     | 125       |
| Solvers      | Circular resolution | 3     | 110       |
| Validators   | Validation          | 3     | 100       |
| Utilities    | Shared helpers      | 4     | 110       |
| Orchestrator | Coordination        | 2     | 150       |
| Transformers | DB conversion       | 2     | 150       |

**Total: 28 files, ~3,200 lines** (vs V2: 1 file, 1,026 lines)

---

## Data Flow

### Complete Request Flow

```
1. USER REQUEST
   ↓
   GET /api/valuations/:id/breakpoints

2. API ENTRY POINT
   ↓
   Load cap table from database
   (share_classes, options_warrants tables)

3. DATABASE → DOMAIN TRANSFORMATION
   ↓
   DatabaseToBreakpointTransformer
   - DB column names → Domain types
   - Validation
   - Create CapTableSnapshot

4. ORCHESTRATOR COORDINATES ANALYSIS
   ↓
   BreakpointOrchestrator.analyzeBreakpoints()

   4a. Validate Input
       ├─ CapTableValidator

   4b. Calculate Per-Class RVPS
       ├─ PerClassRVPSCalculator
       └─ Determine conversion order

   4c. Analyze LP Breakpoints
       ├─ LiquidationPreferenceAnalyzer
       └─ Uses: CapTableHelpers, AuditLogger

   4d. Analyze Pro Rata
       ├─ ProRataAnalyzer
       └─ Uses: ParticipationCalculator

   4e. Analyze Options
       ├─ OptionExerciseAnalyzer
       └─ Uses: CumulativeRVPSTracker, NewtonRaphsonSolver

   4f. Analyze Conversions (SEQUENTIAL)
       ├─ VoluntaryConversionAnalyzer
       └─ Uses: IndifferencePointCalculator

   4g. Analyze Caps
       └─ ParticipationCapAnalyzer

   4h. Validate Results
       └─ BreakpointValidator

5. DOMAIN → DATABASE TRANSFORMATION
   ↓
   BreakpointToDatabaseTransformer
   - Analysis → DB records
   - breakpoint_analyses table
   - ui_breakpoints table
   - breakpoint_participation_details table

6. SAVE TO DATABASE
   ↓
   Insert into Supabase PostgreSQL

7. RETURN TO FRONTEND
   ↓
   JSON response with analysis results

8. FRONTEND RENDERS
   ↓
   BreakpointsAnalysis.tsx displays ranges
```

---

## Key Concepts

### Per-Class RVPS

**Formula:** Class RVPS = Class Total LP ÷ Class Total Shares

```typescript
// Example: Series A
LP = 10,000,000 shares × $2.00 × 1x = $20,000,000
Shares = 10,000,000
RVPS = $20,000,000 ÷ 10,000,000 = $2.00 per share

// Example: Series B
LP = 5,000,000 shares × $3.00 × 1x = $15,000,000
Shares = 5,000,000
RVPS = $15,000,000 ÷ 5,000,000 = $3.00 per share
```

**Usage:** Determines conversion order (Series A converts before Series B because lower RVPS = lower opportunity cost)

### Cumulative RVPS Tracking

Tracks RVPS accumulation across all breakpoint ranges:

```
Security: Common Stock

Range 1 (LP): Does not participate → RVPS = $0.00
Range 2 (LP): Does not participate → RVPS = $0.00
Range 3 (Pro-rata): Participates → Section RVPS = $0.50
                                  → Cumulative RVPS = $0.50
Range 4 (Pro-rata cont.): Section RVPS = $0.75
                         → Cumulative RVPS = $1.25
```

**Critical for:** Options exercise when cumulative RVPS for common >= strike price

### Sequential LP Waiver

Lower RVPS classes convert first, waiving their LP:

```
Step 1: Series A converts (lowest RVPS)
        → Waives $20M LP
        → Remaining LP = $35M - $20M = $15M

Step 2: Series B indifference calculation
        → Accounts for $20M already waived
        → Calculates based on $15M remaining LP
```

**Critical for:** Accurate voluntary conversion breakpoints

### Circular Dependencies

Options exercise creates circularity:

```
Exercise Condition: Cumulative RVPS >= Strike Price
Cumulative RVPS = Exit Value ÷ Total Shares
Total Shares = Base Shares + Exercised Options
Exercised Options = f(Cumulative RVPS >= Strike)

→ RVPS depends on Total Shares
→ Total Shares depends on Exercise Decision
→ Exercise Decision depends on RVPS
→ CIRCULAR!

Solution: Newton-Raphson iterative solver
```

---

## Next Steps

For detailed module interactions, see [MODULE_INTERACTIONS.md](./MODULE_INTERACTIONS.md)

For database integration, see [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)

For API integration, see [API_INTEGRATION.md](./API_INTEGRATION.md)

For frontend integration, see [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md)
