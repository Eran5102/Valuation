-- Create DCF scenarios table if it doesn't exist
CREATE TABLE IF NOT EXISTS dcf_scenarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    valuation_id UUID NOT NULL REFERENCES valuations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Base', 'Optimistic', 'Pessimistic', 'Custom')),

    -- Assumptions
    assumptions JSONB NOT NULL DEFAULT '{
        "revenueGrowthRate": 0,
        "ebitdaMargin": 0,
        "taxRate": 0,
        "capexPercent": 0,
        "workingCapitalPercent": 0,
        "terminalGrowthRate": 0,
        "discountRate": 0
    }'::jsonb,

    -- Projections (optional, calculated)
    projections JSONB DEFAULT NULL,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),

    -- Constraints
    CONSTRAINT unique_scenario_name_per_valuation UNIQUE(valuation_id, name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_dcf_scenarios_valuation_id ON dcf_scenarios(valuation_id);
CREATE INDEX IF NOT EXISTS idx_dcf_scenarios_type ON dcf_scenarios(type);
CREATE INDEX IF NOT EXISTS idx_dcf_scenarios_created_at ON dcf_scenarios(created_at);

-- Enable RLS
ALTER TABLE dcf_scenarios ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view DCF scenarios for their valuations" ON dcf_scenarios
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM valuations v
            WHERE v.id = dcf_scenarios.valuation_id
            AND (
                v.assigned_appraiser = auth.uid()
                OR v.created_by = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM organization_members om
                    WHERE om.user_id = auth.uid()
                    AND om.organization_id = v.organization_id
                )
            )
        )
    );

CREATE POLICY "Users can create DCF scenarios for their valuations" ON dcf_scenarios
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM valuations v
            WHERE v.id = dcf_scenarios.valuation_id
            AND (
                v.assigned_appraiser = auth.uid()
                OR v.created_by = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update DCF scenarios for their valuations" ON dcf_scenarios
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM valuations v
            WHERE v.id = dcf_scenarios.valuation_id
            AND (
                v.assigned_appraiser = auth.uid()
                OR v.created_by = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete DCF scenarios for their valuations" ON dcf_scenarios
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM valuations v
            WHERE v.id = dcf_scenarios.valuation_id
            AND (
                v.assigned_appraiser = auth.uid()
                OR v.created_by = auth.uid()
            )
        )
    );

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_dcf_scenarios_updated_at BEFORE UPDATE ON dcf_scenarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();