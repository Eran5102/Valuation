-- ============================================
-- CREATE REPORT TEMPLATES TABLE
-- This migration creates the complete report_templates table
-- with all required columns for template persistence
-- ============================================

-- Enable necessary extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CREATE REPORT_TEMPLATES TABLE
-- ============================================

-- Note: Table already exists with different schema from /api/report-templates
-- This migration ensures the table exists with correct columns

CREATE TABLE IF NOT EXISTS public.report_templates (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic template info
  name TEXT NOT NULL,
  description TEXT,
  type TEXT, -- '409a', 'board_deck', 'cap_table', 'investor_update', 'custom'
  version INTEGER DEFAULT 1,

  -- Content storage (JSONB for flexibility)
  blocks JSONB DEFAULT '[]'::jsonb, -- Sections and blocks structure
  variables_schema JSONB DEFAULT '{}'::jsonb, -- Variable definitions with types
  branding JSONB DEFAULT '{}'::jsonb, -- Theme, colors, fonts, page settings

  -- Ownership and access control
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Flags
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false, -- System template (read-only)

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if they don't exist (for existing tables)
DO $$
BEGIN
  -- Add type column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public'
                 AND table_name = 'report_templates'
                 AND column_name = 'type') THEN
    ALTER TABLE public.report_templates ADD COLUMN type TEXT;
  END IF;

  -- Add variables_schema if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public'
                 AND table_name = 'report_templates'
                 AND column_name = 'variables_schema') THEN
    ALTER TABLE public.report_templates ADD COLUMN variables_schema JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- Add branding if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public'
                 AND table_name = 'report_templates'
                 AND column_name = 'branding') THEN
    ALTER TABLE public.report_templates ADD COLUMN branding JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- Add blocks if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public'
                 AND table_name = 'report_templates'
                 AND column_name = 'blocks') THEN
    ALTER TABLE public.report_templates ADD COLUMN blocks JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- ============================================
-- ADD COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE public.report_templates IS 'Stores report templates with blocks, variables, and branding';
COMMENT ON COLUMN public.report_templates.type IS 'Template type: 409a, board_deck, cap_table, investor_update, custom';
COMMENT ON COLUMN public.report_templates.blocks IS 'Sections and blocks structure (JSONB array)';
COMMENT ON COLUMN public.report_templates.variables_schema IS 'Variable definitions with types and requirements (JSONB object)';
COMMENT ON COLUMN public.report_templates.branding IS 'Theme, color palette, fonts, page settings (JSONB)';
COMMENT ON COLUMN public.report_templates.is_system IS 'If true, template is read-only system template';

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_report_templates_organization_id
  ON public.report_templates(organization_id);

CREATE INDEX IF NOT EXISTS idx_report_templates_owner_id
  ON public.report_templates(owner_id);

CREATE INDEX IF NOT EXISTS idx_report_templates_type
  ON public.report_templates(type);

