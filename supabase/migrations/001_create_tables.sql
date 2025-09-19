-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  industry TEXT,
  stage TEXT,
  headquarters TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create valuations table
CREATE TABLE IF NOT EXISTS valuations (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT REFERENCES companies(id) ON DELETE CASCADE,
  client_name TEXT,
  valuation_date DATE,
  valuation_type TEXT,
  status TEXT DEFAULT 'draft',
  value DECIMAL,
  assumptions JSONB DEFAULT '{}',
  cap_table JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table_views table for storing DataTable views
CREATE TABLE IF NOT EXISTS table_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_id TEXT NOT NULL,
  user_id TEXT, -- Can be null for now, add auth later
  name TEXT NOT NULL,
  config JSONB NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indices
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_valuations_company_id ON valuations(company_id);
CREATE INDEX idx_valuations_status ON valuations(status);
CREATE INDEX idx_table_views_table_id ON table_views(table_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_valuations_updated_at BEFORE UPDATE ON valuations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_table_views_updated_at BEFORE UPDATE ON table_views
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();