# Comprehensive Testing Plan for Database Schema Migration

## Overview

This document outlines the testing strategy for the database schema improvements implemented on 2025-01-29.

## 1. Pre-Migration Checklist

### Database Backup

- [ ] Create full backup of production database
- [ ] Test backup restoration process
- [ ] Document current data counts for validation

### Environment Setup

- [ ] Set up staging environment with production data copy
- [ ] Verify all environment variables are configured
- [ ] Ensure Supabase CLI is installed and configured

## 2. Migration Testing

### Apply Migration

```bash
# Apply migration to staging
supabase db push --db-url postgresql://[STAGING_URL]

# Verify migration status
supabase db migrations list
```

### Data Integrity Tests

```sql
-- Verify data migration from companies to clients
SELECT COUNT(*) FROM clients;
SELECT COUNT(*) FROM companies; -- Should match via view

-- Check that all fields migrated correctly
SELECT
  c.id,
  c.name,
  c.lead_assigned,
  c.team_members,
  comp.assigned_to
FROM clients c
JOIN companies comp ON c.id = comp.id
WHERE c.lead_assigned != comp.assigned_to;

-- Verify role standardization
SELECT DISTINCT role FROM organization_members;
-- Should only return: owner, admin, appraiser, analyst, viewer

-- Check user_profiles enhancement
SELECT
  COUNT(*) as total,
  COUNT(email) as with_email,
  COUNT(phone) as with_phone
FROM user_profiles;
```

## 3. API Endpoint Testing

### Test Both Old and New Routes

```javascript
// Test suite for backward compatibility
const testEndpoints = async () => {
  // Test old companies endpoint still works
  const companiesRes = await fetch('/api/companies')
  console.assert(companiesRes.ok, 'Companies endpoint should work')

  // Test new clients endpoint
  const clientsRes = await fetch('/api/clients')
  console.assert(clientsRes.ok, 'Clients endpoint should work')

  // Verify data matches
  const companiesData = await companiesRes.json()
  const clientsData = await clientsRes.json()
  console.assert(
    companiesData.data.length === clientsData.data.length,
    'Data should match between endpoints'
  )
}
```

### CRUD Operations Test

```javascript
// Test Create
const newClient = {
  name: 'Test Client',
  industry: 'Technology',
  contact_email: 'test@example.com',
}

const createRes = await fetch('/api/clients', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(newClient),
})

// Test Read
const { id } = await createRes.json()
const getRes = await fetch(`/api/clients/${id}`)

// Test Update
const updateRes = await fetch(`/api/clients/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Updated Client' }),
})

