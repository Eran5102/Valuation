# 🚨 CRITICAL: Database Migration Required

## Problem

Your app has been trying to save data to **non-existent database tables**. This is why nothing persists!

## Missing Tables

- ❌ `share_classes` - Cap table share classes
- ❌ `options_warrants` - Options and warrants
- ❌ `valuation_assumptions` - All assumption fields

## Solution: Run Migration Manually

### Step 1: Open Supabase SQL Editor

🔗 **[Click here to open SQL Editor](https://supabase.com/dashboard/project/sfirooxwybfcgresqnpq/sql/new)**

Or manually navigate to:

1. Go to https://supabase.com/dashboard
2. Select your project: `sfirooxwybfcgresqnpq`
3. Click **SQL Editor** in left sidebar
4. Click **New Query**

### Step 2: Copy Migration SQL

1. Open file: `supabase/migrations/19_create_cap_table_and_assumptions_tables.sql`
2. Select ALL content (Ctrl+A)
3. Copy (Ctrl+C)

### Step 3: Execute Migration

1. Paste the SQL into the Supabase SQL Editor (Ctrl+V)
2. Click **RUN** button (or press Ctrl+Enter)
3. Wait for "Success. No rows returned" message

### Step 4: Verify Tables Created

Run this verification script:

```bash
node scripts/verify-tables.js
```

## What Gets Created

### 1. `share_classes` table

- All cap table fields including `round_date`
- Liquidation preferences, conversion ratios, dividends
- Auto-calculated fields (amount_invested, liquidation_preference)

### 2. `options_warrants` table

- Options/warrants with `grant_date`
- num_options, exercise_price, type

### 3. `valuation_assumptions` table

- 50+ assumption fields mapped correctly:
  - Company info (name, incorporation_date, fiscal_year_end, etc.)
  - Valuation details (valuation_date, report_date, etc.)
  - Appraiser info (name, firm, credentials, etc.)
  - Rates & volatility (risk_free_rate, equity_volatility, etc.)
  - Financing (last_financing_date, amount, etc.)
  - Complex fields (management_team, key_investors as JSON)

### 4. Security & Performance

- ✅ RLS policies enabled
- ✅ Indexes created for performance
- ✅ Update triggers for timestamps

## After Migration

Your data will FINALLY persist! 🎉

### Test Checklist:

1. ✅ Add share class → Save → Refresh → Data persists
2. ✅ Add option with date → Save → Refresh → Date persists
3. ✅ Fill assumptions → Save → Refresh → All fields persist
4. ✅ Breakpoints load from real cap table data
5. ✅ OPM analysis works with saved data

## Troubleshooting

### If migration fails:

- Make sure you're logged into correct Supabase project
- Check you have admin/owner permissions
- Try running statements one section at a time

### If tables already exist:

- Migration is idempotent (safe to run multiple times)
- Uses `CREATE TABLE IF NOT EXISTS`

### Need help?

Run verification: `node scripts/verify-tables.js`
