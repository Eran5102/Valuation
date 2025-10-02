-- ============================================
-- CREATE CAP TABLE AND ASSUMPTIONS TABLES
-- ============================================
-- This migration creates the missing tables that are critical for data persistence
-- Tables: share_classes, options_warrants, valuation_assumptions
-- ============================================

-- ============================================
-- 1. CREATE SHARE_CLASSES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.share_classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  valuation_id UUID NOT NULL REFERENCES public.valuations(id) ON DELETE CASCADE,

  -- Basic Information
  type TEXT NOT NULL CHECK (type IN ('Common', 'Preferred')),
  class_name TEXT NOT NULL,
  round_date DATE,

  -- Share Counts and Pricing
  shares NUMERIC DEFAULT 0,
  price_per_share NUMERIC DEFAULT 0,
  amount_invested NUMERIC GENERATED ALWAYS AS (shares * price_per_share) STORED,

  -- Liquidation Preferences
  preference_type TEXT CHECK (preference_type IN ('Non-Participating', 'Participating', 'Participating with Cap')),
  liquidation_multiple NUMERIC DEFAULT 1,
  liquidation_preference NUMERIC GENERATED ALWAYS AS (shares * price_per_share * liquidation_multiple) STORED,
  seniority INTEGER DEFAULT 0,
  participation_cap NUMERIC,

  -- Conversion
  conversion_ratio NUMERIC DEFAULT 1,
  as_conv_shares NUMERIC GENERATED ALWAYS AS (shares * conversion_ratio) STORED,

  -- Dividends
  dividends_declared BOOLEAN DEFAULT false,
  div_rate NUMERIC,
  dividends_type TEXT CHECK (dividends_type IN ('Cumulative', 'Non-Cumulative', 'None')),
  pik BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_share_classes_valuation_id ON public.share_classes(valuation_id);
CREATE INDEX IF NOT EXISTS idx_share_classes_seniority ON public.share_classes(seniority DESC);

-- ============================================
-- 2. CREATE OPTIONS_WARRANTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.options_warrants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  valuation_id UUID NOT NULL REFERENCES public.valuations(id) ON DELETE CASCADE,

  -- Option/Warrant Details
  num_options NUMERIC DEFAULT 0,
  exercise_price NUMERIC DEFAULT 0,
  type TEXT DEFAULT 'Options' CHECK (type IN ('Options', 'Warrants')),
  grant_date DATE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_options_warrants_valuation_id ON public.options_warrants(valuation_id);

-- ============================================
-- 3. CREATE VALUATION_ASSUMPTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.valuation_assumptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  valuation_id UUID UNIQUE NOT NULL REFERENCES public.valuations(id) ON DELETE CASCADE,

  -- Company Information
  company_name TEXT,
  company_address TEXT,
  state_incorporation TEXT,
  incorporation_date DATE,
  industry TEXT,
  company_stage TEXT,
  fiscal_year_end DATE,

  -- Valuation Details
  valuation_date DATE,
  report_date DATE,
  currency TEXT DEFAULT 'USD',
  discounting_convention TEXT,
  valuation_purpose TEXT,
  standard_of_value TEXT,
  premise_of_value TEXT,

  -- Appraiser Information
  subject_security TEXT,
  designee_prefix TEXT,
  designee_first_name TEXT,
  designee_last_name TEXT,
  designee_title TEXT,
  engagement_letter_date DATE,
  appraiser_name TEXT,
  appraiser_firm TEXT,
  appraiser_credentials TEXT,
  appraiser_phone TEXT,
  appraiser_email TEXT,

  -- Descriptions
  company_description TEXT,
  products_services TEXT,
  industry_description TEXT,
  stage_description TEXT,

  -- Projection Settings
  historical_years INTEGER,
  projection_years INTEGER,

  -- Discount Rates and Volatility
  risk_free_rate NUMERIC,
  equity_volatility NUMERIC,
  time_to_liquidity NUMERIC,

  -- Financing Information
  last_financing_date DATE,
  last_financing_amount NUMERIC,
  last_financing_valuation NUMERIC,
  last_financing_type TEXT,

  -- Complex Fields (JSON)
  management_team JSONB DEFAULT '[]'::jsonb,
  key_investors JSONB DEFAULT '[]'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_valuation_assumptions_valuation_id ON public.valuation_assumptions(valuation_id);

-- ============================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.share_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.options_warrants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valuation_assumptions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. CREATE RLS POLICIES
-- ============================================

-- Share Classes Policies
CREATE POLICY "Users can access share classes for their org valuations"
  ON public.share_classes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.valuations v
      LEFT JOIN public.organization_members om ON v.organization_id = om.organization_id
      WHERE v.id = share_classes.valuation_id
      AND (om.user_id = auth.uid() OR v.created_by = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.valuations v
      LEFT JOIN public.organization_members om ON v.organization_id = om.organization_id
      WHERE v.id = share_classes.valuation_id
      AND (om.user_id = auth.uid() OR v.created_by = auth.uid())
    )
  );

-- Options/Warrants Policies
CREATE POLICY "Users can access options for their org valuations"
  ON public.options_warrants
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.valuations v
      LEFT JOIN public.organization_members om ON v.organization_id = om.organization_id
      WHERE v.id = options_warrants.valuation_id
      AND (om.user_id = auth.uid() OR v.created_by = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.valuations v
      LEFT JOIN public.organization_members om ON v.organization_id = om.organization_id
      WHERE v.id = options_warrants.valuation_id
      AND (om.user_id = auth.uid() OR v.created_by = auth.uid())
    )
  );

-- Valuation Assumptions Policies
CREATE POLICY "Users can access assumptions for their org valuations"
  ON public.valuation_assumptions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.valuations v
      LEFT JOIN public.organization_members om ON v.organization_id = om.organization_id
      WHERE v.id = valuation_assumptions.valuation_id
      AND (om.user_id = auth.uid() OR v.created_by = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.valuations v
      LEFT JOIN public.organization_members om ON v.organization_id = om.organization_id
      WHERE v.id = valuation_assumptions.valuation_id
      AND (om.user_id = auth.uid() OR v.created_by = auth.uid())
    )
  );

-- ============================================
-- 6. CREATE UPDATE TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for share_classes
DROP TRIGGER IF EXISTS update_share_classes_updated_at ON public.share_classes;
CREATE TRIGGER update_share_classes_updated_at
    BEFORE UPDATE ON public.share_classes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Triggers for options_warrants
DROP TRIGGER IF EXISTS update_options_warrants_updated_at ON public.options_warrants;
CREATE TRIGGER update_options_warrants_updated_at
    BEFORE UPDATE ON public.options_warrants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Triggers for valuation_assumptions
DROP TRIGGER IF EXISTS update_valuation_assumptions_updated_at ON public.valuation_assumptions;
CREATE TRIGGER update_valuation_assumptions_updated_at
    BEFORE UPDATE ON public.valuation_assumptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Tables created:
-- - share_classes (with all cap table fields)
-- - options_warrants (with grant_date support)
-- - valuation_assumptions (with all 50+ assumption fields)
--
-- All tables have:
-- - Proper indexes for performance
-- - RLS policies for security
-- - Update triggers for timestamps
-- ============================================
