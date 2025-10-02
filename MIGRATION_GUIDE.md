# Organization Setup Migration Guide

## Overview

This guide explains how to execute the consolidated migration that sets up organizations, organization members, and super admin functionality.

## Prerequisites

- You must have signed up with your account (eran@value8.ai) in the application first
- Access to Supabase SQL Editor
- The migration file: `supabase/migrations/00_complete_setup.sql`

## Migration Execution Steps

### 1. Access Supabase SQL Editor

1. Log into your Supabase project dashboard
2. Navigate to the "SQL Editor" section in the left sidebar
3. Click "New query" to open a blank SQL editor

### 2. Load the Migration SQL

1. Open the file `supabase/migrations/00_complete_setup.sql` from your project
2. Copy the entire contents of the file
3. Paste it into the Supabase SQL Editor

### 3. Execute the Migration

1. Click the "Run" button (or press Cmd/Ctrl + Enter)
2. **IMPORTANT**: You may see an error message: "Unable to find snippet with ID... This snippet doesn't exist in your project"
   - **This is a Supabase UI bug and can be safely ignored**
   - The SQL will still execute successfully
   - Just click "Run" again if needed

### 4. Verify Success

You should see success messages in the output panel indicating:

- ✓ Found user: eran@value8.ai
- ✓ Super admin status ensured
- ✓ Created/found organization: Value8
- ✓ Added user as owner member
- MIGRATION COMPLETED SUCCESSFULLY

If you see "✗ User eran@value8.ai not found!", you need to sign up first.

### 5. Verify Database State

Run these verification queries in the SQL Editor to confirm everything is set up correctly:

```sql
-- Check if super admin was created
SELECT * FROM public.super_admins;

-- Check if organization was created
SELECT * FROM public.organizations;

-- Check if membership was created
SELECT * FROM public.organization_members;

-- Check combined view
SELECT
  u.email,
  o.name as organization,
  om.role,
  sa.id as is_super_admin
FROM auth.users u
LEFT JOIN public.organization_members om ON om.user_id = u.id
LEFT JOIN public.organizations o ON o.id = om.organization_id
LEFT JOIN public.super_admins sa ON sa.user_id = u.id
WHERE u.email = 'eran@value8.ai';
```

Expected results:

- 1 row in super_admins for eran@value8.ai
- 1 organization named "Value8" owned by eran@value8.ai
- 1 membership with role "owner" for eran@value8.ai in Value8 organization

## What This Migration Does

### Tables Created/Updated

1. **organizations** - Stores organization details
   - Adds missing columns: subscription_tier, subscription_status, subscription_plan, settings

2. **organization_members** - Links users to organizations with roles
   - Roles: owner, admin, appraiser, analyst, viewer

3. **super_admins** - Tracks super admin users

### RLS Policies Created

- Super admins have full access to all tables
- Users can view/manage organizations they belong to
- Owners/admins can update their organizations
- Proper member management policies

### Initial Data Created

- Makes eran@value8.ai a super admin
- Creates "Value8" organization (enterprise tier)
- Adds eran@value8.ai as owner of Value8 organization

### Helper Functions

- `is_super_admin(user_id)` - Check if a user is a super admin

## Post-Migration Steps

### 1. Clear Browser State

1. Open your browser's developer console
2. Clear localStorage: `localStorage.clear()`
3. Refresh the page (Cmd/Ctrl + R)

### 2. Verify Application State

After refreshing, you should see:

- Organization name "Value8" in the header organization switcher
- Super Admin panel in the sidebar/settings
- Team members tab should be functional (not showing placeholder)
- Organization settings should save properly

### 3. Test Functionality

- [ ] Organization name displays in header
- [ ] Super admin panel is visible
- [ ] Team members tab is active
- [ ] Can save organization settings
- [ ] Can switch between organizations (if multiple exist)

## Troubleshooting

### Organization Name Not Showing

1. Check browser console for errors
2. Verify organization exists in database (see verification queries above)
3. Clear localStorage and refresh
4. Check that currentOrganizationId is set: `localStorage.getItem('currentOrganizationId')`

### Super Admin Panel Not Visible

1. Verify super admin record exists (see verification queries)
2. Clear localStorage and refresh
3. Check permissions API: Navigate to `/api/user/permissions` to see response
4. Check browser console for permission loading errors

### Team Members Not Working

1. Ensure organization exists and is loaded
2. Verify organization_members table has your membership
3. Check browser console for API errors
4. Verify RLS policies allow reading organization_members

### Migration Errors

**Error: "policy already exists"**

- Solution: The migration includes DROP POLICY IF EXISTS statements
- Run the migration again, it's idempotent and safe to re-run

**Error: "row violates row-level security"**

- Solution: The migration creates policies that allow initial data creation
- Ensure you're running the complete migration, not partial sections

**Error: "column does not exist"**

- Solution: The migration adds missing columns with IF NOT EXISTS checks
- Run the complete migration file

## Migration Safety

- This migration is **idempotent** - safe to run multiple times
- Uses `IF NOT EXISTS` for table and column creation
- Uses `ON CONFLICT DO NOTHING` for data inserts
- Drops and recreates policies cleanly

## Rollback (If Needed)

If you need to start fresh:

```sql
-- WARNING: This deletes all data in these tables
DROP TABLE IF EXISTS public.organization_members CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;
DROP TABLE IF EXISTS public.super_admins CASCADE;
DROP FUNCTION IF EXISTS public.is_super_admin;
```

Then re-run the migration.

## Support

If you encounter issues not covered here:

1. Check browser console for error messages
2. Check Supabase logs for database errors
3. Verify you're signed in with eran@value8.ai
4. Use the debug endpoint: `/api/debug/organizations` to see current state
