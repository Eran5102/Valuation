-- Fix eran@value8.ai user setup
-- Run this in your Supabase SQL editor

DO $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
BEGIN
  -- Get user ID for eran@value8.ai
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'eran@value8.ai'
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- Make user a super admin if not already
    INSERT INTO public.super_admins (user_id, created_by)
    VALUES (v_user_id, v_user_id)
    ON CONFLICT (user_id) DO NOTHING;

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
    END IF;

    -- Add user as owner member (or update if exists)
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
    )
    ON CONFLICT (organization_id, user_id)
    DO UPDATE SET
      role = 'owner',
      is_active = true;

    RAISE NOTICE 'Setup complete for eran@value8.ai';
  ELSE
    RAISE WARNING 'User eran@value8.ai not found!';
  END IF;
END $$;