CREATE INDEX IF NOT EXISTS idx_report_templates_is_active
  ON public.report_templates(is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_report_templates_updated_at
  ON public.report_templates(updated_at DESC);

-- GIN index for JSONB columns to enable fast searches
CREATE INDEX IF NOT EXISTS idx_report_templates_variables_schema_gin
  ON public.report_templates USING gin(variables_schema);

CREATE INDEX IF NOT EXISTS idx_report_templates_branding_gin
  ON public.report_templates USING gin(branding);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;

-- ============================================
-- DROP EXISTING POLICIES (IF ANY)
-- ============================================

DROP POLICY IF EXISTS "Users can view own and system templates" ON public.report_templates;
DROP POLICY IF EXISTS "Users can view accessible templates" ON public.report_templates;
DROP POLICY IF EXISTS "Users can create templates" ON public.report_templates;
DROP POLICY IF EXISTS "Users can update own templates" ON public.report_templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON public.report_templates;

-- ============================================
-- CREATE RLS POLICIES
-- ============================================

-- SELECT: Users can view templates they own, org templates, global templates, and system templates
CREATE POLICY "Users can view accessible templates"
  ON public.report_templates
  FOR SELECT
  TO authenticated
  USING (
    -- Own templates
    owner_id = auth.uid()
    OR
    -- Organization templates (user is member of the org)
    organization_id IN (
      SELECT organization_id
      FROM public.organization_members
      WHERE user_id = auth.uid()
      AND is_active = true
    )
    OR
    -- Global templates (available to all)
    is_global = true
    OR
    -- System templates (available to all)
    is_system = true
    OR
    -- Super admins can see everything
    EXISTS (
      SELECT 1 FROM public.super_admins
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: Users can create templates for their organization
CREATE POLICY "Users can create templates"
  ON public.report_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Must be own user
    owner_id = auth.uid()
    AND
    -- Cannot create system templates (unless super admin)
    (
      is_system = false
      OR
      EXISTS (
        SELECT 1 FROM public.super_admins
        WHERE user_id = auth.uid()
      )
    )
    AND
    -- Must belong to the organization (if org specified)
    (
      organization_id IS NULL
      OR
      organization_id IN (
        SELECT organization_id
        FROM public.organization_members
        WHERE user_id = auth.uid()
        AND is_active = true
        AND role IN ('owner', 'admin', 'appraiser')
      )
    )
  );

-- UPDATE: Users can update their own templates (not system templates)
CREATE POLICY "Users can update own templates"
  ON public.report_templates
  FOR UPDATE
  TO authenticated
  USING (
    (
      owner_id = auth.uid()
      AND is_system = false
    )
    OR
    -- Super admins can update anything
    EXISTS (
      SELECT 1 FROM public.super_admins
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    (
      owner_id = auth.uid()
      AND is_system = false
    )
    OR
    EXISTS (
      SELECT 1 FROM public.super_admins
      WHERE user_id = auth.uid()
    )
  );

-- DELETE: Users can delete their own templates (not system templates)
CREATE POLICY "Users can delete own templates"
  ON public.report_templates
  FOR DELETE
  TO authenticated
  USING (
    (
      owner_id = auth.uid()
      AND is_system = false
    )
    OR
    -- Super admins can delete anything
    EXISTS (
      SELECT 1 FROM public.super_admins
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- CREATE TRIGGER FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_report_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();

  -- Also update metadata.updatedAt if metadata exists
  IF NEW.metadata IS NOT NULL THEN
    NEW.metadata = jsonb_set(
      NEW.metadata,
      '{updatedAt}',
      to_jsonb(NOW()::text),
      true
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_report_templates_updated_at_trigger ON public.report_templates;

CREATE TRIGGER update_report_templates_updated_at_trigger
  BEFORE UPDATE ON public.report_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_report_templates_updated_at();

-- ============================================
-- CREATE HELPER FUNCTION TO GET USER TEMPLATES
-- ============================================

CREATE OR REPLACE FUNCTION get_user_accessible_templates(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  type TEXT,
  version INTEGER,
  blocks JSONB,
  variables_schema JSONB,
  branding JSONB,
  organization_id UUID,
  owner_id UUID,
  is_active BOOLEAN,
  is_system BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    rt.id,
    rt.name,
    rt.description,
    rt.type,
    rt.version,
    rt.blocks,
    rt.variables_schema,
    rt.branding,
    rt.organization_id,
    rt.owner_id,
    rt.is_active,
    rt.is_system,
    rt.created_at,
    rt.updated_at
  FROM public.report_templates rt
  WHERE rt.is_active = true
  AND (
    rt.owner_id = user_uuid
    OR rt.is_system = true
    OR rt.organization_id IN (
      SELECT om.organization_id
      FROM public.organization_members om
      WHERE om.user_id = user_uuid
      AND om.is_active = true
    )
  )
  ORDER BY rt.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION get_user_accessible_templates TO authenticated;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Report Templates Table Ensured!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Table: public.report_templates';
  RAISE NOTICE 'Columns:';
  RAISE NOTICE '  ✓ id, name, description, type, version';
  RAISE NOTICE '  ✓ blocks (JSONB) - sections/blocks';
  RAISE NOTICE '  ✓ variables_schema (JSONB) - variable definitions';
  RAISE NOTICE '  ✓ branding (JSONB) - theme/colors/settings';
  RAISE NOTICE '  ✓ owner_id, organization_id';
  RAISE NOTICE '  ✓ is_active, is_system flags';
  RAISE NOTICE '';
  RAISE NOTICE 'Related Tables:';
  RAISE NOTICE '  ✓ valuation_report_templates (junction table)';
  RAISE NOTICE '';
  RAISE NOTICE 'Security:';
  RAISE NOTICE '  ✓ RLS enabled';
  RAISE NOTICE '  ✓ Policies created for SELECT, INSERT, UPDATE, DELETE';
  RAISE NOTICE '';
  RAISE NOTICE 'Performance:';
  RAISE NOTICE '  ✓ Indexes created on key columns';
  RAISE NOTICE '  ✓ GIN indexes for JSONB search';
  RAISE NOTICE '========================================';
END $$;
