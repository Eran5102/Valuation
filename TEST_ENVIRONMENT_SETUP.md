# Test Environment Setup Guide

## Overview

This guide will help you set up a complete test environment with a separate Supabase database to safely test the schema migration before applying to production.

## Step 1: Create Test Database in Supabase

### Option A: Database Branching (Recommended if available)

1. Log in to your Supabase Dashboard
2. Navigate to your project
3. Go to Settings → Database
4. Look for "Database Branching" (if available in your plan)
5. Create a new branch called "staging-test"

### Option B: Manual Test Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Name it: "valuation-test" or similar
4. Choose the same region as your production
5. Set a strong database password (save it!)
6. Wait for project to be created

## Step 2: Copy Production Data to Test Database

### Get your database URLs:

1. **Production URL**:
   - Go to your production project → Settings → Database
   - Copy the "Connection string" (URI)

2. **Test Database URL**:
   - Go to your test project → Settings → Database
   - Copy the "Connection string" (URI)

### Export and Import Data:

```bash
# Export production data (without schema changes)
pg_dump "YOUR_PRODUCTION_URL" --data-only --no-owner > production_backup.sql

# Import to test database
psql "YOUR_TEST_DATABASE_URL" < production_backup.sql
```

**Alternative: Use Supabase Dashboard**

1. Go to production project → Settings → Database
2. Click "Backups"
3. Create a backup
4. Restore it to your test project

## Step 3: Update Your Local Environment

### Create test environment file:

```bash
# In your project root
cp .env.local .env.test.local
```

### Edit .env.test.local:

```env
# Replace with your TEST database credentials
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_TEST_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_TEST_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_TEST_SERVICE_KEY

# Add a flag to identify test environment
NEXT_PUBLIC_ENVIRONMENT=test
```

## Step 4: Run Migration on Test Database

```bash
# Make sure you're on the staging branch
git checkout staging/database-schema-migration

# Apply migration to TEST database
npx supabase db push --db-url "YOUR_TEST_DATABASE_URL"

# Or if you have Supabase CLI configured:
npx supabase db push --project-ref YOUR_TEST_PROJECT_REF
```

## Step 5: Start Test Environment

```bash
# Use test environment variables
cp .env.test.local .env.local

# Start the development server
npm run dev

# Your app is now running against the TEST database with NEW schema
```

## Step 6: Testing Checklist

### ✅ Basic Functionality

- [ ] Login/Logout works
- [ ] Dashboard loads correctly
- [ ] User profile displays

### ✅ Data Migration

- [ ] All companies appear as clients
- [ ] User profiles consolidated (no duplicates)
- [ ] Existing valuations intact
- [ ] Team assignments preserved

### ✅ New Features

- [ ] `/api/clients` endpoint works
- [ ] Assignment history tracking
- [ ] Permission levels (lead, team, editor, viewer)
- [ ] Report template linking

### ✅ Backward Compatibility

- [ ] Old `/api/companies` endpoint still works
- [ ] Existing UI components function
- [ ] No broken pages or features

## Step 7: Make Additional Changes

While testing, you can continue to improve the code:

```bash
# Make sure you're on staging branch
git checkout staging/database-schema-migration

# Make your changes
# ... edit files ...

# Commit changes
git add .
git commit -m "Additional improvements"
git push
```

## Step 8: When Ready for Production

### 1. Final Testing

- [ ] All features work in test environment
- [ ] No data loss or corruption
- [ ] Performance is acceptable
- [ ] Team has reviewed changes

### 2. Merge to Main

```bash
# Switch to main branch
git checkout main

# Merge staging branch
git merge staging/database-schema-migration

# Push to GitHub
git push origin main
```

### 3. Apply Migration to Production

```bash
# BACKUP FIRST!
pg_dump "YOUR_PRODUCTION_URL" > backup_before_migration.sql

# Apply migration
npx supabase db push --db-url "YOUR_PRODUCTION_URL"

# Or through Supabase Dashboard:
# SQL Editor → New Query → Paste migration → Run
```

### 4. Switch Back to Production Environment

```bash
# Restore production environment variables
cp .env.production.local .env.local

# Restart your application
npm run dev
```

## Rollback Plan (If Needed)

If something goes wrong:

### Quick Rollback (Code Only):

```bash
git checkout main
git reset --hard HEAD~1
git push --force origin main
```

### Database Rollback:

```sql
-- Run the rollback script from TESTING_PLAN.md Section 10
-- Or restore from backup:
psql "YOUR_PRODUCTION_URL" < backup_before_migration.sql
```

## Important Notes

1. **Always backup before migrations**
2. **Test thoroughly in test environment**
3. **Schedule production migration during low-traffic period**
4. **Have rollback plan ready**
5. **Monitor after deployment**

## Environment Variables Reference

### Production (.env.local):

- Points to your live Supabase project
- Used for actual users

### Test (.env.test.local):

- Points to test Supabase project
- Safe for experiments
- Can be reset anytime

### Switching Environments:

```bash
# Use test database
cp .env.test.local .env.local

# Use production database
cp .env.production.local .env.local

# Always restart server after switching
```

## Support Commands

### Check current branch:

```bash
git branch --show-current
```

### Check migration status:

```bash
npx supabase db migrations list
```

### View schema differences:

```bash
npx supabase db diff --schema public
```

---

**Remember**: The staging branch code is designed to work with BOTH old and new database schemas, so you can test safely!
