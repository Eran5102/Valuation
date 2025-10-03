-- ============================================
-- CREATE BREAKPOINTS PERSISTENCE TABLES
-- ============================================
-- This migration creates tables to persist breakpoint analysis results
-- for faster UI rendering and historical tracking
-- ============================================

-- ============================================
-- 1. CREATE BREAKPOINT_ANALYSES PARENT TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.breakpoint_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    valuation_id UUID NOT NULL REFERENCES public.valuations(id) ON DELETE CASCADE,

    -- Analysis Metadata
    analysis_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    total_breakpoints INTEGER NOT NULL,
    breakpoints_by_type JSONB DEFAULT '{}'::jsonb, -- {"liquidation_preference": 2, "pro_rata_distribution": 1, ...}

    -- Analysis Parameters
    analysis_parameters JSONB DEFAULT '{}'::jsonb, -- {includeOptions: true, analysisType: "comprehensive", ...}

    -- Performance Metrics
    performance_metrics JSONB DEFAULT '{}'::jsonb, -- {analysisTimeMs: 245, iterationsUsed: {...}, cacheHits: 12}

    -- Audit and Validation
    audit_summary TEXT,
    validation_results JSONB DEFAULT '[]'::jsonb, -- Array of validation test results

    -- Tracking
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure only one active analysis per valuation (optional: can have historical)
    is_active BOOLEAN DEFAULT true
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_breakpoint_analyses_valuation_id ON public.breakpoint_analyses(valuation_id);
CREATE INDEX IF NOT EXISTS idx_breakpoint_analyses_active ON public.breakpoint_analyses(valuation_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_breakpoint_analyses_timestamp ON public.breakpoint_analyses(analysis_timestamp DESC);

-- ============================================
-- 2. CREATE UI_BREAKPOINTS TABLE (Enhanced)
-- ============================================

CREATE TABLE IF NOT EXISTS public.ui_breakpoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID NOT NULL REFERENCES public.breakpoint_analyses(id) ON DELETE CASCADE,
    valuation_id UUID NOT NULL REFERENCES public.valuations(id) ON DELETE CASCADE, -- For direct queries

    -- Range Identification
    breakpoint_order INTEGER NOT NULL, -- Sequential UI order (1, 2, 3...)
    breakpoint_name VARCHAR(200) NOT NULL, -- "1st Liquidation Preference", "Options @ $1.25 Exercise"
    breakpoint_type VARCHAR(50) NOT NULL CHECK (breakpoint_type IN (
        'liquidation_preference',
        'pro_rata_distribution',
        'option_exercise',
        'participation_cap',
        'voluntary_conversion'
    )),

    -- Exit Value Range
    from_value DECIMAL(20,2) NOT NULL, -- Range start (e.g., $0)
    to_value DECIMAL(20,2), -- Range end (NULL for open-ended)
    exit_value DECIMAL(20,2) NOT NULL, -- The actual breakpoint exit value
    is_open_ended BOOLEAN DEFAULT FALSE,

    -- Participation Details
    total_participating_shares DECIMAL(20,0) NOT NULL,

    -- RVPS Calculations
    section_rvps DECIMAL(15,6), -- RVPS for this specific range
    section_rvps_calculation_method VARCHAR(200), -- "cumulative_liquidation_preference", "pro_rata_share_value", etc.

    -- Additional Breakpoint Metadata
    priority_order INTEGER NOT NULL, -- Used for sorting (0-1000 for LP, 1000-2000 for pro-rata, etc.)
    calculation_method VARCHAR(200), -- How this breakpoint was calculated
    explanation TEXT, -- Human-readable explanation
    mathematical_derivation TEXT, -- Mathematical formula used
    dependencies TEXT[] DEFAULT '{}', -- Array of dependencies (e.g., ["seniority_rank_0_satisfied"])
    affected_securities TEXT[] DEFAULT '{}', -- Array of security names affected

    -- UI Display
    tooltip_explanation TEXT, -- Shorter version for UI tooltips

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure proper ordering
    UNIQUE(analysis_id, breakpoint_order)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ui_breakpoints_analysis_id ON public.ui_breakpoints(analysis_id);
CREATE INDEX IF NOT EXISTS idx_ui_breakpoints_valuation_id ON public.ui_breakpoints(valuation_id);
CREATE INDEX IF NOT EXISTS idx_ui_breakpoints_order ON public.ui_breakpoints(analysis_id, breakpoint_order);
CREATE INDEX IF NOT EXISTS idx_ui_breakpoints_type ON public.ui_breakpoints(breakpoint_type);
CREATE INDEX IF NOT EXISTS idx_ui_breakpoints_exit_value ON public.ui_breakpoints(exit_value);

-- ============================================
-- 3. CREATE BREAKPOINT_PARTICIPATION_DETAILS TABLE (Enhanced)
-- ============================================

CREATE TABLE IF NOT EXISTS public.breakpoint_participation_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    breakpoint_id UUID NOT NULL REFERENCES public.ui_breakpoints(id) ON DELETE CASCADE,
    valuation_id UUID NOT NULL REFERENCES public.valuations(id) ON DELETE CASCADE, -- For direct filtering

    -- Security Identification
    security_type VARCHAR(50) NOT NULL, -- 'common', 'series_a', 'series_b', 'options_125', etc.
    security_display_name VARCHAR(200) NOT NULL, -- "Founders", "Series A", "Options @ $1.25"
    security_id UUID, -- Optional: Link to share_classes or options_warrants table

    -- Participation Amounts
    participating_shares DECIMAL(20,0) NOT NULL,
    participation_percentage DECIMAL(10,6) NOT NULL, -- Stored as decimal (0.6316 for 63.16%)

    -- RVPS Values
    section_rvps DECIMAL(15,6) NOT NULL, -- Value per share for this range
    cumulative_rvps DECIMAL(15,6) NOT NULL, -- Total value per share up to this point

    -- Dollar Values
    section_value DECIMAL(20,2) NOT NULL, -- Total $ value for this security in this range
    cumulative_value DECIMAL(20,2) NOT NULL, -- Total $ value for this security across all ranges

    -- Status Tracking
    participation_status VARCHAR(50) DEFAULT 'active' CHECK (participation_status IN (
        'active',
        'capped',
        'converted',
        'exercised',
        'inactive'
    )),
    participation_notes TEXT, -- Additional context

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure unique participation per breakpoint
    UNIQUE(breakpoint_id, security_type)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_breakpoint_participation_breakpoint_id ON public.breakpoint_participation_details(breakpoint_id);
CREATE INDEX IF NOT EXISTS idx_breakpoint_participation_valuation_id ON public.breakpoint_participation_details(valuation_id);
CREATE INDEX IF NOT EXISTS idx_breakpoint_participation_security ON public.breakpoint_participation_details(security_type);
CREATE INDEX IF NOT EXISTS idx_breakpoint_participation_shares ON public.breakpoint_participation_details(participating_shares DESC);

-- ============================================
-- 4. CREATE BREAKPOINT_CRITICAL_VALUES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.breakpoint_critical_values (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID NOT NULL REFERENCES public.breakpoint_analyses(id) ON DELETE CASCADE,
    breakpoint_id UUID REFERENCES public.ui_breakpoints(id) ON DELETE CASCADE, -- Link to specific breakpoint
    valuation_id UUID NOT NULL REFERENCES public.valuations(id) ON DELETE CASCADE,

    -- Critical Value Details
    value DECIMAL(20,2) NOT NULL, -- The critical exit value
    description TEXT NOT NULL, -- "Cumulative LP through seniority rank 0"
    affected_securities TEXT[] DEFAULT '{}', -- Array of security names
    triggers TEXT[] DEFAULT '{}', -- Array of trigger events (e.g., ["seniority_rank_0_satisfied"])

    -- Metadata
    value_type VARCHAR(50), -- 'liquidation_preference', 'conversion_threshold', 'cap_reached', etc.

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_critical_values_analysis_id ON public.breakpoint_critical_values(analysis_id);
CREATE INDEX IF NOT EXISTS idx_critical_values_breakpoint_id ON public.breakpoint_critical_values(breakpoint_id);
CREATE INDEX IF NOT EXISTS idx_critical_values_valuation_id ON public.breakpoint_critical_values(valuation_id);
CREATE INDEX IF NOT EXISTS idx_critical_values_value ON public.breakpoint_critical_values(value);

-- ============================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.breakpoint_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ui_breakpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breakpoint_participation_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breakpoint_critical_values ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. CREATE RLS POLICIES
-- ============================================

-- Breakpoint Analyses Policies
CREATE POLICY "Users can access breakpoint analyses for their org valuations"
  ON public.breakpoint_analyses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.valuations v
      LEFT JOIN public.organization_members om ON v.organization_id = om.organization_id
      WHERE v.id = breakpoint_analyses.valuation_id
      AND (om.user_id = auth.uid() OR v.created_by = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.valuations v
      LEFT JOIN public.organization_members om ON v.organization_id = om.organization_id
      WHERE v.id = breakpoint_analyses.valuation_id
      AND (om.user_id = auth.uid() OR v.created_by = auth.uid())
    )
  );

-- UI Breakpoints Policies
CREATE POLICY "Users can access ui breakpoints for their org valuations"
  ON public.ui_breakpoints
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.valuations v
      LEFT JOIN public.organization_members om ON v.organization_id = om.organization_id
      WHERE v.id = ui_breakpoints.valuation_id
      AND (om.user_id = auth.uid() OR v.created_by = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.valuations v
      LEFT JOIN public.organization_members om ON v.organization_id = om.organization_id
      WHERE v.id = ui_breakpoints.valuation_id
      AND (om.user_id = auth.uid() OR v.created_by = auth.uid())
    )
  );

