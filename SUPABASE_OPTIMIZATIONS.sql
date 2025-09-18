-- ============================================================================
-- SUPABASE RLS POLICIES AND TRIGGERS OPTIMIZATION
-- 409A Valuation Application Database Optimization
-- ============================================================================

-- Enable Row Level Security on all tables
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_variable_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_table_views ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- OPTIMIZED RLS POLICIES
-- ============================================================================

-- Report Templates RLS Policies
-- Allow users to see their own templates and system templates
CREATE POLICY "Users can view own and system templates" ON report_templates
  FOR SELECT USING (
    owner_id = auth.uid()
    OR is_system = true
    OR organization_id = (
      SELECT organization_id FROM user_profiles
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Allow users to create templates
CREATE POLICY "Users can create templates" ON report_templates
  FOR INSERT WITH CHECK (
    owner_id = auth.uid()
    AND is_system = false
  );

-- Allow users to update their own templates (not system templates)
CREATE POLICY "Users can update own templates" ON report_templates
  FOR UPDATE USING (
    owner_id = auth.uid()
    AND is_system = false
  ) WITH CHECK (
    owner_id = auth.uid()
    AND is_system = false
  );

-- Allow users to delete their own templates (not system templates)
CREATE POLICY "Users can delete own templates" ON report_templates
  FOR DELETE USING (
    owner_id = auth.uid()
    AND is_system = false
  );

-- Variable Mappings RLS Policies
-- Users can access mappings for templates they can access
CREATE POLICY "Users can view accessible template mappings" ON report_variable_mappings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM report_templates rt
      WHERE rt.id = template_id
      AND (
        rt.owner_id = auth.uid()
        OR rt.is_system = true
        OR rt.organization_id = (
          SELECT organization_id FROM user_profiles
          WHERE user_id = auth.uid() AND is_admin = true
        )
      )
    )
  );

-- Users can create mappings for their templates
CREATE POLICY "Users can create template mappings" ON report_variable_mappings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM report_templates rt
      WHERE rt.id = template_id
      AND rt.owner_id = auth.uid()
      AND rt.is_system = false
    )
  );

-- Users can update mappings for their templates
CREATE POLICY "Users can update own template mappings" ON report_variable_mappings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM report_templates rt
      WHERE rt.id = template_id
      AND rt.owner_id = auth.uid()
      AND rt.is_system = false
    )
  );

-- Users can delete mappings for their templates
CREATE POLICY "Users can delete own template mappings" ON report_variable_mappings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM report_templates rt
      WHERE rt.id = template_id
      AND rt.owner_id = auth.uid()
      AND rt.is_system = false
    )
  );

-- Saved Table Views RLS Policies
-- Users can see their own views and global views
CREATE POLICY "Users can view own and global table views" ON saved_table_views
  FOR SELECT USING (
    created_by = auth.uid()
    OR is_global = true
  );

-- Users can create their own views
CREATE POLICY "Users can create table views" ON saved_table_views
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
  );

-- Users can update their own views
CREATE POLICY "Users can update own table views" ON saved_table_views
  FOR UPDATE USING (
    created_by = auth.uid()
  ) WITH CHECK (
    created_by = auth.uid()
  );

-- Users can delete their own views
CREATE POLICY "Users can delete own table views" ON saved_table_views
  FOR DELETE USING (
    created_by = auth.uid()
  );

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

-- Report Templates Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_report_templates_owner_active
  ON report_templates (owner_id, is_active)
  WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_report_templates_system_type
  ON report_templates (is_system, type)
  WHERE is_system = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_report_templates_org_active
  ON report_templates (organization_id, is_active)
  WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_report_templates_created_at
  ON report_templates (created_at DESC);

