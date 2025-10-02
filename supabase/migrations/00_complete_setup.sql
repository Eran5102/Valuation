-- ============================================
-- COMPLETE ORGANIZATION & SUPER ADMIN SETUP
-- ============================================
-- This is the MASTER migration that sets up everything needed
-- Can be run multiple times safely (idempotent)
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- STEP 1: CREATE/UPDATE ORGANIZATIONS TABLE
-- ============================================

-- Create organizations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT,
  logo_url TEXT,
  website TEXT,
  industry TEXT,
  size TEXT,
  owner_id UUID REFERENCES auth.users(id),
  billing_email TEXT,
  billing_address TEXT,
  max_users INTEGER,
  max_clients INTEGER,
  max_valuations INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'organizations'
                   AND column_name = 'subscription_tier') THEN
        ALTER TABLE public.organizations ADD COLUMN subscription_tier TEXT DEFAULT 'free';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'organizations'
                   AND column_name = 'subscription_status') THEN
        ALTER TABLE public.organizations ADD COLUMN subscription_status TEXT DEFAULT 'active';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'organizations'
                   AND column_name = 'subscription_plan') THEN
        ALTER TABLE public.organizations ADD COLUMN subscription_plan TEXT DEFAULT 'free';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'organizations'
                   AND column_name = 'settings') THEN
        ALTER TABLE public.organizations ADD COLUMN settings JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- ============================================
-- STEP 2: CREATE ORGANIZATION_MEMBERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'appraiser', 'analyst', 'viewer')),
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ,
  permissions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- ============================================
-- STEP 3: CREATE SUPER_ADMINS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.super_admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- STEP 4: ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: DROP ALL EXISTING POLICIES (CLEAN SLATE)
-- ============================================

-- Drop organizations policies
DROP POLICY IF EXISTS "Super admins can view all organizations" ON public.organizations;
DROP POLICY IF EXISTS "Super admins can manage all organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can view their organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can update their organizations" ON public.organizations;

-- Drop organization_members policies
DROP POLICY IF EXISTS "Super admins can view all organization members" ON public.organization_members;
DROP POLICY IF EXISTS "Super admins can manage all organization members" ON public.organization_members;
DROP POLICY IF EXISTS "Users can create memberships" ON public.organization_members;
DROP POLICY IF EXISTS "Users can view memberships" ON public.organization_members;
DROP POLICY IF EXISTS "Users can update memberships" ON public.organization_members;
DROP POLICY IF EXISTS "Users can delete memberships" ON public.organization_members;

-- Drop super_admins policies
DROP POLICY IF EXISTS "Allow authenticated users to read super_admins" ON public.super_admins;
DROP POLICY IF EXISTS "Allow service role to insert super_admins" ON public.super_admins;
DROP POLICY IF EXISTS "Super admins can manage super_admins" ON public.super_admins;
DROP POLICY IF EXISTS "Allow first super admin creation" ON public.super_admins;

-- ============================================
-- STEP 6: CREATE RLS POLICIES FOR ORGANIZATIONS
-- ============================================

-- Super admins can do everything with organizations
CREATE POLICY "Super admins full access to organizations"
  ON public.organizations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.super_admins
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.super_admins
      WHERE user_id = auth.uid()
    )
  );

-- Users can create their own organizations
CREATE POLICY "Users can create their own organizations"
  ON public.organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- Users can view organizations they belong to
CREATE POLICY "Users can view their organizations"
  ON public.organizations
  FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organizations.id
      AND om.user_id = auth.uid()
      AND om.is_active = true
    )
  );

-- Owners and admins can update their organizations
CREATE POLICY "Owners and admins can update organizations"
  ON public.organizations
  FOR UPDATE
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organizations.id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
      AND om.is_active = true
    )
  );

-- ============================================
-- STEP 7: CREATE RLS POLICIES FOR ORGANIZATION_MEMBERS
-- ============================================

-- Super admins can do everything with members
CREATE POLICY "Super admins full access to members"
  ON public.organization_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.super_admins
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.super_admins
      WHERE user_id = auth.uid()
    )
  );

-- Users can view members of their organizations
CREATE POLICY "Users can view organization members"
  ON public.organization_members
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.is_active = true
    )
  );