-- Breakpoint Participation Details Policies
CREATE POLICY "Users can access participation details for their org valuations"
  ON public.breakpoint_participation_details
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.valuations v
      LEFT JOIN public.organization_members om ON v.organization_id = om.organization_id
      WHERE v.id = breakpoint_participation_details.valuation_id
      AND (om.user_id = auth.uid() OR v.created_by = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.valuations v
      LEFT JOIN public.organization_members om ON v.organization_id = om.organization_id
      WHERE v.id = breakpoint_participation_details.valuation_id
      AND (om.user_id = auth.uid() OR v.created_by = auth.uid())
    )
  );

-- Breakpoint Critical Values Policies
CREATE POLICY "Users can access critical values for their org valuations"
  ON public.breakpoint_critical_values
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.valuations v
      LEFT JOIN public.organization_members om ON v.organization_id = om.organization_id
      WHERE v.id = breakpoint_critical_values.valuation_id
      AND (om.user_id = auth.uid() OR v.created_by = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.valuations v
      LEFT JOIN public.organization_members om ON v.organization_id = om.organization_id
      WHERE v.id = breakpoint_critical_values.valuation_id
      AND (om.user_id = auth.uid() OR v.created_by = auth.uid())
    )
  );

-- ============================================
-- 7. CREATE UPDATE TRIGGERS
-- ============================================

