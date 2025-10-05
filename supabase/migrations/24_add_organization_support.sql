-- Migration: Add organization support to test database
-- This adds the organization_id columns that should have been there from the start

-- Add organization_id to clients table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.clients
    ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add organization_id to valuations table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'valuations' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.valuations
    ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create Value8 organization if it doesn't exist
INSERT INTO public.organizations (id, name, slug, industry, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Value8',
  'value8',
  'Valuation Services',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Find the user eran@value8.ai and add them to the organization
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get user ID for eran@value8.ai
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'eran@value8.ai'
  LIMIT 1;

  -- Add organization membership if user exists
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.organization_members (
      organization_id,
      user_id,
      role,
      is_active,
      created_at
    )
    VALUES (
      '00000000-0000-0000-0000-000000000001'::uuid,
      v_user_id,
      'admin',
      true,
      NOW()
    )
    ON CONFLICT (organization_id, user_id) DO NOTHING;
  END IF;
END $$;

-- Update existing clients to belong to Value8 organization
UPDATE public.clients
SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE organization_id IS NULL;

-- Update existing valuations to belong to Value8 organization
UPDATE public.valuations
SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE organization_id IS NULL;
