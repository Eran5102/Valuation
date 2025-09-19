-- Create report templates table
CREATE TABLE IF NOT EXISTS report_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('409a', 'board_deck', 'cap_table', 'investor_update', 'custom')),
    is_system BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    owner_id TEXT,
    organization_id TEXT,
    blocks JSONB DEFAULT '[]'::jsonb,
    variables_schema JSONB DEFAULT '{}'::jsonb,
    branding JSONB DEFAULT '{
        "primaryColor": "#124E66",
        "fontFamily": "Inter",
        "headerEnabled": true,
        "footerEnabled": true
    }'::jsonb,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create report variable mappings table
CREATE TABLE IF NOT EXISTS report_variable_mappings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID NOT NULL REFERENCES report_templates(id) ON DELETE CASCADE,
    variable_path TEXT NOT NULL,
    data_source TEXT NOT NULL,
    source_field TEXT NOT NULL,
    transform JSONB,
    default_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(template_id, variable_path)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_report_templates_owner_id ON report_templates(owner_id);
CREATE INDEX IF NOT EXISTS idx_report_templates_type ON report_templates(type);
CREATE INDEX IF NOT EXISTS idx_report_templates_is_active ON report_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_report_templates_created_at ON report_templates(created_at);
CREATE INDEX IF NOT EXISTS idx_report_variable_mappings_template_id ON report_variable_mappings(template_id);

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_report_templates_updated_at
    BEFORE UPDATE ON report_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert system templates
INSERT INTO report_templates (name, description, type, is_system, is_active, owner_id, blocks, variables_schema, branding) VALUES
(
    'Standard 409A Valuation Report',
    'A comprehensive 409A valuation report template with all required sections',
    '409a',
    TRUE,
    TRUE,
    'system',
    '[
        {
            "id": "header-1",
            "type": "header",
            "content": "409A Valuation Report",
            "level": 1,
            "style": {}
        },
        {
            "id": "company-info",
            "type": "section",
            "title": "Company Information",
            "content": "Company: {{company.name}}\nState of Incorporation: {{company.state}}\nValuation Date: {{valuation.date}}",
            "style": {}
        },
        {
            "id": "executive-summary",
            "type": "section",
            "title": "Executive Summary",
            "content": "We have conducted a valuation of the common stock of {{company.name}} as of {{valuation.date}}. Based on our analysis, the fair market value per share is ${{valuation.fairMarketValue}}.",
            "style": {}
        },
        {
            "id": "valuation-summary",
            "type": "keyValue",
            "items": [
                {
                    "label": "Fair Market Value per Share",
                    "value": "${{valuation.fairMarketValue}}"
                },
                {
                    "label": "Total Equity Value",
                    "value": "${{valuation.totalEquityValue}}"
                },
                {
                    "label": "Total Shares Outstanding",
                    "value": "{{valuation.totalShares}}"
                }
            ],
            "style": {}
        }
    ]'::jsonb,
    '{
        "company": {
            "name": {"type": "string", "description": "Company name"},
            "state": {"type": "string", "description": "State of incorporation"},
            "description": {"type": "string", "description": "Company description"}
        },
        "valuation": {
            "date": {"type": "date", "description": "Valuation date"},
            "fairMarketValue": {"type": "currency", "description": "Fair market value per share"},
            "totalEquityValue": {"type": "currency", "description": "Total equity value"},
            "totalShares": {"type": "number", "description": "Total shares outstanding"},
            "method": {"type": "string", "description": "Valuation method used"}
        },
        "assumptions": {
            "discountRate": {"type": "percentage", "description": "Discount rate applied"},
            "termYears": {"type": "number", "description": "Term in years"},
            "volatility": {"type": "percentage", "description": "Volatility assumption"}
        }
    }'::jsonb,
    '{
        "primaryColor": "#124E66",
        "fontFamily": "Inter",
        "headerEnabled": true,
        "footerEnabled": true
    }'::jsonb
) ON CONFLICT DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_variable_mappings ENABLE ROW LEVEL SECURITY;

-- Create policies for report_templates
CREATE POLICY "Users can view their own templates and system templates" ON report_templates
    FOR SELECT USING (owner_id = current_setting('request.jwt.claim.sub', true) OR is_system = TRUE);

CREATE POLICY "Users can insert their own templates" ON report_templates
    FOR INSERT WITH CHECK (owner_id = current_setting('request.jwt.claim.sub', true));

CREATE POLICY "Users can update their own templates" ON report_templates
    FOR UPDATE USING (owner_id = current_setting('request.jwt.claim.sub', true) AND is_system = FALSE);

CREATE POLICY "Users can delete their own templates" ON report_templates
    FOR DELETE USING (owner_id = current_setting('request.jwt.claim.sub', true) AND is_system = FALSE);

-- Create policies for report_variable_mappings
CREATE POLICY "Users can view variable mappings for accessible templates" ON report_variable_mappings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM report_templates rt
            WHERE rt.id = template_id
            AND (rt.owner_id = current_setting('request.jwt.claim.sub', true) OR rt.is_system = TRUE)
        )
    );

CREATE POLICY "Users can insert variable mappings for their templates" ON report_variable_mappings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM report_templates rt
            WHERE rt.id = template_id
            AND rt.owner_id = current_setting('request.jwt.claim.sub', true)
        )
    );

CREATE POLICY "Users can update variable mappings for their templates" ON report_variable_mappings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM report_templates rt
            WHERE rt.id = template_id
            AND rt.owner_id = current_setting('request.jwt.claim.sub', true)
        )
    );

CREATE POLICY "Users can delete variable mappings for their templates" ON report_variable_mappings
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM report_templates rt
            WHERE rt.id = template_id
            AND rt.owner_id = current_setting('request.jwt.claim.sub', true)
        )
    );