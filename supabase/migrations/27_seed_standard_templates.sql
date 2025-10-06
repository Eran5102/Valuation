-- Migration: Seed Standard Templates
-- This migration inserts the standard 409A templates into the database
-- These templates were previously hard-coded in the application
-- Now they are stored in the database and can be edited like any other template

-- Note: Using deterministic UUIDs for consistency
-- The actual template content (blocks, variables) is minimal here
-- The full templates should be populated through the UI

-- Insert Standard 409A Template
INSERT INTO public.report_templates (
  id,
  name,
  description,
  type,
  version,
  blocks,
  variables_schema,
  branding,
  is_active,
  is_system,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Standard 409A Valuation Report',
  'Comprehensive 409A valuation report template with all required sections',
  '409a',
  1,
  '[]'::jsonb,
  '{}'::jsonb,
  '{
    "paperSize": "letter",
    "orientation": "portrait",
    "margins": {
      "top": "1in",
      "right": "1in",
      "bottom": "1in",
      "left": "1in"
    },
    "watermark": {
      "enabled": false,
      "text": "DRAFT",
      "opacity": 0.1
    }
  }'::jsonb,
  true,
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = true,
  updated_at = NOW();

-- Insert Value8 Comprehensive 409A Template
INSERT INTO public.report_templates (
  id,
  name,
  description,
  type,
  version,
  blocks,
  variables_schema,
  branding,
  is_active,
  is_system,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000002'::uuid,
  'Standard 409A Valuation Report (Value8)',
  'Comprehensive 409A valuation report template based on Value8 methodology',
  '409a',
  1,
  '[]'::jsonb,
  '{}'::jsonb,
  '{
    "paperSize": "letter",
    "orientation": "portrait",
    "margins": {
      "top": "1in",
      "right": "1in",
      "bottom": "1in",
      "left": "1in"
    },
    "watermark": {
      "enabled": false,
      "text": "DRAFT",
      "opacity": 0.1
    }
  }'::jsonb,
  true,
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = true,
  updated_at = NOW();
