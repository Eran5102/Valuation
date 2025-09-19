-- =============================================
-- REPORT SYSTEM SCHEMA
-- =============================================

-- 1. Saved Table Views (for DataTable configurations)
-- =============================================
CREATE TABLE IF NOT EXISTS saved_table_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  table_id TEXT NOT NULL, -- e.g., 'cap-table', 'waterfall', 'option-pool'
  config JSONB NOT NULL, -- Complete TableView configuration from DataTable
  data_source TEXT, -- 'valuations', 'assumptions', 'breakpoints', 'shareholders'
  valuation_id INTEGER, -- Optional: specific to a valuation
  is_global BOOLEAN DEFAULT false, -- Available across all valuations
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Unique constraint for default views per table_id
  CONSTRAINT unique_default_per_table UNIQUE NULLS NOT DISTINCT (table_id, is_default)
    WHERE is_default = true
);

-- 2. Report Templates
-- =============================================
CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('409a', 'board_deck', 'cap_table', 'investor_update', 'custom')),
  is_system BOOLEAN DEFAULT false, -- System templates can't be edited
  is_active BOOLEAN DEFAULT true,
  owner_id UUID REFERENCES auth.users(id),
  organization_id UUID, -- For future multi-tenant

  -- Template content as block-based structure
  blocks JSONB NOT NULL DEFAULT '[]',

  -- Variables schema - defines expected variables
  variables_schema JSONB DEFAULT '{}',

  -- Branding settings
  branding JSONB DEFAULT '{
    "logo": null,
    "primaryColor": "#2563eb",
    "fontFamily": "Inter",
    "headerEnabled": true,
    "footerEnabled": true
  }',

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  version INTEGER DEFAULT 1
);

-- 3. Template Blocks Library (reusable blocks)
-- =============================================
CREATE TABLE IF NOT EXISTS template_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT CHECK (category IN ('text', 'table', 'chart', 'section', 'layout')),
  type TEXT NOT NULL, -- 'executive_summary', 'valuation_methodology', 'cap_table', etc.
  content JSONB NOT NULL,
  is_system BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Generated Reports (instances)
-- =============================================
CREATE TABLE IF NOT EXISTS generated_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES report_templates(id),
  valuation_id INTEGER NOT NULL,

  -- Final rendered data
  rendered_html TEXT,
  rendered_data JSONB, -- Processed variables and data

  -- File storage
  pdf_url TEXT,
  word_url TEXT,

  -- Metadata
  generated_by UUID REFERENCES auth.users(id),
  generated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP, -- For temporary reports

  -- Status tracking
  status TEXT CHECK (status IN ('generating', 'completed', 'failed', 'expired')),
  error_message TEXT
);

-- 5. Report Variables Mapping
-- =============================================
CREATE TABLE IF NOT EXISTS report_variable_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES report_templates(id),
  variable_path TEXT NOT NULL, -- e.g., 'company.name', 'valuation.fairMarketValue'
  data_source TEXT NOT NULL, -- 'valuation', 'assumptions', 'computed'
  source_field TEXT, -- Actual database field
  transform TEXT, -- Optional: 'currency', 'date', 'percentage'
  default_value TEXT,

  UNIQUE(template_id, variable_path)
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_saved_views_table_id ON saved_table_views(table_id);
CREATE INDEX idx_saved_views_valuation ON saved_table_views(valuation_id);
CREATE INDEX idx_saved_views_created_by ON saved_table_views(created_by);

CREATE INDEX idx_templates_type ON report_templates(type);
CREATE INDEX idx_templates_owner ON report_templates(owner_id);
CREATE INDEX idx_templates_active ON report_templates(is_active);

CREATE INDEX idx_generated_valuation ON generated_reports(valuation_id);
CREATE INDEX idx_generated_template ON generated_reports(template_id);
CREATE INDEX idx_generated_status ON generated_reports(status);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Saved Table Views
ALTER TABLE saved_table_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own and global views" ON saved_table_views
  FOR SELECT USING (
    auth.uid() = created_by OR
    is_global = true
  );

CREATE POLICY "Users can create views" ON saved_table_views
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own views" ON saved_table_views
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own views" ON saved_table_views
  FOR DELETE USING (auth.uid() = created_by);

-- Report Templates
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view templates" ON report_templates
  FOR SELECT USING (
    auth.uid() = owner_id OR
    is_system = true OR
    is_active = true
  );

CREATE POLICY "Users can create templates" ON report_templates
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own templates" ON report_templates
  FOR UPDATE USING (auth.uid() = owner_id AND is_system = false);

CREATE POLICY "Users can delete their own templates" ON report_templates
  FOR DELETE USING (auth.uid() = owner_id AND is_system = false);

-- Generated Reports
ALTER TABLE generated_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reports" ON generated_reports
  FOR SELECT USING (auth.uid() = generated_by);

CREATE POLICY "Users can create reports" ON generated_reports
  FOR INSERT WITH CHECK (auth.uid() = generated_by);

-- =============================================
-- DEFAULT SYSTEM TEMPLATES
-- =============================================

-- Insert default 409A template
INSERT INTO report_templates (name, description, type, is_system, blocks, variables_schema)
VALUES (
  '409A Valuation Report - Standard',
  'Standard 409A valuation report template with all required sections',
  '409a',
  true,
  '[
    {
      "type": "header",
      "content": "409A VALUATION REPORT",
      "style": {"fontSize": "24pt", "textAlign": "center", "fontWeight": "bold"}
    },
    {
      "type": "text",
      "content": "{{company.name}}",
      "style": {"fontSize": "18pt", "textAlign": "center"}
    },
    {
      "type": "text",
      "content": "Valuation Date: {{valuation.date | date}}",
      "style": {"textAlign": "center"}
    },
    {
      "type": "pageBreak"
    },
    {
      "type": "section",
      "title": "EXECUTIVE SUMMARY",
      "content": "This 409A valuation report provides an independent assessment of the fair market value of the common stock of {{company.name}} (the \"Company\") as of {{valuation.date}}."
    },
    {
      "type": "keyValue",
      "items": [
        {"label": "Fair Market Value per Share", "value": "{{valuation.fairMarketValue | currency}}"},
        {"label": "Total Equity Value", "value": "{{valuation.totalEquityValue | currency}}"},
        {"label": "Total Shares Outstanding", "value": "{{valuation.totalShares | number}}"}
      ]
    },
    {
      "type": "table",
      "viewId": "cap-table-summary",
      "title": "Capitalization Summary"
    },
    {
      "type": "section",
      "title": "VALUATION METHODOLOGY",
      "content": "{{#if assumptions.primary_method}}The valuation was conducted using the {{assumptions.primary_method}} approach.{{/if}}"
    },
    {
      "type": "table",
      "viewId": "waterfall-analysis",
      "title": "Equity Waterfall Analysis"
    }
  ]',
  '{
    "company": {
      "name": {"type": "string", "required": true},
      "state": {"type": "string", "required": true}
    },
    "valuation": {
      "date": {"type": "date", "required": true},
      "fairMarketValue": {"type": "number", "required": true},
      "totalEquityValue": {"type": "number", "required": true},
      "totalShares": {"type": "number", "required": true}
    }
  }'
);