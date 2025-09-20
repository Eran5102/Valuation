# Database Indexes for Performance Optimization

This document outlines the recommended database indexes for optimal query performance based on the analysis of the application's Supabase queries.

## Recommended Indexes

### saved_table_views Table

```sql
-- Index for table_id (frequently filtered)
CREATE INDEX idx_saved_table_views_table_id
ON saved_table_views(table_id);

-- Index for created_by (frequently filtered for user-specific queries)
CREATE INDEX idx_saved_table_views_created_by
ON saved_table_views(created_by);

-- Composite index for table_id + created_by + is_global (common query pattern)
CREATE INDEX idx_saved_table_views_table_user_global
ON saved_table_views(table_id, created_by, is_global);

-- Index for is_default lookups
CREATE INDEX idx_saved_table_views_table_default
ON saved_table_views(table_id, is_default);

-- Index for valuation_id (optional filter)
CREATE INDEX idx_saved_table_views_valuation_id
ON saved_table_views(valuation_id);

-- Index for created_at (sorting)
CREATE INDEX idx_saved_table_views_created_at
ON saved_table_views(created_at DESC);
```

### report_templates Table

```sql
-- Index for owner_id (frequently filtered)
CREATE INDEX idx_report_templates_owner_id
ON report_templates(owner_id);

-- Index for is_system (frequently filtered)
CREATE INDEX idx_report_templates_is_system
ON report_templates(is_system);

-- Index for is_active (always filtered)
CREATE INDEX idx_report_templates_is_active
ON report_templates(is_active);

-- Composite index for common query pattern (owner_id OR is_system) + is_active
CREATE INDEX idx_report_templates_owner_system_active
ON report_templates(owner_id, is_system, is_active);

-- Index for type (optional filter)
CREATE INDEX idx_report_templates_type
ON report_templates(type);

-- Index for created_at (sorting)
CREATE INDEX idx_report_templates_created_at
ON report_templates(created_at DESC);
```

### report_variable_mappings Table

```sql
-- Index for template_id (primary filter)
CREATE INDEX idx_report_variable_mappings_template_id
ON report_variable_mappings(template_id);

-- Composite index for unique constraint and lookups
CREATE INDEX idx_report_variable_mappings_template_path
ON report_variable_mappings(template_id, variable_path);
```

## Implementation Notes

1. **Primary Keys**: All tables should have primary key indexes (usually auto-created)

2. **Foreign Key Indexes**: Ensure foreign key columns have indexes for join performance

3. **Query Pattern Analysis**: These indexes are based on the current query patterns in:
   - `src/services/tableViewService.ts`
   - `src/services/reportTemplateService.ts`

4. **Monitoring**: After creating indexes, monitor query performance using:
   - Supabase dashboard query analytics
   - PostgreSQL `EXPLAIN ANALYZE` for specific queries

5. **Index Maintenance**: Regularly review and optimize indexes based on:
   - Query frequency changes
   - New query patterns
   - Index usage statistics

## Supabase Implementation

To implement these indexes in Supabase:

1. Go to SQL Editor in your Supabase dashboard
2. Run the CREATE INDEX statements above
3. Monitor query performance in the Analytics section
4. Use `EXPLAIN (ANALYZE, BUFFERS) SELECT ...` to verify index usage

## Performance Impact

Expected improvements:

- **Query Speed**: 50-90% faster queries on filtered/sorted columns
- **Database Load**: Reduced CPU usage for complex queries
- **Scalability**: Better performance as data volume grows
- **User Experience**: Faster page loads for data-heavy tables
