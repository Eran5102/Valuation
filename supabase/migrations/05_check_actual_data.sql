-- Check what organizations actually exist
SELECT
  id,
  name,
  owner_id,
  subscription_tier,
  created_at
FROM public.organizations
ORDER BY created_at;

-- Check memberships
SELECT
  om.id,
  o.name as org_name,
  u.email as user_email,
  om.role,
  om.is_active
FROM public.organization_members om
JOIN public.organizations o ON o.id = om.organization_id
JOIN auth.users u ON u.id = om.user_id
ORDER BY om.created_at;

-- Check which org is set as current for your user
SELECT
  u.email,
  o.name as organization_name,
  om.role
FROM auth.users u
JOIN public.organization_members om ON om.user_id = u.id AND om.is_active = true
JOIN public.organizations o ON o.id = om.organization_id
WHERE u.email = 'eran@value8.ai';