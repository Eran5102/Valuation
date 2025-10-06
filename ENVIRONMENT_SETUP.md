# Environment Setup Guide

## Overview

This project uses different environment configurations for local development and production. Here's how to avoid configuration confusion:

## Environment Files Structure

```
.env.local           # Local development (ignored by git) ✅ USE THIS
.env.test.local      # Testing environment (ignored by git)
.env.production.local # NOT used by Vercel (ignored by git)
.env.example         # Template file (committed to git)
```

## Important Rules

### ⚠️ Critical: Vercel Does NOT Use `.env.production.local`

**Vercel completely ignores all `.env*` files in your repository!**

- `.env.production.local` is ONLY for local production builds (`npm run build`)
- Vercel uses **Environment Variables** set in the Vercel Dashboard
- This is by design for security - secrets should never be in git

### Current Database Setup

**Development/Test Database (what you use locally):**

- URL: `https://sfirooxwybfcgresqnpq.supabase.co`
- Contains: Your test data (Test Co client, 409A valuations, templates)
- Used by: `.env.local` and `.env.test.local`

**Production Database (Vercel):**

- **Should be the same** as development for now (we're using one database)
- Set in Vercel Dashboard, NOT in code

## Setup Instructions

### 1. Local Development Setup

```bash
# Copy the example file
cp .env.example .env.local

# Edit .env.local with your values
# Use the DEVELOPMENT database credentials (sfirooxwybfcgresqnpq)
```

Your `.env.local` should contain:

```env
PORT=4000
NEXT_PUBLIC_API_URL=http://localhost:4000
REPORT_SERVER_PORT=4001

NEXT_PUBLIC_SUPABASE_URL=https://sfirooxwybfcgresqnpq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmaXJvb3h3eWJmY2dyZXNxbnBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNTMwMTEsImV4cCI6MjA3NDcyOTAxMX0.jA03JNPAhgPWieJhKFGxIeXD51808ovb9HMrULRl5vw
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmaXJvb3h3eWJmY2dyZXNxbnBxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTE1MzAxMSwiZXhwIjoyMDc0NzI5MDExfQ.O0ueNo-0ow4ptbVNMDXKFx1A8XGulis6GEQCuj2TqlE

ALPHA_VANTAGE_API_KEY=P9MHLKEMM4D1GOES
```

### 2. Vercel Production Setup

**MUST be done in Vercel Dashboard - NOT in code!**

1. Go to: https://vercel.com/[your-username]/[project-name]/settings/environment-variables

2. Set these variables for **Production**, **Preview**, AND **Development**:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://sfirooxwybfcgresqnpq.supabase.co

   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmaXJvb3h3eWJmY2dyZXNxbnBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNTMwMTEsImV4cCI6MjA3NDcyOTAxMX0.jA03JNPAhgPWieJhKFGxIeXD51808ovb9HMrULRl5vw

   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmaXJvb3h3eWJmY2dyZXNxbnBxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTE1MzAxMSwiZXhwIjoyMDc0NzI5MDExfQ.O0ueNo-0ow4ptbVNMDXKFx1A8XGulis6GEQCuj2TqlE

   ALPHA_VANTAGE_API_KEY=P9MHLKEMM4D1GOES
   ```

3. After saving, **redeploy** from Deployments tab (uncheck "use existing build cache")

### 3. Verify Setup

**Check Local:**

```bash
npm run dev
# Visit http://localhost:4000
# Login and verify you see your data
```

**Check Vercel:**

```
# Visit your Vercel URL
# Check: https://your-app.vercel.app/api/debug-env
# Should show: "supabaseUrl": "https://sfirooxwybfcgresqnpq.supabase.co"
```

## Workflow: Local → Git → Vercel

### Daily Development Workflow

1. **Work locally:**

   ```bash
   npm run dev
   # Make changes
   # Test at http://localhost:4000
   ```

2. **Commit and push:**

   ```bash
   git add .
   git commit -m "your changes"
   git push origin main
   ```

3. **Vercel auto-deploys:**
   - Vercel detects the push
   - Builds and deploys automatically
   - Uses environment variables from Vercel Dashboard (NOT from .env files)

### When You Need to Update Environment Variables

**Local development:**

- Edit `.env.local` directly
- Restart `npm run dev`

**Production (Vercel):**

- Update in Vercel Dashboard → Settings → Environment Variables
- Redeploy from Deployments tab

**NEVER** expect `.env.production.local` to affect Vercel!

## Troubleshooting

### "My changes work locally but not on Vercel"

1. Check if you modified environment variables
   - If YES → Update in Vercel Dashboard (not in code)
2. Check build logs in Vercel
3. Verify: `https://your-app.vercel.app/api/debug-env`

### "Data is missing in production"

1. Check: `https://your-app.vercel.app/api/debug-env`
2. Verify the `supabaseUrl` matches your local database
3. If wrong, update in Vercel Dashboard and redeploy

### "Which database am I using?"

- **Local:** Check `.env.local`
- **Vercel:** Check Vercel Dashboard → Environment Variables
- **Quick check:** Visit `/api/debug-env` on both

## Security Best Practices

✅ **DO:**

- Keep `.env.local` and `.env.*.local` in `.gitignore`
- Set production secrets in Vercel Dashboard
- Use different databases for dev and prod (when ready)

❌ **DON'T:**

- Commit `.env.local` or `.env.production.local` to git
- Assume Vercel reads `.env` files from your repo
- Share service role keys publicly

## Future: Separate Prod Database

When you're ready to use a separate production database:

1. Create new Supabase project for production
2. Run migrations on production database
3. Update Vercel environment variables to new database
4. Keep `.env.local` pointing to dev database
5. Now you have: dev database (local) + prod database (Vercel)