-- Variable Mappings Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_variable_mappings_template
  ON report_variable_mappings (template_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_variable_mappings_path
  ON report_variable_mappings (variable_path);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_variable_mappings_template_path
  ON report_variable_mappings (template_id, variable_path);

-- Saved Table Views Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saved_views_user_table
  ON saved_table_views (created_by, table_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saved_views_table_global
  ON saved_table_views (table_id, is_global)
  WHERE is_global = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saved_views_table_default
  ON saved_table_views (table_id, is_default)
  WHERE is_default = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saved_views_valuation
  ON saved_table_views (valuation_id)
  WHERE valuation_id IS NOT NULL;

-- ============================================================================
-- DATABASE FUNCTIONS FOR OPTIMIZATION
-- ============================================================================

-- Function to check if user can access template
CREATE OR REPLACE FUNCTION can_access_template(template_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM report_templates
    WHERE id = template_uuid
    AND (
      owner_id = user_uuid
      OR is_system = true
      OR organization_id = (
        SELECT organization_id FROM user_profiles
        WHERE user_id = user_uuid AND is_admin = true
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to get user's accessible templates with caching
CREATE OR REPLACE FUNCTION get_user_templates(
  user_uuid UUID,
  template_type TEXT DEFAULT NULL,
  include_system BOOLEAN DEFAULT true
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  type TEXT,
  is_system BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    rt.id,
    rt.name,
    rt.description,
    rt.type,
    rt.is_system,
    rt.created_at
  FROM report_templates rt
  WHERE rt.is_active = true
  AND (
    rt.owner_id = user_uuid
    OR (include_system = true AND rt.is_system = true)
    OR rt.organization_id = (
      SELECT organization_id FROM user_profiles
      WHERE user_id = user_uuid AND is_admin = true
    )
  )
  AND (template_type IS NULL OR rt.type = template_type)
  ORDER BY rt.is_system DESC, rt.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- PERFORMANCE TRIGGERS
-- ============================================================================

-- Update template version on changes
CREATE OR REPLACE FUNCTION update_template_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_template_version
  BEFORE UPDATE ON report_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_template_version();

-- Ensure only one default view per table per user
CREATE OR REPLACE FUNCTION ensure_single_default_view()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE saved_table_views
    SET is_default = false
    WHERE table_id = NEW.table_id
    AND created_by = NEW.created_by
    AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_default_view
  BEFORE INSERT OR UPDATE ON saved_table_views
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_view();

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_templates_timestamp
  BEFORE UPDATE ON report_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_views_timestamp
  BEFORE UPDATE ON saved_table_views
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MATERIALIZED VIEWS FOR PERFORMANCE
-- ============================================================================

-- Materialized view for template statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS template_stats AS
SELECT
  rt.owner_id,
  rt.type,
  rt.organization_id,
  COUNT(*) as template_count,
  COUNT(CASE WHEN rt.is_system THEN 1 END) as system_templates,
  COUNT(CASE WHEN NOT rt.is_system THEN 1 END) as user_templates,
  MAX(rt.created_at) as latest_template,
  AVG(CASE WHEN rt.is_system THEN 0 ELSE rt.version END) as avg_version
FROM report_templates rt
WHERE rt.is_active = true
GROUP BY rt.owner_id, rt.type, rt.organization_id;

-- Index on materialized view
CREATE INDEX IF NOT EXISTS idx_template_stats_owner
  ON template_stats (owner_id);
CREATE INDEX IF NOT EXISTS idx_template_stats_org
  ON template_stats (organization_id);

-- Function to refresh template stats
CREATE OR REPLACE FUNCTION refresh_template_stats()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY template_stats;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- DATABASE OPTIMIZATION SETTINGS
-- ============================================================================

-- Optimize for read-heavy workloads
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET track_activity_query_size = 2048;
ALTER SYSTEM SET pg_stat_statements.track = 'all';
ALTER SYSTEM SET pg_stat_statements.max = 10000;

-- Connection pooling optimization
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;

-- ============================================================================
-- MONITORING AND MAINTENANCE
-- ============================================================================

-- Function to analyze slow queries
CREATE OR REPLACE FUNCTION get_slow_queries(min_duration_ms INTEGER DEFAULT 1000)
RETURNS TABLE (
  query TEXT,
  calls BIGINT,
  total_time DOUBLE PRECISION,
  mean_time DOUBLE PRECISION,
  rows BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pss.query,
    pss.calls,
    pss.total_exec_time,
    pss.mean_exec_time,
    pss.rows
  FROM pg_stat_statements pss
  WHERE pss.mean_exec_time > min_duration_ms
  ORDER BY pss.mean_exec_time DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get table sizes
CREATE OR REPLACE FUNCTION get_table_sizes()
RETURNS TABLE (
  table_name TEXT,
  size_pretty TEXT,
  size_bytes BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    schemaname||'.'||tablename AS table_name,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size_pretty,
    pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SCHEDULED MAINTENANCE JOBS
-- ============================================================================

-- Create extension for cron jobs (if available)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily statistics refresh (uncomment when pg_cron is available)
-- SELECT cron.schedule('refresh-template-stats', '0 2 * * *', 'SELECT refresh_template_stats();');

-- Schedule weekly table maintenance (uncomment when pg_cron is available)
-- SELECT cron.schedule('weekly-maintenance', '0 3 * * 0', '
--   VACUUM ANALYZE report_templates;
--   VACUUM ANALYZE report_variable_mappings;
--   VACUUM ANALYZE saved_table_views;
--   REINDEX INDEX CONCURRENTLY idx_report_templates_owner_active;
-- ');

-- ============================================================================
-- GRANTS AND PERMISSIONS
-- ============================================================================

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION can_access_template(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_templates(UUID, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_template_stats() TO authenticated;

-- Grant select permissions on materialized views
GRANT SELECT ON template_stats TO authenticated;

-- Admin functions (for monitoring)
GRANT EXECUTE ON FUNCTION get_slow_queries(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION get_table_sizes() TO service_role;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON POLICY "Users can view own and system templates" ON report_templates IS
'Allows users to see templates they own, system templates, and organization templates if they are admin';

COMMENT ON FUNCTION can_access_template(UUID, UUID) IS
'Efficiently checks if a user can access a specific template based on ownership, system status, or organization admin rights';

COMMENT ON FUNCTION get_user_templates(UUID, TEXT, BOOLEAN) IS
'Returns all templates accessible to a user with optional filtering by type';

COMMENT ON MATERIALIZED VIEW template_stats IS
'Aggregated statistics about templates for performance dashboards and analytics';

-- ============================================================================
-- VALIDATION QUERIES
-- ============================================================================

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('report_templates', 'report_variable_mappings', 'saved_table_views');

-- Check policy existence
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename IN ('report_templates', 'report_variable_mappings', 'saved_table_views');

-- Verify indexes
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename IN ('report_templates', 'report_variable_mappings', 'saved_table_views')
ORDER BY tablename, indexname;