# Syncing Environment Variables with Vercel

## Quick Commands

### Pull Latest Environment Variables from Vercel

```bash
# Link to your Vercel project (first time only)
vercel link

# Pull environment variables from Vercel
vercel env pull .env.local

# This downloads Production environment variables to .env.local
# You can now run your app with the exact same config as production
```

### Check Current Vercel Environment Variables

```bash
# List all environment variables
vercel env ls

# Pull specific environment (production/preview/development)
vercel env pull .env.local --environment=production
```

## One-Time Setup

1. **Login to Vercel CLI:**

   ```bash
   vercel login
   ```

2. **Link this project to Vercel:**

   ```bash
   vercel link
   ```

   - Select your team/account
   - Select the project (your 409A app)

3. **Pull environment variables:**
   ```bash
   vercel env pull .env.local
   ```

Now your `.env.local` will always match production!

## When to Use This

### ✅ Use `vercel env pull` when:

- You updated env vars in Vercel Dashboard and want them locally
- You're setting up the project on a new machine
- You want to ensure local and production are in sync
- You're debugging why local works but production doesn't

### ❌ Don't use when:

- Making temporary local changes (just edit `.env.local`)
- Testing with different databases locally

## Workflow with Vercel CLI

### Option A: Always Match Production (Recommended for small teams)

```bash
# Pull latest from Vercel before starting work
vercel env pull .env.local

# Start development
npm run dev

# Make changes, test locally
# Commit and push
git add .
git commit -m "your changes"
git push

# Vercel auto-deploys with its environment variables
```

### Option B: Separate Local Config

```bash
# Keep your own .env.local
# Only pull from Vercel when you need to debug prod issues
vercel env pull .env.production.local --environment=production

# Compare the files to see differences
diff .env.local .env.production.local
```

## Updating Environment Variables

### To update Vercel environment variables:

**Option 1: Via Dashboard (Easier)**

1. Go to Vercel Dashboard → Settings → Environment Variables
2. Edit the variable
3. Redeploy
4. Run `vercel env pull .env.local` locally to sync

**Option 2: Via CLI**

```bash
# Add a new environment variable
vercel env add NEXT_PUBLIC_NEW_VAR production

# Remove an environment variable
vercel env rm NEXT_PUBLIC_OLD_VAR production

# Pull the changes locally
vercel env pull .env.local
```

## Troubleshooting

### "My local app doesn't match production"

```bash
# See what Vercel is using
vercel env ls

# Pull production config
vercel env pull .env.local --environment=production

# Compare with your current .env.local
cat .env.local
```

### "I updated Vercel but local isn't updating"

```bash
# Force pull from Vercel
rm .env.local
vercel env pull .env.local
```

### "How do I know what database Vercel is using?"

```bash
# Check Vercel env vars
vercel env ls | grep SUPABASE_URL

# Or visit your deployed app
# https://your-app.vercel.app/api/debug-env
```

## Security Notes

- `.env.local` is in `.gitignore` - never commit it
- `vercel env pull` downloads sensitive keys - keep them safe
- Service role keys should only be in Vercel + your local `.env.local`
- Never share `.env.local` or post it publicly
