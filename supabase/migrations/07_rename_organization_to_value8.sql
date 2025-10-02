-- Update the organization name from "Super Admin Organization" to "Value8"
UPDATE public.organizations
SET
  name = 'Value8',
  slug = 'value8',
  subscription_tier = 'enterprise',
  subscription_plan = 'enterprise',
  updated_at = NOW()
WHERE name = 'Super Admin Organization'
  AND owner_id = (SELECT id FROM auth.users WHERE email = 'eran@value8.ai');

-- Verify the update
SELECT
  id,
  name,
  slug,
  subscription_tier,
  subscription_plan,
  owner_id,
  updated_at
FROM public.organizations
WHERE owner_id = (SELECT id FROM auth.users WHERE email = 'eran@value8.ai');

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  ORGANIZATION RENAMED TO VALUE8';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Organization updated:';
  RAISE NOTICE '  Name: Value8';
  RAISE NOTICE '  Slug: value8';
  RAISE NOTICE '  Plan: enterprise';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Refresh your browser!';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;