-- This migration seeds initial test data for development
-- It should only run in development environments

-- Create a function to handle user signup and organization creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  org_name TEXT;
  org_id UUID;
BEGIN
  -- Create user profile
  INSERT INTO user_profiles (id, first_name, last_name, display_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      CONCAT(NEW.raw_user_meta_data->>'first_name', ' ', NEW.raw_user_meta_data->>'last_name')
    )
  );

  -- Get organization name from metadata
  org_name := NEW.raw_user_meta_data->>'organization_name';

  -- If organization name is provided, create or join organization
  IF org_name IS NOT NULL THEN
    -- Check if organization exists
    SELECT id INTO org_id FROM organizations WHERE name = org_name;

    IF org_id IS NULL THEN
      -- Create new organization
      INSERT INTO organizations (name, slug, subscription_plan)
      VALUES (
        org_name,
        LOWER(REGEXP_REPLACE(org_name, '[^a-zA-Z0-9]+', '-', 'g')),
        COALESCE(NEW.raw_user_meta_data->>'subscription_plan', 'starter')
      )
      RETURNING id INTO org_id;

      -- Add user as owner of new organization
      INSERT INTO organization_members (organization_id, user_id, role, is_active)
      VALUES (org_id, NEW.id, 'owner', true);
    ELSE
      -- Add user as member of existing organization
      INSERT INTO organization_members (organization_id, user_id, role, is_active)
      VALUES (org_id, NEW.id, 'member', true)
      ON CONFLICT (organization_id, user_id) DO NOTHING;
    END IF;
  ELSE
    -- Create a default organization for the user
    INSERT INTO organizations (name, slug, subscription_plan)
    VALUES (
      CONCAT(NEW.raw_user_meta_data->>'first_name', '''s Organization'),
      CONCAT(LOWER(NEW.raw_user_meta_data->>'first_name'), '-org-', NEW.id::TEXT),
      'starter'
    )
    RETURNING id INTO org_id;

    -- Add user as owner
    INSERT INTO organization_members (organization_id, user_id, role, is_active)
    VALUES (org_id, NEW.id, 'owner', true);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update existing companies and valuations to have organization_id if missing
-- This ensures backward compatibility with existing data
UPDATE companies
SET organization_id = (
  SELECT id FROM organizations
  ORDER BY created_at ASC
  LIMIT 1
)
WHERE organization_id IS NULL;

UPDATE valuations
SET organization_id = (
  SELECT id FROM organizations
  ORDER BY created_at ASC
  LIMIT 1
)
WHERE organization_id IS NULL;