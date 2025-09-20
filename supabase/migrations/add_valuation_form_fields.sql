-- Add missing fields from the valuation form to the valuations table
-- These fields are needed to store all data from the new valuation form

ALTER TABLE public.valuations
ADD COLUMN IF NOT EXISTS methodology TEXT,
ADD COLUMN IF NOT EXISTS purpose TEXT,
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS shares DECIMAL,
ADD COLUMN IF NOT EXISTS preferences TEXT;

-- Update existing assumptions column to be JSONB if it's not already
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'valuations'
        AND column_name = 'assumptions'
        AND data_type = 'jsonb'
    ) THEN
        ALTER TABLE public.valuations
        ALTER COLUMN assumptions TYPE JSONB USING assumptions::JSONB;
    END IF;
END $$;

-- Add comments to document the new columns
COMMENT ON COLUMN public.valuations.methodology IS 'Valuation methodology used (DCF, Market, Asset, Hybrid)';
COMMENT ON COLUMN public.valuations.purpose IS 'Purpose of the valuation (409A compliance, fundraising, M&A, etc.)';
COMMENT ON COLUMN public.valuations.title IS 'Title/name of the valuation project';
COMMENT ON COLUMN public.valuations.notes IS 'Additional notes about the valuation';
COMMENT ON COLUMN public.valuations.shares IS 'Number of outstanding shares';
COMMENT ON COLUMN public.valuations.preferences IS 'Liquidation preferences description';