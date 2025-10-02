-- ============================================
-- VERIFICATION QUERIES FOR ORGANIZATION SETUP
-- ============================================
-- Run these in Supabase SQL Editor to check current state
-- ============================================

-- 1. Check if super admin exists
SELECT
  sa.id,
  sa.user_id,
  u.email,
  sa.created_at
FROM public.super_admins sa
JOIN auth.users u ON u.id = sa.user_id;

-- 2. Check organizations
SELECT
  id,
  name,
  slug,
  owner_id,
  subscription_tier,
  subscription_status,
  subscription_plan,
  created_at
FROM public.organizations;

-- 3. Check organization members
SELECT
  om.id,
  om.organization_id,
  om.user_id,
  om.role,
  om.is_active,
  o.name as org_name,
  u.email as user_email
FROM public.organization_members om
JOIN public.organizations o ON o.id = om.organization_id
JOIN auth.users u ON u.id = om.user_id;

-- 4. Combined view for eran@value8.ai
SELECT
  u.email,
  u.id as user_id,
  o.name as organization,
  o.id as org_id,
  om.role,
  om.is_active,
  CASE WHEN sa.id IS NOT NULL THEN 'YES' ELSE 'NO' END as is_super_admin
FROM auth.users u
LEFT JOIN public.organization_members om ON om.user_id = u.id
LEFT JOIN public.organizations o ON o.id = om.organization_id
LEFT JOIN public.super_admins sa ON sa.user_id = u.id
WHERE u.email = 'eran@value8.ai';

-- 5. Test RLS - Check what organizations current user can see
-- (Run this while you're logged in as eran@value8.ai)
SELECT * FROM public.organizations;

-- 6. Test RLS - Check what memberships current user can see
SELECT * FROM public.organization_members;

-- 7. Test RLS - Check super admin status
SELECT * FROM public.super_admins;