-- ============================================
-- CREATE VALUATION_ASSUMPTIONS TABLE
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

-- Enable RLS
ALTER TABLE public.valuation_assumptions ENABLE ROW LEVEL SECURITY;

-- RLS Policy
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

-- Update trigger
DROP TRIGGER IF EXISTS update_valuation_assumptions_updated_at ON public.valuation_assumptions;
CREATE TRIGGER update_valuation_assumptions_updated_at
    BEFORE UPDATE ON public.valuation_assumptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
