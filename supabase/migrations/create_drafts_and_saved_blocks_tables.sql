-- Create report_drafts table for auto-saving report progress
CREATE TABLE IF NOT EXISTS report_drafts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    valuation_id UUID REFERENCES valuations(id) ON DELETE CASCADE,
    template_id UUID REFERENCES report_templates(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    content JSONB NOT NULL DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    is_auto_save BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create saved_template_blocks table for reusable template blocks
CREATE TABLE IF NOT EXISTS saved_template_blocks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'Uncategorized',
    block_type TEXT NOT NULL,
    block_content JSONB NOT NULL,
    block_styling JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    is_global BOOLEAN DEFAULT FALSE, -- If true, available to all orgs
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_report_drafts_organization_id ON report_drafts(organization_id);
CREATE INDEX IF NOT EXISTS idx_report_drafts_valuation_id ON report_drafts(valuation_id);
CREATE INDEX IF NOT EXISTS idx_report_drafts_template_id ON report_drafts(template_id);
CREATE INDEX IF NOT EXISTS idx_report_drafts_created_by ON report_drafts(created_by);

CREATE INDEX IF NOT EXISTS idx_saved_template_blocks_organization_id ON saved_template_blocks(organization_id);
CREATE INDEX IF NOT EXISTS idx_saved_template_blocks_category ON saved_template_blocks(category);
CREATE INDEX IF NOT EXISTS idx_saved_template_blocks_block_type ON saved_template_blocks(block_type);
CREATE INDEX IF NOT EXISTS idx_saved_template_blocks_is_global ON saved_template_blocks(is_global);

-- Create triggers to update updated_at
CREATE TRIGGER update_report_drafts_updated_at
    BEFORE UPDATE ON report_drafts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_template_blocks_updated_at
    BEFORE UPDATE ON saved_template_blocks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE report_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_template_blocks ENABLE ROW LEVEL SECURITY;

-- RLS policies for report_drafts
CREATE POLICY "Users can view drafts in their organization"
ON report_drafts FOR SELECT
USING (
    organization_id IN (
        SELECT id FROM get_user_organizations()
    )
);

CREATE POLICY "Users can create drafts in their organization"
ON report_drafts FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT id FROM get_user_organizations()
    )
);

CREATE POLICY "Users can update their own drafts"
ON report_drafts FOR UPDATE
USING (
    created_by = auth.uid() AND
    organization_id IN (
        SELECT id FROM get_user_organizations()
    )
);

CREATE POLICY "Users can delete their own drafts"
ON report_drafts FOR DELETE
USING (
    created_by = auth.uid() AND
    organization_id IN (
        SELECT id FROM get_user_organizations()
    )
);

-- RLS policies for saved_template_blocks
CREATE POLICY "Users can view blocks in their organization or global blocks"
ON saved_template_blocks FOR SELECT
USING (
    is_global = TRUE OR
    organization_id IN (
        SELECT id FROM get_user_organizations()
    )
);

CREATE POLICY "Users can create blocks in their organization"
ON saved_template_blocks FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT id FROM get_user_organizations()
    )
);

CREATE POLICY "Users can update their own blocks"
ON saved_template_blocks FOR UPDATE
USING (
    created_by = auth.uid() AND
    organization_id IN (
        SELECT id FROM get_user_organizations()
    )
);

CREATE POLICY "Users can delete their own blocks"
ON saved_template_blocks FOR DELETE
USING (
    created_by = auth.uid() AND
    organization_id IN (
        SELECT id FROM get_user_organizations()
    )
);

-- Grant permissions
GRANT ALL ON report_drafts TO authenticated;
GRANT ALL ON saved_template_blocks TO authenticated;
GRANT ALL ON report_drafts TO service_role;
GRANT ALL ON saved_template_blocks TO service_role;