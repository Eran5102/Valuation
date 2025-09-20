-- Performance optimization indexes for 409A valuation app
-- Created: 2025-01-19
-- Purpose: Improve query performance for frequently accessed data

-- Companies table indexes
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON companies(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);

-- Valuations table indexes
CREATE INDEX IF NOT EXISTS idx_valuations_company_id ON valuations(company_id);
CREATE INDEX IF NOT EXISTS idx_valuations_status ON valuations(status);
CREATE INDEX IF NOT EXISTS idx_valuations_valuation_date ON valuations(valuation_date DESC);
CREATE INDEX IF NOT EXISTS idx_valuations_created_at ON valuations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_valuations_company_status ON valuations(company_id, status);
CREATE INDEX IF NOT EXISTS idx_valuations_company_date ON valuations(company_id, valuation_date DESC);

-- Clients table indexes
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_company_name ON clients(company_name);

-- Reports table indexes
CREATE INDEX IF NOT EXISTS idx_reports_valuation_id ON reports(valuation_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_generated_at ON reports(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_valuation_status ON reports(valuation_id, status);

-- JSONB indexes for flexible data columns
-- These use GIN (Generalized Inverted Index) for efficient querying

-- Valuations cap_table JSONB index
CREATE INDEX IF NOT EXISTS idx_valuations_cap_table_gin ON valuations USING GIN(cap_table);

-- Valuations assumptions JSONB index
CREATE INDEX IF NOT EXISTS idx_valuations_assumptions_gin ON valuations USING GIN(assumptions);

-- Valuations waterfall JSONB index
CREATE INDEX IF NOT EXISTS idx_valuations_waterfall_gin ON valuations USING GIN(waterfall);

-- Reports data JSONB index
CREATE INDEX IF NOT EXISTS idx_reports_data_gin ON reports USING GIN(data);

-- Partial indexes for common queries
-- These are more efficient for filtering specific conditions

-- Active companies only
CREATE INDEX IF NOT EXISTS idx_companies_active ON companies(name, created_at DESC)
WHERE status = 'active';

-- Completed valuations only
CREATE INDEX IF NOT EXISTS idx_valuations_completed ON valuations(company_id, valuation_date DESC)
WHERE status = 'completed';

-- Pending reports only
CREATE INDEX IF NOT EXISTS idx_reports_pending ON reports(valuation_id, generated_at DESC)
WHERE status IN ('pending', 'in_progress');

-- Full-text search indexes for searchable fields
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- Enable trigram similarity search

CREATE INDEX IF NOT EXISTS idx_companies_name_trgm ON companies USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_clients_company_name_trgm ON clients USING GIN(company_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_clients_name_trgm ON clients USING GIN(name gin_trgm_ops);

-- Analyze tables to update statistics for query planner
ANALYZE companies;
ANALYZE valuations;
ANALYZE clients;
ANALYZE reports;

-- Create a function to monitor index usage
CREATE OR REPLACE FUNCTION get_index_usage_stats()
RETURNS TABLE (
    schemaname text,
    tablename text,
    indexname text,
    idx_scan bigint,
    idx_tup_read bigint,
    idx_tup_fetch bigint,
    size text
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.schemaname::text,
        s.tablename::text,
        s.indexname::text,
        s.idx_scan,
        s.idx_tup_read,
        s.idx_tup_fetch,
        pg_size_pretty(pg_relation_size(s.indexrelid))::text as size
    FROM pg_stat_user_indexes s
    JOIN pg_index i ON s.indexrelid = i.indexrelid
    WHERE s.schemaname = 'public'
    ORDER BY s.idx_scan DESC;
END;
$$ LANGUAGE plpgsql;

-- Create a function to identify missing indexes
CREATE OR REPLACE FUNCTION suggest_missing_indexes()
RETURNS TABLE (
    tablename text,
    attname text,
    n_distinct numeric,
    correlation numeric,
    null_frac numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.relname::text AS tablename,
        a.attname::text,
        s.n_distinct,
        s.correlation,
        s.null_frac
    FROM pg_stats s
    JOIN pg_class c ON s.tablename = c.relname
    JOIN pg_attribute a ON c.oid = a.attrelid AND a.attname = s.attname
    WHERE s.schemaname = 'public'
        AND s.n_distinct > 100
        AND s.correlation < 0.1
        AND s.null_frac < 0.5
        AND NOT EXISTS (
            SELECT 1 FROM pg_index i
            WHERE i.indrelid = c.oid
            AND a.attnum = ANY(i.indkey)
        )
    ORDER BY s.n_distinct DESC;
END;
$$ LANGUAGE plpgsql;

-- Add comments to indexes for documentation
COMMENT ON INDEX idx_companies_status IS 'Frequently filtered by status in queries';
COMMENT ON INDEX idx_valuations_company_id IS 'Foreign key lookups and joins';
COMMENT ON INDEX idx_valuations_company_date IS 'Common query pattern: latest valuation per company';
COMMENT ON INDEX idx_valuations_cap_table_gin IS 'JSONB queries on cap table data';
COMMENT ON INDEX idx_companies_name_trgm IS 'Full-text search on company names';