-- Users can add themselves to organizations they own
CREATE POLICY "Users can manage memberships"
  ON public.organization_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Users can add themselves
    user_id = auth.uid()
    OR
    -- Org owners can add members
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = organization_id
      AND o.owner_id = auth.uid()
    )
    OR
    -- Admins can add members
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
      AND om.is_active = true
    )
  );

-- ============================================
-- STEP 8: CREATE RLS POLICIES FOR SUPER_ADMINS
-- ============================================

-- Everyone can read super_admins (needed for permission checks)
CREATE POLICY "Everyone can read super_admins"
  ON public.super_admins
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow first super admin creation OR existing super admins can add more
CREATE POLICY "Allow super admin creation"
  ON public.super_admins
  FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT EXISTS (SELECT 1 FROM public.super_admins)
    OR
    EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid()
    )
  );

-- Only super admins can manage super_admins
CREATE POLICY "Super admins can manage super_admins"
  ON public.super_admins
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid()
    )
  );

-- ============================================
-- STEP 9: CREATE HELPER FUNCTIONS
-- ============================================

-- Function to check if a user is a super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(check_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.super_admins
    WHERE user_id = COALESCE(check_user_id, auth.uid())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.is_super_admin TO authenticated;

-- ============================================
-- STEP 10: CREATE INITIAL DATA
-- ============================================

DO $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
  v_member_exists BOOLEAN;
BEGIN
  -- Get user ID for eran@value8.ai
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'eran@value8.ai'
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    RAISE NOTICE '✓ Found user: eran@value8.ai (ID: %)', v_user_id;

    -- Make user a super admin if not already
    INSERT INTO public.super_admins (user_id, created_by)
    VALUES (v_user_id, v_user_id)
    ON CONFLICT (user_id) DO NOTHING;

    RAISE NOTICE '✓ Super admin status ensured';

    -- Check if user already has an organization
    SELECT id INTO v_org_id
    FROM public.organizations
    WHERE owner_id = v_user_id
    LIMIT 1;

    IF v_org_id IS NULL THEN
      -- Create Value8 organization
      INSERT INTO public.organizations (
        name,
        owner_id,
        subscription_tier,
        subscription_status,
        subscription_plan
      )
      VALUES (
        'Value8',
        v_user_id,
        'enterprise',
        'active',
        'enterprise'
      )
      RETURNING id INTO v_org_id;

      RAISE NOTICE '✓ Created organization: Value8 (ID: %)', v_org_id;
    ELSE
      RAISE NOTICE '✓ Organization already exists (ID: %)', v_org_id;
    END IF;

    -- Check if membership exists
    SELECT EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE user_id = v_user_id
      AND organization_id = v_org_id
    ) INTO v_member_exists;

    IF NOT v_member_exists THEN
      -- Add user as owner member
      INSERT INTO public.organization_members (
        organization_id,
        user_id,
        role,
        is_active
      )
      VALUES (
        v_org_id,
        v_user_id,
        'owner',
        true
      );

      RAISE NOTICE '✓ Added user as owner member';
    ELSE
      RAISE NOTICE '✓ Membership already exists';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ SETUP COMPLETE FOR eran@value8.ai';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Super Admin: YES';
    RAISE NOTICE 'Organization: Value8';
    RAISE NOTICE 'Role: Owner';
    RAISE NOTICE '========================================';
  ELSE
    RAISE WARNING '✗ User eran@value8.ai not found!';
    RAISE WARNING 'Please sign up first, then run this migration again.';
  END IF;
END $$;

-- ============================================
-- STEP 11: CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON public.organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_super_admins_user_id ON public.super_admins(user_id);

-- ============================================
-- FINAL SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '     MIGRATION COMPLETED SUCCESSFULLY';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables Ready:';
  RAISE NOTICE '  ✓ organizations';
  RAISE NOTICE '  ✓ organization_members';
  RAISE NOTICE '  ✓ super_admins';
  RAISE NOTICE '';
  RAISE NOTICE 'RLS Policies: ENABLED';
  RAISE NOTICE 'Helper Functions: CREATED';
  RAISE NOTICE 'Indexes: OPTIMIZED';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '1. Refresh your browser';
  RAISE NOTICE '2. Organization "Value8" should appear in header';
  RAISE NOTICE '3. Super admin panel should be visible';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;