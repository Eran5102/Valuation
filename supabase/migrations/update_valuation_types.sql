-- First, ensure the valuation_type column exists
-- Add it if it doesn't exist
ALTER TABLE public.valuations
ADD COLUMN IF NOT EXISTS valuation_type TEXT;

-- Update any existing valuations with old valuation types to use the new standardized options
-- This ensures consistency across the application

-- Update any legacy valuation types to map to the new options
UPDATE public.valuations
SET valuation_type = '409A'
WHERE valuation_type IN ('pre_money', 'Pre Money', 'Pre-Money', 'post_money', 'Post Money', 'Post-Money', '409a', '409A Valuation');

UPDATE public.valuations
SET valuation_type = 'Company Valuation'
WHERE valuation_type IN ('fairness_opinion', 'Fairness Opinion');

-- The types '409A', 'Company Valuation', and 'Other' remain unchanged

-- Add a check constraint to ensure only valid valuation types are used
-- First drop existing constraint if it exists
ALTER TABLE public.valuations
DROP CONSTRAINT IF EXISTS valuations_valuation_type_check;

-- Add new constraint for the three valid types
ALTER TABLE public.valuations
ADD CONSTRAINT valuations_valuation_type_check
CHECK (valuation_type IN ('409A', 'Company Valuation', 'Other') OR valuation_type IS NULL);

-- Add comment to document the valid values
COMMENT ON COLUMN public.valuations.valuation_type IS 'Type of valuation: 409A, Company Valuation, or Other';