// Test Delete
const deleteRes = await fetch(`/api/clients/${id}`, {
  method: 'DELETE',
})
```

## 4. Permission Testing

### Test Role-Based Access

```javascript
const testPermissions = async () => {
  // Test as different roles
  const roles = ['owner', 'admin', 'appraiser', 'analyst', 'viewer']

  for (const role of roles) {
    // Mock user with specific role
    const canCreate = await testCreatePermission(role)
    const canEdit = await testEditPermission(role)
    const canDelete = await testDeletePermission(role)

    console.log(`Role: ${role}`)
    console.log(`  Can Create: ${canCreate}`)
    console.log(`  Can Edit: ${canEdit}`)
    console.log(`  Can Delete: ${canDelete}`)
  }
}
```

### Test Assignment Access Levels

```javascript
const testAssignmentLevels = async (clientId) => {
  const accessLevels = {
    lead_assigned: 'user1',
    team_members: ['user2'],
    editor_members: ['user3'],
    viewer_members: ['user4'],
  }

  // Update client with different assignment levels
  await fetch(`/api/clients/${clientId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(accessLevels),
  })

  // Test access for each user
  // lead_assigned: full access
  // team_members: full access
  // editor_members: edit access only
  // viewer_members: read-only access
}
```

## 5. UI Component Testing

### Update References

- [ ] Search and replace "companies" with "clients" in UI components
- [ ] Update navigation links
- [ ] Update form labels and placeholders
- [ ] Update table headers
- [ ] Update dashboard metrics

### Component Checklist

```bash
# Find all references to companies in components
grep -r "companies\|company" src/components --include="*.tsx" --include="*.ts"

# Components to update:
# - src/components/layout/AppLayout.tsx
# - src/components/dashboard/*.tsx
# - src/components/forms/*.tsx
# - src/components/tables/*.tsx
```

## 6. Build and TypeScript Testing

### Run Build

```bash
# Clear cache and build
rm -rf .next
npm run build

# Expected output:
# ✓ Creating an optimized production build
# ✓ Compiled successfully
# ✓ Collecting page data
# ✓ Generating static pages
```

### TypeScript Check

```bash
# Run TypeScript compiler
npx tsc --noEmit

# Fix any type errors
# Common issues:
# - Update Company type references to Client
# - Update function parameters
# - Update API response types
```

## 7. Authentication Flow Testing

### Test Login Flow

1. Clear browser cache and cookies
2. Navigate to /auth/login
3. Login with test credentials
4. Verify redirect to dashboard
5. Check user name displays correctly
6. Verify organization loads

### Test Session Persistence

1. Login successfully
2. Close browser
3. Reopen and navigate to app
4. Should remain logged in
5. Verify user context loads

## 8. Database Performance Testing

### Query Performance

```sql
-- Test query performance with new indexes
EXPLAIN ANALYZE
SELECT * FROM clients
WHERE organization_id = 'uuid'
AND status = 'active'
ORDER BY created_at DESC
LIMIT 20;

-- Test join performance
EXPLAIN ANALYZE
SELECT
  c.*,
  v.count as valuation_count
FROM clients c
LEFT JOIN LATERAL (
  SELECT COUNT(*) as count
  FROM valuations
  WHERE client_id = c.id
) v ON true
WHERE c.organization_id = 'uuid';
```

### Index Verification

```sql
-- List all indexes on new tables
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('clients', 'assignment_history', 'valuation_report_templates')
ORDER BY tablename, indexname;
```

## 9. RLS Policy Testing

### Test Row Level Security

```sql
-- Test as different users
SET LOCAL "request.jwt.claim.sub" TO 'user-uuid';

-- Should only see assigned clients
SELECT * FROM clients;

-- Test insert permissions
INSERT INTO clients (name, organization_id)
VALUES ('Test Client', 'org-uuid');

-- Test update permissions
UPDATE clients SET name = 'Updated' WHERE id = 'client-uuid';

-- Test delete permissions
DELETE FROM clients WHERE id = 'client-uuid';
```

## 10. Rollback Plan

### If Issues Occur

```sql
-- Revert to previous schema
-- 1. Restore from backup
-- 2. Or run rollback migration:

-- Drop new tables
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS assignment_history CASCADE;
DROP TABLE IF EXISTS valuation_report_templates CASCADE;

-- Restore original companies table
-- (from backup)

-- Remove new columns
ALTER TABLE report_templates
  DROP COLUMN IF EXISTS organization_id,
  DROP COLUMN IF EXISTS is_global;

ALTER TABLE reports
  DROP COLUMN IF EXISTS template_id,
  DROP COLUMN IF EXISTS template_version;
```

## 11. Post-Migration Validation

### Data Validation Queries

```sql
-- Verify no data loss
SELECT
  'clients' as table_name,
  COUNT(*) as record_count
FROM clients
UNION ALL
SELECT
  'valuations' as table_name,
  COUNT(*) as record_count
FROM valuations
UNION ALL
SELECT
  'organization_members' as table_name,
  COUNT(*) as record_count
FROM organization_members;

-- Check for orphaned records
SELECT * FROM valuations
WHERE client_id NOT IN (SELECT id FROM clients);

-- Verify assignment history is tracking
SELECT * FROM assignment_history
ORDER BY assigned_at DESC
LIMIT 10;
```

### Application Health Checks

- [ ] Dashboard loads without errors
- [ ] All navigation links work
- [ ] Forms submit successfully
- [ ] Data displays correctly
- [ ] Search and filters work
- [ ] Export functions work
- [ ] Reports generate properly

## 12. Monitoring Post-Deployment

### Error Monitoring

```javascript
// Add error tracking
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error)
  // Send to monitoring service
})

// API error tracking
const apiCall = async (url, options) => {
  try {
    const res = await fetch(url, options)
    if (!res.ok) {
      console.error(`API Error: ${url} - ${res.status}`)
    }
    return res
  } catch (error) {
    console.error(`Network Error: ${url}`, error)
    throw error
  }
}
```

### Performance Monitoring

- Monitor page load times
- Track API response times
- Check database query performance
- Monitor error rates

## Testing Checklist Summary

- [ ] Database backup created
- [ ] Migration applied successfully
- [ ] Data integrity verified
- [ ] API endpoints tested (both old and new)
- [ ] Permissions working correctly
- [ ] UI components updated
- [ ] TypeScript compilation successful
- [ ] Build completes without errors
- [ ] Authentication flow works
- [ ] RLS policies enforced
- [ ] Performance acceptable
- [ ] Rollback plan ready
- [ ] Monitoring in place

## Sign-off

- [ ] Development testing complete
- [ ] Staging testing complete
- [ ] Production deployment approved
- [ ] Post-deployment validation complete

---

**Note**: This testing plan should be executed in order, starting with a staging environment before applying to production. Each section should be completed and verified before moving to the next.
