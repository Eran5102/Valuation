-- ============================================
-- FIX VALUATION_ASSUMPTIONS TABLE & POLICY
-- ============================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can access assumptions for their org valuations" ON public.valuation_assumptions;

-- Recreate the policy with correct permissions
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

-- Ensure RLS is enabled
ALTER TABLE public.valuation_assumptions ENABLE ROW LEVEL SECURITY;

-- Verify the update trigger exists
DROP TRIGGER IF EXISTS update_valuation_assumptions_updated_at ON public.valuation_assumptions;
CREATE TRIGGER update_valuation_assumptions_updated_at
    BEFORE UPDATE ON public.valuation_assumptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
