-- ============================================
-- ADD MISSING ASSIGNMENT COLUMNS
-- ============================================
-- This adds the columns needed for multi-tenant assignments

-- ============================================
-- STEP 1: ADD COLUMNS TO CLIENTS TABLE
-- ============================================

-- Add organization_id to clients
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.clients
    ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
    RAISE NOTICE '✓ Added organization_id to clients';
  ELSE
    RAISE NOTICE '  organization_id already exists in clients';
  END IF;
END $$;

-- Add assigned_to to clients
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE public.clients
    ADD COLUMN assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    RAISE NOTICE '✓ Added assigned_to to clients';
  ELSE
    RAISE NOTICE '  assigned_to already exists in clients';
  END IF;
END $$;

-- Add team_members to clients
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'team_members'
  ) THEN
    ALTER TABLE public.clients
    ADD COLUMN team_members UUID[] DEFAULT ARRAY[]::UUID[];
    RAISE NOTICE '✓ Added team_members to clients';
  ELSE
    RAISE NOTICE '  team_members already exists in clients';
  END IF;
END $$;

-- ============================================
-- STEP 2: ADD MISSING COLUMN TO VALUATIONS TABLE
-- ============================================

-- Add assigned_to to valuations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'valuations' AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE public.valuations
    ADD COLUMN assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    RAISE NOTICE '✓ Added assigned_to to valuations';
  ELSE
    RAISE NOTICE '  assigned_to already exists in valuations';
  END IF;
END $$;

-- ============================================
-- STEP 3: CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_clients_organization_id ON public.clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_assigned_to ON public.clients(assigned_to);
CREATE INDEX IF NOT EXISTS idx_valuations_assigned_to ON public.valuations(assigned_to);

-- ============================================
-- STEP 4: UPDATE EXISTING DATA
-- ============================================

-- Set organization_id for existing clients based on their user's organization
UPDATE public.clients c
SET organization_id = (
  SELECT om.organization_id
  FROM public.organization_members om
  WHERE om.user_id = c.created_by
  AND om.is_active = true
  LIMIT 1
)
WHERE c.organization_id IS NULL
  AND c.created_by IS NOT NULL;

-- Set organization_id for valuations that don't have it
UPDATE public.valuations v
SET organization_id = (
  SELECT c.organization_id
  FROM public.clients c
  WHERE c.id = v.client_id
  LIMIT 1
)
WHERE v.organization_id IS NULL
  AND v.client_id IS NOT NULL;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
DECLARE
  v_clients_with_org INTEGER;
  v_clients_without_org INTEGER;
  v_valuations_with_org INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_clients_with_org FROM public.clients WHERE organization_id IS NOT NULL;
  SELECT COUNT(*) INTO v_clients_without_org FROM public.clients WHERE organization_id IS NULL;
  SELECT COUNT(*) INTO v_valuations_with_org FROM public.valuations WHERE organization_id IS NOT NULL;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  ASSIGNMENT COLUMNS ADDED';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Clients table:';
  RAISE NOTICE '  ✓ organization_id';
  RAISE NOTICE '  ✓ assigned_to';
  RAISE NOTICE '  ✓ team_members';
  RAISE NOTICE '';
  RAISE NOTICE 'Valuations table:';
  RAISE NOTICE '  ✓ assigned_to';
  RAISE NOTICE '';
  RAISE NOTICE 'Data status:';
  RAISE NOTICE '  Clients with organization: %', v_clients_with_org;
  RAISE NOTICE '  Clients without organization: %', v_clients_without_org;
  RAISE NOTICE '  Valuations with organization: %', v_valuations_with_org;
  RAISE NOTICE '';
  RAISE NOTICE 'Multi-tenant assignment system is now ready!';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;