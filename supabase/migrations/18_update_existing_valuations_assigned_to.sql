-- ============================================
-- UPDATE EXISTING VALUATIONS WITH ASSIGNED_TO
-- ============================================

-- Update valuations that don't have assigned_to set
-- Try to infer from created_by or set to the organization owner
UPDATE public.valuations v
SET assigned_to = (
  SELECT om.user_id
  FROM public.organization_members om
  WHERE om.organization_id = v.organization_id
    AND om.role IN ('owner', 'admin')
  LIMIT 1
)
WHERE assigned_to IS NULL
  AND organization_id IS NOT NULL;

-- If there are still valuations without assigned_to, set to first user in system
UPDATE public.valuations
SET assigned_to = (
  SELECT id FROM auth.users ORDER BY created_at LIMIT 1
)
WHERE assigned_to IS NULL;

-- Log results
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM public.valuations
  WHERE assigned_to IS NOT NULL;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  VALUATIONS UPDATED';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '  ✓ % valuations now have assigned_to set', updated_count;
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
