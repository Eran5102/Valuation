# Deploy to Vercel Guide

## Prerequisites

1. Create a Vercel account at https://vercel.com
2. Install Vercel CLI (optional): `npm i -g vercel`

## Environment Variables

Set the following environment variables in your Vercel dashboard:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (if needed for server-side operations)

## Deployment Steps

### Option 1: Deploy via GitHub (Recommended)

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Vercel will automatically deploy on every push to main branch

### Option 2: Deploy via Vercel CLI

1. Run `vercel` in the project root
2. Follow the prompts
3. Set environment variables when prompted

### Option 3: Deploy via Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your Git repository
3. Configure environment variables
4. Deploy

## Build Configuration

The project is configured with:

- Next.js 15.5.3
- Automatic optimization for production
- TypeScript with relaxed checking for faster builds
- Bundle optimization with dynamic imports
- API routes with 30-second timeout

## Post-Deployment

1. Test all critical functionality
2. Monitor performance in Vercel Analytics
3. Set up error tracking (optional)
4. Configure custom domain (optional)

## Troubleshooting

### Build Errors

- The project has TypeScript errors ignored in production builds
- If build fails, check `vercel.json` configuration
- Ensure all environment variables are set

### Runtime Errors

- Check Vercel Functions logs
- Verify Supabase connection
- Check API route timeouts

## Performance Optimization

The app is optimized for Vercel with:

- Static generation where possible
- Dynamic imports for code splitting
- Image optimization
- CDN caching headers
- Webpack optimization

## Support

For issues, check:

- Vercel documentation: https://vercel.com/docs
- Next.js documentation: https://nextjs.org/docs
- Supabase documentation: https://supabase.com/docs
