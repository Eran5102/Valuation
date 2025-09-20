# Deployment Guide

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account and project
- Vercel account (recommended) or alternative hosting
- Git repository

## Environment Setup

### 1. Environment Variables

Create `.env.production` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_APP_NAME="409A Valuation Platform"

# Optional: Analytics
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX
NEXT_PUBLIC_POSTHOG_KEY=your-posthog-key

# Optional: Error Tracking
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

### 2. Database Setup

1. **Create Supabase Project**
   ```bash
   # Install Supabase CLI
   npm install -g supabase

   # Link to your project
   supabase link --project-ref your-project-id
   ```

2. **Run Migrations**
   ```bash
   # Apply all migrations
   supabase db push

   # Or run individually
   supabase db push --file supabase/migrations/001_initial_schema.sql
   supabase db push --file supabase/migrations/002_rls_policies.sql
   supabase db push --file supabase/migrations/003_performance_indexes.sql
   ```

3. **Seed Initial Data (Optional)**
   ```bash
   supabase db seed
   ```

## Deployment Options

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   # Production deployment
   vercel --prod

   # Preview deployment
   vercel
   ```

3. **Configure Environment Variables**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Add all production environment variables
   - Redeploy to apply changes

4. **Custom Domain**
   - Add domain in Vercel Dashboard → Settings → Domains
   - Update DNS records with your provider

### Option 2: Docker

1. **Build Docker Image**
   ```bash
   docker build -t 409a-platform .
   ```

2. **Run Container**
   ```bash
   docker run -p 3000:3000 \
     -e NEXT_PUBLIC_SUPABASE_URL=your-url \
     -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
     409a-platform
   ```

3. **Docker Compose**
   ```yaml
   version: '3.8'
   services:
     app:
       build: .
       ports:
         - "3000:3000"
       env_file:
         - .env.production
       restart: unless-stopped
   ```

### Option 3: Traditional VPS

1. **Setup Server**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y

   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install PM2
   npm install -g pm2
   ```

2. **Clone and Build**
   ```bash
   # Clone repository
   git clone https://github.com/your-repo/409a-platform.git
   cd 409a-platform

   # Install dependencies
   npm install

   # Build application
   npm run build
   ```

3. **Run with PM2**
   ```bash
   # Start application
   pm2 start npm --name "409a-platform" -- start

   # Save PM2 configuration
   pm2 save
   pm2 startup
   ```

4. **Setup Nginx**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

5. **SSL with Let's Encrypt**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

## Production Checklist

### Pre-Deployment

- [ ] All tests passing (`npm run test`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] TypeScript builds successfully (`npm run type-check`)
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] RLS policies enabled in Supabase
- [ ] Secrets rotated and secured

### Performance

- [ ] Bundle size optimized (`npm run analyze`)
- [ ] Images optimized and using Next.js Image
- [ ] Lazy loading implemented
- [ ] API response caching configured
- [ ] CDN configured for static assets

### Security

- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Rate limiting implemented
- [ ] Input validation on all forms
- [ ] SQL injection prevention
- [ ] XSS protection enabled
- [ ] CORS properly configured

### Monitoring

- [ ] Error tracking setup (Sentry)
- [ ] Performance monitoring (Vercel Analytics)
- [ ] Uptime monitoring (UptimeRobot)
- [ ] Log aggregation configured
- [ ] Alerts configured for critical events

## CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run validate

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## Rollback Procedures

### Quick Rollback

1. **Vercel**
   ```bash
   # List deployments
   vercel ls

   # Rollback to previous deployment
   vercel rollback [deployment-url]
   ```

2. **Manual Rollback**
   ```bash
   # Revert to previous commit
   git revert HEAD
   git push origin main

   # Or reset to specific commit
   git reset --hard [commit-hash]
   git push --force origin main
   ```

### Database Rollback

```bash
# Create backup before changes
supabase db dump > backup.sql

# Restore from backup
supabase db reset
psql -h db.supabase.co -U postgres -d postgres < backup.sql
```

## Monitoring & Maintenance

### Health Checks

Create `/api/health` endpoint:

```typescript
export async function GET() {
  try {
    // Check database connection
    const { error } = await supabase.from('companies').select('count').limit(1)

    if (error) throw error

    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version
    })
  } catch (error) {
    return Response.json({
      status: 'unhealthy',
      error: error.message
    }, { status: 503 })
  }
}
```

### Scheduled Maintenance

1. **Notify Users**
   - Display maintenance banner 24 hours before
   - Send email notifications to active users

2. **Maintenance Mode**
   ```typescript
   // middleware.ts
   export function middleware(request: NextRequest) {
     if (process.env.MAINTENANCE_MODE === 'true') {
       return NextResponse.rewrite(new URL('/maintenance', request.url))
     }
   }
   ```

3. **Database Maintenance**
   ```sql
   -- Vacuum and analyze tables
   VACUUM ANALYZE companies;
   VACUUM ANALYZE valuations;

   -- Reindex
   REINDEX TABLE companies;
   REINDEX TABLE valuations;
   ```

## Scaling Considerations

### Horizontal Scaling

- Use Vercel's automatic scaling
- Configure multiple PM2 instances
- Implement database connection pooling

### Vertical Scaling

- Upgrade Supabase plan for more resources
- Increase server specifications
- Optimize database queries

### Caching Strategy

- Implement Redis for session storage
- Use Next.js ISR for static pages
- Configure CDN caching headers

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version matches
   - Clear cache: `rm -rf .next node_modules`
   - Reinstall dependencies: `npm ci`

2. **Database Connection Issues**
   - Verify Supabase URL and keys
   - Check network connectivity
   - Review RLS policies

3. **Performance Issues**
   - Enable production mode
   - Check bundle size
   - Review database indexes

### Debug Mode

Enable verbose logging:

```env
DEBUG=true
LOG_LEVEL=verbose
```

### Support Contacts

- Technical Issues: tech@409avaluation.com
- Database Issues: Check Supabase status page
- Hosting Issues: Check Vercel status page

## Post-Deployment

1. **Verify Deployment**
   ```bash
   # Check application health
   curl https://your-domain.com/api/health

   # Run smoke tests
   npm run test:e2e:production
   ```

2. **Monitor Metrics**
   - Check error rates in Sentry
   - Review performance in Vercel Analytics
   - Monitor database performance in Supabase

3. **Update Documentation**
   - Document any deployment-specific changes
   - Update runbook with new procedures
   - Share deployment notes with team