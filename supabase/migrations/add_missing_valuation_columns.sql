-- Add missing columns to valuations table for 409A valuation app
-- These columns are critical for the application to function properly

-- Add JSONB columns for complex nested data
ALTER TABLE valuations
ADD COLUMN IF NOT EXISTS assumptions JSONB,
ADD COLUMN IF NOT EXISTS cap_table JSONB,
ADD COLUMN IF NOT EXISTS purpose TEXT,
ADD COLUMN IF NOT EXISTS report_date DATE,
ADD COLUMN IF NOT EXISTS client_name TEXT;

-- Add comments to document the purpose of each column
COMMENT ON COLUMN valuations.assumptions IS 'Financial assumptions for valuation calculations including discount rates, volatility, etc.';
COMMENT ON COLUMN valuations.cap_table IS 'Complete cap table data including share classes, options, warrants, and other equity instruments';
COMMENT ON COLUMN valuations.purpose IS 'Purpose of the valuation (e.g., 409A, M&A, fundraising, estate planning)';
COMMENT ON COLUMN valuations.report_date IS 'Date when the valuation report was generated';
COMMENT ON COLUMN valuations.client_name IS 'Name of the client company (denormalized for convenience)';

-- Also add missing columns to companies table if needed
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS contact_name TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add comments for companies columns
COMMENT ON COLUMN companies.contact_name IS 'Primary contact person for the company';
COMMENT ON COLUMN companies.contact_email IS 'Primary contact email address';
COMMENT ON COLUMN companies.contact_phone IS 'Primary contact phone number';
COMMENT ON COLUMN companies.status IS 'Company status: active, inactive, or prospect';
COMMENT ON COLUMN companies.website IS 'Company website URL';
COMMENT ON COLUMN companies.description IS 'Description or notes about the company';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_valuations_company_id ON valuations(company_id);
CREATE INDEX IF NOT EXISTS idx_valuations_status ON valuations(status);
CREATE INDEX IF NOT EXISTS idx_valuations_valuation_date ON valuations(valuation_date);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);

-- Create GIN indexes for JSONB columns for efficient querying
CREATE INDEX IF NOT EXISTS idx_valuations_assumptions_gin ON valuations USING gin (assumptions);
CREATE INDEX IF NOT EXISTS idx_valuations_cap_table_gin ON valuations USING gin (cap_table);