-- Create peer_companies table for storing comparable company data
CREATE TABLE IF NOT EXISTS peer_companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    valuation_id UUID REFERENCES valuations(id) ON DELETE CASCADE,
    ticker TEXT NOT NULL,
    name TEXT NOT NULL,
    industry TEXT,
    sector TEXT,
    market_cap DECIMAL,
    enterprise_value DECIMAL,
    revenue DECIMAL,
    ebitda DECIMAL,
    revenue_growth DECIMAL,
    gross_margin DECIMAL,
    ebitda_margin DECIMAL,
    ev_to_revenue DECIMAL,
    ev_to_ebitda DECIMAL,
    pe_ratio DECIMAL,
    price_to_book DECIMAL,
    debt_to_equity DECIMAL,
    beta DECIMAL,
    source TEXT DEFAULT 'manual', -- 'manual', 'alpha_vantage', 'yahoo', etc.
    source_updated_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_peer_companies_organization_id ON peer_companies(organization_id);
CREATE INDEX IF NOT EXISTS idx_peer_companies_valuation_id ON peer_companies(valuation_id);
CREATE INDEX IF NOT EXISTS idx_peer_companies_ticker ON peer_companies(ticker);
CREATE INDEX IF NOT EXISTS idx_peer_companies_sector ON peer_companies(sector);
CREATE INDEX IF NOT EXISTS idx_peer_companies_is_active ON peer_companies(is_active);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_peer_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_peer_companies_updated_at
    BEFORE UPDATE ON peer_companies
    FOR EACH ROW
    EXECUTE FUNCTION update_peer_companies_updated_at();

-- Enable RLS
ALTER TABLE peer_companies ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for peer_companies
CREATE POLICY "Users can view peer companies in their organization"
ON peer_companies FOR SELECT
USING (
    organization_id IN (
        SELECT id FROM get_user_organizations()
    )
);

CREATE POLICY "Users can create peer companies in their organization"
ON peer_companies FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT id FROM get_user_organizations()
    )
);

CREATE POLICY "Users can update peer companies in their organization"
ON peer_companies FOR UPDATE
USING (
    organization_id IN (
        SELECT id FROM get_user_organizations()
    )
);

CREATE POLICY "Users can delete peer companies in their organization"
ON peer_companies FOR DELETE
USING (
    organization_id IN (
        SELECT id FROM get_user_organizations()
    )
);

-- Grant permissions
GRANT ALL ON peer_companies TO authenticated;
GRANT ALL ON peer_companies TO service_role;