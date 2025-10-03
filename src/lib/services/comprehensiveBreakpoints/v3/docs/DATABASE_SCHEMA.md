# Database Schema & Integration

## Table of Contents

1. [Overview](#overview)
2. [Input Tables](#input-tables)
3. [Output Tables](#output-tables)
4. [Transformation Mappings](#transformation-mappings)
5. [Indexes & Constraints](#indexes--constraints)
6. [Query Patterns](#query-patterns)
7. [Migration Strategy](#migration-strategy)

---

## Overview

The BreakpointAnalyzer V3 integrates with PostgreSQL/Supabase through a **transformation layer** that converts between database schemas and domain models.

### Design Principles

1. **Domain-Driven Design**: Core logic operates on domain types (`CapTableSnapshot`, `RangeBasedBreakpoint`), not database types
2. **Clean Separation**: Transformers handle all DB ↔ Domain conversion
3. **Schema Flexibility**: Database schema changes don't affect core logic
4. **Denormalization for UI**: Some data is duplicated in `ui_breakpoints` for frontend performance
5. **Audit Trail**: All calculations stored for transparency and debugging

### Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                    INPUT TABLES                         │
│  share_classes, options_warrants, valuations           │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│          DatabaseToBreakpointTransformer                │
│  DB Records → CapTableSnapshot (domain model)          │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│               BreakpointOrchestrator                    │
│  Analyzes cap table, produces BreakpointAnalysisResult │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│          BreakpointToDatabaseTransformer                │
│  BreakpointAnalysisResult → DB Records                 │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│                   OUTPUT TABLES                         │
│  breakpoint_analyses, ui_breakpoints,                  │
│  breakpoint_participation_details                      │
└─────────────────────────────────────────────────────────┘
```

---

## Input Tables

### 1. `share_classes` Table

**Purpose:** Stores preferred share class information

```sql
CREATE TABLE share_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  valuation_id UUID NOT NULL REFERENCES valuations(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Share Class Details
  name TEXT NOT NULL,                        -- e.g., "Series A", "Series B"
  share_type TEXT NOT NULL DEFAULT 'preferred',
  shares_outstanding NUMERIC(20, 2) NOT NULL,
  price_per_share NUMERIC(20, 2) NOT NULL,

  -- Liquidation Preference
  liquidation_multiple NUMERIC(10, 2) NOT NULL DEFAULT 1.0,
  total_liquidation_preference NUMERIC(20, 2) NOT NULL,
  seniority INTEGER NOT NULL,                -- 0 = most senior

  -- Participation
  preference_type TEXT NOT NULL,             -- 'non-participating', 'participating', 'participating-with-cap'
  participation_cap NUMERIC(20, 2),          -- NULL if not applicable

  -- Conversion
  conversion_ratio NUMERIC(20, 10) NOT NULL DEFAULT 1.0,

  -- Dividends
  dividends_declared BOOLEAN DEFAULT FALSE,
  dividends_rate NUMERIC(10, 4),
  dividends_type TEXT,                       -- 'cumulative', 'non-cumulative'
  pik BOOLEAN DEFAULT FALSE,

  -- Metadata
  round_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT valid_seniority CHECK (seniority >= 0),
  CONSTRAINT valid_multiple CHECK (liquidation_multiple > 0),
  CONSTRAINT valid_shares CHECK (shares_outstanding > 0),
  CONSTRAINT valid_preference_type CHECK (
    preference_type IN ('non-participating', 'participating', 'participating-with-cap')
  )
);

CREATE INDEX idx_share_classes_valuation ON share_classes(valuation_id);
CREATE INDEX idx_share_classes_seniority ON share_classes(valuation_id, seniority);
```

**Domain Mapping:**

```typescript
// DB → Domain
const preferredClass: PreferredShareClass = {
  id: row.id,
  name: row.name,
  shareType: 'preferred',
  sharesOutstanding: new Decimal(row.shares_outstanding),
  pricePerShare: new Decimal(row.price_per_share),
  liquidationMultiple: new Decimal(row.liquidation_multiple),
  totalLiquidationPreference: new Decimal(row.total_liquidation_preference),
  seniority: row.seniority,
  preferenceType: row.preference_type as PreferenceType,
  participationCap: row.participation_cap ? new Decimal(row.participation_cap) : null,
  conversionRatio: new Decimal(row.conversion_ratio),
  roundDate: new Date(row.round_date),
  dividendsDeclared: row.dividends_declared,
  dividendsRate: row.dividends_rate ? new Decimal(row.dividends_rate) : null,
  dividendsType: row.dividends_type,
  pik: row.pik,
}
```

### 2. `options_warrants` Table

**Purpose:** Stores option/warrant grants

```sql
CREATE TABLE options_warrants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  valuation_id UUID NOT NULL REFERENCES valuations(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Option Details
  pool_name TEXT NOT NULL,                   -- e.g., "2020 Employee Pool"
  num_options NUMERIC(20, 2) NOT NULL,
  exercise_price NUMERIC(20, 2) NOT NULL,
  vested NUMERIC(20, 2) NOT NULL,
  option_type TEXT NOT NULL,                 -- 'iso', 'nso', 'warrant', 'other'

  -- Dates
  grant_date TIMESTAMP,
  expiration_date TIMESTAMP,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT valid_options CHECK (num_options > 0),
  CONSTRAINT valid_vested CHECK (vested >= 0 AND vested <= num_options),
  CONSTRAINT valid_strike CHECK (exercise_price >= 0),
  CONSTRAINT valid_option_type CHECK (
    option_type IN ('iso', 'nso', 'warrant', 'other')
  )
);

CREATE INDEX idx_options_valuation ON options_warrants(valuation_id);
CREATE INDEX idx_options_strike ON options_warrants(valuation_id, exercise_price);
```

**Domain Mapping:**

```typescript
// DB → Domain
const optionGrant: OptionGrant = {
  id: row.id,
  poolName: row.pool_name,
  numOptions: new Decimal(row.num_options),
  exercisePrice: new Decimal(row.exercise_price),
  vested: new Decimal(row.vested),
  optionType: row.option_type as 'iso' | 'nso' | 'warrant' | 'other',
  grantDate: new Date(row.grant_date),
  expirationDate: row.expiration_date ? new Date(row.expiration_date) : undefined,
}
```

### 3. Common Stock (Derived)

**Note:** Common stock is NOT stored in a separate table. It's calculated as:

```sql
-- Common stock calculation
SELECT
  SUM(shares_outstanding * conversion_ratio) as total_common_shares
FROM share_classes
WHERE valuation_id = $1 AND share_type = 'common'

UNION ALL

-- Founder shares (if stored separately)
SELECT founder_shares FROM valuations WHERE id = $1
```

**Domain Mapping:**

```typescript
// DB → Domain
const commonStock: CommonStock = {
  sharesOutstanding: totalCommonShares,
  shareholders: [], // Optionally populated from cap_table_entries
  metadata: {},
}
```

---

## Output Tables

### 1. `breakpoint_analyses` Table

**Purpose:** Stores complete analysis results with audit trail

```sql
CREATE TABLE breakpoint_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  valuation_id UUID NOT NULL REFERENCES valuations(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Analysis Summary
  total_breakpoints INTEGER NOT NULL,
  lp_breakpoints INTEGER NOT NULL,
  pro_rata_breakpoints INTEGER NOT NULL,
  option_breakpoints INTEGER NOT NULL,
  conversion_breakpoints INTEGER NOT NULL,
  cap_breakpoints INTEGER NOT NULL,

  -- Per-Class RVPS Analysis (JSONB)
  class_rvps_analysis JSONB NOT NULL,        -- ClassRVPSAnalysis[]

  -- Conversion Order (JSONB)
  conversion_order JSONB NOT NULL,           -- ConversionOrderResult

  -- Audit Trail
  audit_trail TEXT NOT NULL,                 -- Human-readable log

  -- Performance Metrics
  analysis_time_ms INTEGER NOT NULL,
  solver_iterations JSONB,                   -- { option_exercise: 12, ... }

  -- Validation Results
  validation_passed BOOLEAN NOT NULL,
  validation_tests JSONB NOT NULL,           -- ValidationTestResult[]

  -- Metadata
  analyzer_version TEXT NOT NULL DEFAULT 'v3.0.0',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT valid_breakpoint_counts CHECK (
    total_breakpoints =
      lp_breakpoints + pro_rata_breakpoints + option_breakpoints +
      conversion_breakpoints + cap_breakpoints
  )
);

CREATE INDEX idx_analyses_valuation ON breakpoint_analyses(valuation_id);
CREATE INDEX idx_analyses_created ON breakpoint_analyses(created_at DESC);
```

**Domain Mapping:**

```typescript
// Domain → DB
const dbRecord = {
  id: uuidv4(),
  valuation_id: analysis.valuationId,
  company_id: analysis.companyId,
  total_breakpoints: analysis.totalBreakpoints,
  lp_breakpoints: analysis.breakpointsByType.liquidation_preference,
  pro_rata_breakpoints: analysis.breakpointsByType.pro_rata_distribution,
  option_breakpoints: analysis.breakpointsByType.option_exercise,
  conversion_breakpoints: analysis.breakpointsByType.voluntary_conversion,
  cap_breakpoints: analysis.breakpointsByType.participation_cap,
  class_rvps_analysis: JSON.stringify(
    analysis.classRVPSAnalysis.orderedClasses.map((c) => ({
      seriesName: c.seriesName,
      classLiquidationPreference: c.classLiquidationPreference.toString(),
      classTotalShares: c.classTotalShares.toString(),
      classRVPS: c.classRVPS.toString(),
      isParticipating: c.isParticipating,
      preferenceType: c.preferenceType,
      conversionPriority: c.conversionPriority,
      calculationDetails: c.calculationDetails,
    }))
  ),
  conversion_order: JSON.stringify({
    orderedClasses: analysis.conversionOrder.map((c) => c.seriesName),
    orderingLogic: analysis.classRVPSAnalysis.orderingLogic,
  }),
  audit_trail: analysis.auditTrail,
  analysis_time_ms: analysis.performanceMetrics.analysisTimeMs,
  solver_iterations: JSON.stringify(analysis.performanceMetrics.iterationsUsed),
  validation_passed: analysis.validationResults.every((v) => v.passed),
  validation_tests: JSON.stringify(analysis.validationResults),
  analyzer_version: 'v3.0.0',
}
```

### 2. `ui_breakpoints` Table

**Purpose:** Denormalized table optimized for UI rendering (range-based view)

```sql
CREATE TABLE ui_breakpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES breakpoint_analyses(id) ON DELETE CASCADE,
  valuation_id UUID NOT NULL REFERENCES valuations(id) ON DELETE CASCADE,

  -- Breakpoint Identification
  breakpoint_order INTEGER NOT NULL,         -- Sequential order (1, 2, 3...)
  breakpoint_type TEXT NOT NULL,             -- 'liquidation_preference', 'pro_rata_distribution', etc.
  priority_order INTEGER NOT NULL,           -- For sorting (0-1000 LP, 1000-2000 pro-rata, etc.)

  -- Range Definition
  range_from NUMERIC(20, 2) NOT NULL,
  range_to NUMERIC(20, 2),                   -- NULL for open-ended final range
  is_open_ended BOOLEAN NOT NULL DEFAULT FALSE,

  -- Participation Summary
  total_participating_shares NUMERIC(20, 2) NOT NULL,
  section_rvps NUMERIC(20, 10) NOT NULL,     -- RVPS for THIS range only

  -- Explanations
  explanation TEXT NOT NULL,
  mathematical_derivation TEXT NOT NULL,
  calculation_method TEXT NOT NULL,

  -- Dependencies
  dependencies JSONB,                        -- Array of dependency strings
  affected_securities JSONB,                 -- Array of security names

  -- Metadata (type-specific data)
  metadata JSONB,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT valid_range CHECK (
    (range_to IS NULL AND is_open_ended = TRUE) OR
    (range_to IS NOT NULL AND range_to > range_from AND is_open_ended = FALSE)
  ),
  CONSTRAINT valid_breakpoint_type CHECK (
    breakpoint_type IN (
      'liquidation_preference',
      'pro_rata_distribution',
      'option_exercise',
      'voluntary_conversion',
      'participation_cap'
    )
  )
);

CREATE INDEX idx_ui_breakpoints_analysis ON ui_breakpoints(analysis_id);
CREATE INDEX idx_ui_breakpoints_valuation ON ui_breakpoints(valuation_id);
CREATE INDEX idx_ui_breakpoints_order ON ui_breakpoints(valuation_id, breakpoint_order);
CREATE INDEX idx_ui_breakpoints_type ON ui_breakpoints(valuation_id, breakpoint_type);
```

**Domain Mapping:**

```typescript
// Domain → DB
const uiBreakpoint = {
  id: uuidv4(),
  analysis_id: analysisId,
  valuation_id: breakpoint.valuationId,
  breakpoint_order: breakpoint.breakpointOrder,
  breakpoint_type: breakpoint.breakpointType,
  priority_order: breakpoint.priorityOrder,
  range_from: breakpoint.rangeFrom.toString(),
  range_to: breakpoint.rangeTo?.toString() || null,
  is_open_ended: breakpoint.isOpenEnded,
  total_participating_shares: breakpoint.totalParticipatingShares.toString(),
  section_rvps: breakpoint.sectionRVPS.toString(),
  explanation: breakpoint.explanation,
  mathematical_derivation: breakpoint.mathematicalDerivation,
  calculation_method: breakpoint.calculationMethod,
  dependencies: JSON.stringify(breakpoint.dependencies),
  affected_securities: JSON.stringify(breakpoint.affectedSecurities),
  metadata: JSON.stringify(breakpoint.metadata || {}),
}
```

### 3. `breakpoint_participation_details` Table

**Purpose:** Stores participant-level details for each breakpoint (who participates and their RVPS)

```sql
CREATE TABLE breakpoint_participation_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  breakpoint_id UUID NOT NULL REFERENCES ui_breakpoints(id) ON DELETE CASCADE,
  analysis_id UUID NOT NULL REFERENCES breakpoint_analyses(id) ON DELETE CASCADE,

  -- Participant Identification
  security_name TEXT NOT NULL,               -- e.g., "Series A", "Common Stock", "Options @ $1.25"
  security_type TEXT NOT NULL,               -- 'common', 'preferred_series', 'option_pool'

  -- Participation Details
  participating_shares NUMERIC(20, 2) NOT NULL,
  participation_percentage NUMERIC(10, 8) NOT NULL,  -- Decimal percentage (0.2543 = 25.43%)

  -- RVPS Tracking
  rvps_at_breakpoint NUMERIC(20, 10) NOT NULL,       -- RVPS increment from THIS range
  cumulative_rvps NUMERIC(20, 10) NOT NULL,          -- Total RVPS up to this point

  -- Value Tracking
  section_value NUMERIC(20, 2) NOT NULL,             -- Dollar value from THIS range
  cumulative_value NUMERIC(20, 2) NOT NULL,          -- Total dollar value up to this point

  -- Status
  participation_status TEXT NOT NULL,        -- 'active', 'capped', 'converted', 'exercised', 'inactive'
  participation_notes TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT valid_security_type CHECK (
    security_type IN ('common', 'preferred_series', 'option_pool')
  ),
  CONSTRAINT valid_participation_status CHECK (
    participation_status IN ('active', 'capped', 'converted', 'exercised', 'inactive')
  ),
  CONSTRAINT valid_percentage CHECK (
    participation_percentage >= 0 AND participation_percentage <= 1
  )
);

CREATE INDEX idx_participation_breakpoint ON breakpoint_participation_details(breakpoint_id);
CREATE INDEX idx_participation_analysis ON breakpoint_participation_details(analysis_id);
CREATE INDEX idx_participation_security ON breakpoint_participation_details(analysis_id, security_name);
```

**Domain Mapping:**

```typescript
// Domain → DB
const participantRecord = {
  id: uuidv4(),
  breakpoint_id: breakpointId,
  analysis_id: analysisId,
  security_name: participant.securityName,
  security_type: participant.securityType,
  participating_shares: participant.participatingShares.toString(),
  participation_percentage: participant.participationPercentage.toString(),
  rvps_at_breakpoint: participant.rvpsAtBreakpoint.toString(),
  cumulative_rvps: participant.cumulativeRVPS.toString(),
  section_value: participant.sectionValue.toString(),
  cumulative_value: participant.cumulativeValue.toString(),
  participation_status: participant.participationStatus,
  participation_notes: participant.participationNotes || null,
}
```

---

## Transformation Mappings

### DatabaseToBreakpointTransformer

**Input:** Raw database records from `share_classes`, `options_warrants`, `valuations`

**Output:** `CapTableSnapshot` (domain model)

```typescript
class DatabaseToBreakpointTransformer {
  async transform(valuationId: string): Promise<CapTableSnapshot> {
    // 1. Load preferred classes
    const preferredRows = await supabase
      .from('share_classes')
      .select('*')
      .eq('valuation_id', valuationId)
      .eq('share_type', 'preferred')
      .order('seniority', { ascending: true })

    const preferredSeries: PreferredShareClass[] = preferredRows.data.map((row) => ({
      id: row.id,
      name: row.name,
      shareType: 'preferred',
      sharesOutstanding: new Decimal(row.shares_outstanding),
      pricePerShare: new Decimal(row.price_per_share),
      liquidationMultiple: new Decimal(row.liquidation_multiple),
      totalLiquidationPreference: new Decimal(row.total_liquidation_preference),
      seniority: row.seniority,
      preferenceType: row.preference_type as PreferenceType,
      participationCap: row.participation_cap ? new Decimal(row.participation_cap) : null,
      conversionRatio: new Decimal(row.conversion_ratio),
      roundDate: new Date(row.round_date),
      dividendsDeclared: row.dividends_declared,
      dividendsRate: row.dividends_rate ? new Decimal(row.dividends_rate) : null,
      dividendsType: row.dividends_type,
      pik: row.pik,
    }))

    // 2. Load options
    const optionRows = await supabase
      .from('options_warrants')
      .select('*')
      .eq('valuation_id', valuationId)

    const options: OptionGrant[] = optionRows.data.map((row) => ({
      id: row.id,
      poolName: row.pool_name,
      numOptions: new Decimal(row.num_options),
      exercisePrice: new Decimal(row.exercise_price),
      vested: new Decimal(row.vested),
      optionType: row.option_type as OptionType,
      grantDate: new Date(row.grant_date),
      expirationDate: row.expiration_date ? new Date(row.expiration_date) : undefined,
    }))

    // 3. Calculate common stock
    const commonShares = await this.calculateCommonShares(valuationId)
    const commonStock: CommonStock = {
      sharesOutstanding: new Decimal(commonShares),
      shareholders: [],
      metadata: {},
    }

    // 4. Build snapshot
    return {
      id: uuidv4(),
      valuationId,
      companyId: preferredRows.data[0]?.company_id,
      preferredSeries,
      commonStock,
      options,
      snapshotTimestamp: new Date(),
      metadata: {
        totalFullyDilutedShares: this.calculateTotalShares(commonStock, preferredSeries, options),
        totalLiquidationPreference: this.calculateTotalLP(preferredSeries),
      },
    }
  }

  private calculateCommonShares(valuationId: string): Promise<number> {
    // Implementation: query common shares from database or calculate
  }

  private calculateTotalShares(
    common: CommonStock,
    preferred: PreferredShareClass[],
    options: OptionGrant[]
  ): Decimal {
    return common.sharesOutstanding
      .plus(preferred.reduce((sum, p) => sum.plus(p.sharesOutstanding), new Decimal(0)))
      .plus(options.reduce((sum, o) => sum.plus(o.numOptions), new Decimal(0)))
  }

  private calculateTotalLP(preferred: PreferredShareClass[]): Decimal {
    return preferred.reduce((sum, p) => sum.plus(p.totalLiquidationPreference), new Decimal(0))
  }
}
```

### BreakpointToDatabaseTransformer

**Input:** `BreakpointAnalysisResult` (domain model)

**Output:** Database records for `breakpoint_analyses`, `ui_breakpoints`, `breakpoint_participation_details`

```typescript
class BreakpointToDatabaseTransformer {
  async transform(
    analysis: BreakpointAnalysisResult,
    valuationId: string,
    companyId: string
  ): Promise<void> {
    // 1. Create analysis record
    const analysisRecord = {
      id: uuidv4(),
      valuation_id: valuationId,
      company_id: companyId,
      total_breakpoints: analysis.totalBreakpoints,
      lp_breakpoints: analysis.breakpointsByType.liquidation_preference,
      pro_rata_breakpoints: analysis.breakpointsByType.pro_rata_distribution,
      option_breakpoints: analysis.breakpointsByType.option_exercise,
      conversion_breakpoints: analysis.breakpointsByType.voluntary_conversion,
      cap_breakpoints: analysis.breakpointsByType.participation_cap,
      class_rvps_analysis: this.serializeClassRVPS(analysis.classRVPSAnalysis),
      conversion_order: this.serializeConversionOrder(analysis.conversionOrder),
      audit_trail: analysis.auditTrail,
      analysis_time_ms: analysis.performanceMetrics.analysisTimeMs,
      solver_iterations: JSON.stringify(analysis.performanceMetrics.iterationsUsed),
      validation_passed: analysis.validationResults.every((v) => v.passed),
      validation_tests: JSON.stringify(analysis.validationResults),
      analyzer_version: 'v3.0.0',
    }

    const { data: insertedAnalysis } = await supabase
      .from('breakpoint_analyses')
      .insert(analysisRecord)
      .select()
      .single()

    const analysisId = insertedAnalysis.id

    // 2. Create UI breakpoint records
    const uiBreakpoints = analysis.rangeBasedBreakpoints.map((bp) => ({
      id: uuidv4(),
      analysis_id: analysisId,
      valuation_id: valuationId,
      breakpoint_order: bp.breakpointOrder,
      breakpoint_type: bp.breakpointType,
      priority_order: bp.priorityOrder,
      range_from: bp.rangeFrom.toString(),
      range_to: bp.rangeTo?.toString() || null,
      is_open_ended: bp.isOpenEnded,
      total_participating_shares: bp.totalParticipatingShares.toString(),
      section_rvps: bp.sectionRVPS.toString(),
      explanation: bp.explanation,
      mathematical_derivation: bp.mathematicalDerivation,
      calculation_method: bp.calculationMethod,
      dependencies: JSON.stringify(bp.dependencies),
      affected_securities: JSON.stringify(bp.affectedSecurities),
      metadata: JSON.stringify(bp.metadata || {}),
    }))

    const { data: insertedBreakpoints } = await supabase
      .from('ui_breakpoints')
      .insert(uiBreakpoints)
      .select()

    // 3. Create participation detail records
    const participationRecords = []
    for (let i = 0; i < analysis.rangeBasedBreakpoints.length; i++) {
      const breakpoint = analysis.rangeBasedBreakpoints[i]
      const breakpointId = insertedBreakpoints[i].id

      for (const participant of breakpoint.participants) {
        participationRecords.push({
          id: uuidv4(),
          breakpoint_id: breakpointId,
          analysis_id: analysisId,
          security_name: participant.securityName,
          security_type: participant.securityType,
          participating_shares: participant.participatingShares.toString(),
          participation_percentage: participant.participationPercentage.toString(),
          rvps_at_breakpoint: participant.rvpsAtBreakpoint.toString(),
          cumulative_rvps: participant.cumulativeRVPS.toString(),
          section_value: participant.sectionValue.toString(),
          cumulative_value: participant.cumulativeValue.toString(),
          participation_status: participant.participationStatus,
          participation_notes: participant.participationNotes || null,
        })
      }
    }

    await supabase.from('breakpoint_participation_details').insert(participationRecords)
  }

  private serializeClassRVPS(analysis: ConversionOrderResult): string {
    return JSON.stringify(
      analysis.orderedClasses.map((c) => ({
        seriesName: c.seriesName,
        classLiquidationPreference: c.classLiquidationPreference.toString(),
        classTotalShares: c.classTotalShares.toString(),
        classRVPS: c.classRVPS.toString(),
        isParticipating: c.isParticipating,
        preferenceType: c.preferenceType,
        conversionPriority: c.conversionPriority,
        calculationDetails: c.calculationDetails,
      }))
    )
  }

  private serializeConversionOrder(orderedClasses: ClassRVPSAnalysis[]): string {
    return JSON.stringify({
      orderedClasses: orderedClasses.map((c) => c.seriesName),
      orderingLogic: 'Lowest RVPS converts first (lowest opportunity cost)',
    })
  }
}
```

---

## Indexes & Constraints

### Performance Indexes

```sql
-- Frequently queried by valuation_id
CREATE INDEX idx_share_classes_valuation ON share_classes(valuation_id);
CREATE INDEX idx_options_valuation ON options_warrants(valuation_id);
CREATE INDEX idx_analyses_valuation ON breakpoint_analyses(valuation_id);
CREATE INDEX idx_ui_breakpoints_valuation ON ui_breakpoints(valuation_id);

-- Sorting by seniority (LP analysis)
CREATE INDEX idx_share_classes_seniority ON share_classes(valuation_id, seniority);

-- Grouping options by strike price
CREATE INDEX idx_options_strike ON options_warrants(valuation_id, exercise_price);

-- Sorting breakpoints by order
CREATE INDEX idx_ui_breakpoints_order ON ui_breakpoints(valuation_id, breakpoint_order);

-- Filtering by breakpoint type
CREATE INDEX idx_ui_breakpoints_type ON ui_breakpoints(valuation_id, breakpoint_type);

-- Joining participation details
CREATE INDEX idx_participation_breakpoint ON breakpoint_participation_details(breakpoint_id);
CREATE INDEX idx_participation_analysis ON breakpoint_participation_details(analysis_id);

-- Recent analyses (for caching)
CREATE INDEX idx_analyses_created ON breakpoint_analyses(created_at DESC);
```

### Data Integrity Constraints

```sql
-- Seniority must be unique per valuation
CREATE UNIQUE INDEX idx_unique_seniority
ON share_classes(valuation_id, seniority);

-- Share class name must be unique per valuation
CREATE UNIQUE INDEX idx_unique_share_class_name
ON share_classes(valuation_id, name);

-- Breakpoint order must be unique per analysis
CREATE UNIQUE INDEX idx_unique_breakpoint_order
ON ui_breakpoints(analysis_id, breakpoint_order);

-- Breakpoint count validation
ALTER TABLE breakpoint_analyses
ADD CONSTRAINT valid_breakpoint_counts CHECK (
  total_breakpoints =
    lp_breakpoints + pro_rata_breakpoints + option_breakpoints +
    conversion_breakpoints + cap_breakpoints
);

-- Range validation
ALTER TABLE ui_breakpoints
ADD CONSTRAINT valid_range CHECK (
  (range_to IS NULL AND is_open_ended = TRUE) OR
  (range_to IS NOT NULL AND range_to > range_from AND is_open_ended = FALSE)
);

-- Participation percentage validation
ALTER TABLE breakpoint_participation_details
ADD CONSTRAINT valid_percentage CHECK (
  participation_percentage >= 0 AND participation_percentage <= 1
);
```

---

## Query Patterns

### 1. Load Cap Table for Analysis

```sql
-- Single query to load all cap table data
WITH preferred AS (
  SELECT
    id, name, shares_outstanding, price_per_share,
    liquidation_multiple, total_liquidation_preference,
    seniority, preference_type, participation_cap,
    conversion_ratio, round_date,
    dividends_declared, dividends_rate, dividends_type, pik
  FROM share_classes
  WHERE valuation_id = $1 AND share_type = 'preferred'
  ORDER BY seniority ASC
),
options AS (
  SELECT
    id, pool_name, num_options, exercise_price,
    vested, option_type, grant_date, expiration_date
  FROM options_warrants
  WHERE valuation_id = $1
),
common AS (
  SELECT
    COALESCE(SUM(shares_outstanding), 0) as total_common_shares
  FROM share_classes
  WHERE valuation_id = $1 AND share_type = 'common'
)
SELECT
  json_build_object(
    'preferredSeries', (SELECT json_agg(preferred.*) FROM preferred),
    'options', (SELECT json_agg(options.*) FROM options),
    'commonShares', (SELECT total_common_shares FROM common)
  ) as cap_table;
```

### 2. Fetch Breakpoint Analysis Results

```sql
-- Fetch complete analysis with all breakpoints and participation details
SELECT
  ba.*,
  json_agg(
    json_build_object(
      'breakpoint', ub.*,
      'participants', (
        SELECT json_agg(bpd.*)
        FROM breakpoint_participation_details bpd
        WHERE bpd.breakpoint_id = ub.id
      )
    ) ORDER BY ub.breakpoint_order
  ) as breakpoints
FROM breakpoint_analyses ba
LEFT JOIN ui_breakpoints ub ON ub.analysis_id = ba.id
WHERE ba.valuation_id = $1
GROUP BY ba.id
ORDER BY ba.created_at DESC
LIMIT 1;
```

### 3. Track RVPS History for a Security

```sql
-- Get cumulative RVPS history for a specific security
SELECT
  ub.breakpoint_order,
  ub.breakpoint_type,
  ub.range_from,
  ub.range_to,
  bpd.security_name,
  bpd.rvps_at_breakpoint,
  bpd.cumulative_rvps,
  bpd.section_value,
  bpd.cumulative_value
FROM breakpoint_participation_details bpd
JOIN ui_breakpoints ub ON ub.id = bpd.breakpoint_id
WHERE bpd.analysis_id = $1
  AND bpd.security_name = $2
ORDER BY ub.breakpoint_order ASC;
```

### 4. Validate Breakpoint Counts

```sql
-- Verify expected breakpoint counts match actual
WITH expected AS (
  SELECT
    valuation_id,
    COUNT(DISTINCT seniority) as expected_lp,
    1 as expected_pro_rata,
    COUNT(DISTINCT exercise_price) FILTER (
      WHERE exercise_price > 0.01
    ) as expected_options
  FROM share_classes sc
  LEFT JOIN options_warrants ow ON ow.valuation_id = sc.valuation_id
  WHERE sc.valuation_id = $1
  GROUP BY sc.valuation_id
),
actual AS (
  SELECT
    valuation_id,
    lp_breakpoints,
    pro_rata_breakpoints,
    option_breakpoints
  FROM breakpoint_analyses
  WHERE valuation_id = $1
  ORDER BY created_at DESC
  LIMIT 1
)
SELECT
  e.expected_lp = a.lp_breakpoints as lp_match,
  e.expected_pro_rata = a.pro_rata_breakpoints as pro_rata_match,
  e.expected_options = a.option_breakpoints as options_match
FROM expected e
CROSS JOIN actual a;
```

---

## Migration Strategy

### Phase 1: Create New Tables (Non-Breaking)

```sql
-- Run these migrations without affecting existing system
CREATE TABLE breakpoint_analyses (...);
CREATE TABLE ui_breakpoints (...);
CREATE TABLE breakpoint_participation_details (...);
```

### Phase 2: Dual-Write (Transition Period)

```typescript
// API writes to BOTH old and new tables
async function saveBreakpointAnalysis(analysis: BreakpointAnalysisResult) {
  // Write to V3 tables (new)
  await v3Transformer.transform(analysis, valuationId, companyId)

  // Also write to V2 tables (old) for backward compatibility
  await v2Transformer.transform(analysis, valuationId, companyId)
}
```

### Phase 3: Migrate Historical Data

```sql
-- Backfill V3 tables from V2 data
INSERT INTO breakpoint_analyses (...)
SELECT ... FROM old_breakpoint_table
WHERE created_at >= '2024-01-01';
```

### Phase 4: Switch Reads to V3

```typescript
// Frontend queries V3 tables exclusively
const analysis = await fetch(`/api/valuations/${id}/breakpoints/v3`)
```

### Phase 5: Deprecate V2 Tables

```sql
-- After successful migration and testing
DROP TABLE old_breakpoint_table;
DROP TABLE old_breakpoint_details_table;
```

---

## Next Steps

For API integration details, see [API_INTEGRATION.md](./API_INTEGRATION.md)

For frontend integration details, see [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md)

For module interactions, see [MODULE_INTERACTIONS.md](./MODULE_INTERACTIONS.md)
