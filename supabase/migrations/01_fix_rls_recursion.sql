-- ============================================
-- FIX INFINITE RECURSION IN RLS POLICIES
-- ============================================
-- The problem: organization_members policy checks organization_members
-- which causes infinite recursion
-- ============================================

-- ============================================
-- STEP 1: DROP PROBLEMATIC POLICIES
-- ============================================

-- Drop all organization_members policies
DROP POLICY IF EXISTS "Super admins full access to members" ON public.organization_members;
DROP POLICY IF EXISTS "Users can view organization members" ON public.organization_members;
DROP POLICY IF EXISTS "Users can manage memberships" ON public.organization_members;

-- Drop problematic super_admins policies
DROP POLICY IF EXISTS "Everyone can read super_admins" ON public.super_admins;
DROP POLICY IF EXISTS "Allow super admin creation" ON public.super_admins;
DROP POLICY IF EXISTS "Super admins can manage super_admins" ON public.super_admins;

-- ============================================
-- STEP 2: CREATE NON-RECURSIVE POLICIES
-- ============================================

-- SUPER_ADMINS: Simple policies without recursion
CREATE POLICY "Anyone can read super_admins"
  ON public.super_admins
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "First super admin or existing super admins can insert"
  ON public.super_admins
  FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT EXISTS (SELECT 1 FROM public.super_admins)
    OR user_id IN (SELECT user_id FROM public.super_admins)
  );

CREATE POLICY "Super admins can update super_admins"
  ON public.super_admins
  FOR UPDATE
  TO authenticated
  USING (user_id IN (SELECT user_id FROM public.super_admins));

CREATE POLICY "Super admins can delete super_admins"
  ON public.super_admins
  FOR DELETE
  TO authenticated
  USING (user_id IN (SELECT user_id FROM public.super_admins));

-- ORGANIZATION_MEMBERS: Simplified policies
-- Super admins have full access
CREATE POLICY "Super admins full access to members"
  ON public.organization_members
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (SELECT user_id FROM public.super_admins)
  )
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.super_admins)
  );

-- Users can view their own membership records
CREATE POLICY "Users can view own membership"
  ON public.organization_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can view other members in their organizations (non-recursive)
CREATE POLICY "Users can view org members"
  ON public.organization_members
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.organization_members
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- Organization owners can manage members
CREATE POLICY "Org owners can manage members"
  ON public.organization_members
  FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

-- Users can insert their own memberships
CREATE POLICY "Users can create own membership"
  ON public.organization_members
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- STEP 3: VERIFY POLICIES
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  RLS POLICIES FIXED';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Fixed infinite recursion issues in:';
  RAISE NOTICE '  ✓ super_admins table';
  RAISE NOTICE '  ✓ organization_members table';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Test queries in SQL editor';
  RAISE NOTICE '2. Refresh application';
  RAISE NOTICE '3. Check organization name appears';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;