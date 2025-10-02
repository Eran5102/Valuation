-- ============================================
-- SIMPLIFIED RLS POLICIES (NO RECURSION)
-- ============================================
-- This completely replaces all RLS policies with simple, non-recursive ones
-- ============================================

-- ============================================
-- STEP 1: DROP ALL EXISTING POLICIES
-- ============================================

-- Drop organizations policies
DROP POLICY IF EXISTS "Super admins full access to organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can create their own organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can view their organizations" ON public.organizations;
DROP POLICY IF EXISTS "Owners and admins can update organizations" ON public.organizations;

-- Drop organization_members policies
DROP POLICY IF EXISTS "Super admins full access to members" ON public.organization_members;
DROP POLICY IF EXISTS "Users can view own membership" ON public.organization_members;
DROP POLICY IF EXISTS "Users can view org members" ON public.organization_members;
DROP POLICY IF EXISTS "Org owners can manage members" ON public.organization_members;
DROP POLICY IF EXISTS "Users can create own membership" ON public.organization_members;
DROP POLICY IF EXISTS "Users can view organization members" ON public.organization_members;
DROP POLICY IF EXISTS "Users can manage memberships" ON public.organization_members;

-- Drop super_admins policies
DROP POLICY IF EXISTS "Anyone can read super_admins" ON public.super_admins;
DROP POLICY IF EXISTS "First super admin or existing super admins can insert" ON public.super_admins;
DROP POLICY IF EXISTS "Super admins can update super_admins" ON public.super_admins;
DROP POLICY IF EXISTS "Super admins can delete super_admins" ON public.super_admins;
DROP POLICY IF EXISTS "Everyone can read super_admins" ON public.super_admins;
DROP POLICY IF EXISTS "Allow super admin creation" ON public.super_admins;
DROP POLICY IF EXISTS "Super admins can manage super_admins" ON public.super_admins;

-- ============================================
-- STEP 2: DISABLE RLS TEMPORARILY
-- ============================================
ALTER TABLE public.super_admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: RE-ENABLE RLS WITH SIMPLE POLICIES
-- ============================================

-- SUPER_ADMINS: Allow everyone to read (needed for permission checks)
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admins_select"
  ON public.super_admins
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "super_admins_insert"
  ON public.super_admins
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "super_admins_all"
  ON public.super_admins
  FOR ALL
  TO authenticated
  USING (true);

-- ORGANIZATIONS: Allow authenticated users to read and manage
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "organizations_select"
  ON public.organizations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "organizations_insert"
  ON public.organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "organizations_update"
  ON public.organizations
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- ORGANIZATION_MEMBERS: Allow authenticated users to read and manage
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_select"
  ON public.organization_members
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "members_insert"
  ON public.organization_members
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "members_update"
  ON public.organization_members
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "members_delete"
  ON public.organization_members
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- STEP 4: SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  RLS POLICIES SIMPLIFIED - SUCCESS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'All policies recreated without recursion';
  RAISE NOTICE 'Policies are now permissive for testing';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Refresh your application';
  RAISE NOTICE '2. Organization name should appear';
  RAISE NOTICE '3. Super admin panel should work';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;