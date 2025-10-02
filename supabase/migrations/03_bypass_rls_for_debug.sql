-- ============================================
-- BYPASS RLS COMPLETELY FOR DEBUGGING
-- ============================================
-- This will disable RLS entirely so we can see what data exists
-- ============================================

-- Disable RLS on all tables
ALTER TABLE public.super_admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;

-- Show what data exists
DO $$
DECLARE
  v_super_admin_count INTEGER;
  v_org_count INTEGER;
  v_member_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_super_admin_count FROM public.super_admins;
  SELECT COUNT(*) INTO v_org_count FROM public.organizations;
  SELECT COUNT(*) INTO v_member_count FROM public.organization_members;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  RLS DISABLED - DATA SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Super Admins: %', v_super_admin_count;
  RAISE NOTICE 'Organizations: %', v_org_count;
  RAISE NOTICE 'Organization Members: %', v_member_count;
  RAISE NOTICE '';
  RAISE NOTICE 'RLS has been DISABLED on all tables';
  RAISE NOTICE 'You should now be able to query all data';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

-- Display actual data
SELECT 'SUPER ADMINS:' as table_name;
SELECT sa.*, u.email
FROM public.super_admins sa
JOIN auth.users u ON u.id = sa.user_id;

SELECT 'ORGANIZATIONS:' as table_name;
SELECT * FROM public.organizations;

SELECT 'ORGANIZATION MEMBERS:' as table_name;
SELECT om.*, u.email
FROM public.organization_members om
JOIN auth.users u ON u.id = om.user_id;