-- Trigger for breakpoint_analyses
DROP TRIGGER IF EXISTS update_breakpoint_analyses_updated_at ON public.breakpoint_analyses;
CREATE TRIGGER update_breakpoint_analyses_updated_at
    BEFORE UPDATE ON public.breakpoint_analyses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for ui_breakpoints
DROP TRIGGER IF EXISTS update_ui_breakpoints_updated_at ON public.ui_breakpoints;
CREATE TRIGGER update_ui_breakpoints_updated_at
    BEFORE UPDATE ON public.ui_breakpoints
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. CREATE HELPER VIEWS
-- ============================================

-- View for complete breakpoint analysis with participation details
CREATE OR REPLACE VIEW public.breakpoints_with_participation AS
SELECT
    b.id as breakpoint_id,
    b.analysis_id,
    b.valuation_id,
    b.breakpoint_order,
    b.breakpoint_name,
    b.breakpoint_type,
    b.from_value,
    b.to_value,
    b.exit_value,
    b.is_open_ended,
    b.total_participating_shares,
    b.section_rvps,
    b.explanation,
    b.mathematical_derivation,
    json_agg(
        json_build_object(
            'security_type', pd.security_type,
            'security_display_name', pd.security_display_name,
            'participating_shares', pd.participating_shares,
            'participation_percentage', pd.participation_percentage,
            'section_rvps', pd.section_rvps,
            'cumulative_rvps', pd.cumulative_rvps,
            'section_value', pd.section_value,
            'cumulative_value', pd.cumulative_value,
            'participation_status', pd.participation_status
        ) ORDER BY pd.participating_shares DESC
    ) as participation_details
FROM public.ui_breakpoints b
LEFT JOIN public.breakpoint_participation_details pd ON b.id = pd.breakpoint_id
GROUP BY b.id, b.analysis_id, b.valuation_id, b.breakpoint_order, b.breakpoint_name,
         b.breakpoint_type, b.from_value, b.to_value, b.exit_value, b.is_open_ended,
         b.total_participating_shares, b.section_rvps, b.explanation, b.mathematical_derivation;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Tables created:
-- - breakpoint_analyses (parent analysis runs)
-- - ui_breakpoints (individual breakpoint ranges with enhanced metadata)
-- - breakpoint_participation_details (securities participating per range)
-- - breakpoint_critical_values (critical exit value points)
--
-- All tables have:
-- - Proper indexes for performance
-- - RLS policies for security
-- - Foreign key relationships
-- - Update triggers for timestamps
-- - Helper view for combined queries
-- ============================================
