import { NextRequest, NextResponse } from 'next/server';
import ApiHandler from '@/lib/middleware/apiHandler';
import { cacheMiddleware } from '@/lib/middleware/cacheMiddleware';

// GET /api/monitoring/cache - Get cache statistics
export const GET = ApiHandler.handle(
  async (request: NextRequest) => {
    const stats = cacheMiddleware.getStats();

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      cache: stats,
      message: 'Cache statistics retrieved successfully'
    });
  },
  {
    cache: {
      maxAge: 30, // Cache for 30 seconds
      private: true
    },
    monitoring: false, // Avoid circular monitoring
    security: true
  }
);

// POST /api/monitoring/cache/clear - Clear cache
export const POST = ApiHandler.handle(
  async (request: NextRequest) => {
    const body = await request.json().catch(() => ({}));
    const { tags, pattern } = body;

    let cleared = 0;

    if (tags && Array.isArray(tags)) {
      // Invalidate by tags
      cleared = cacheMiddleware.invalidateByTags(tags);
    } else if (pattern && typeof pattern === 'string') {
      // Invalidate by pattern
      cleared = cacheMiddleware.invalidateByPattern(pattern);
    } else {
      // Clear all cache
      cacheMiddleware.clearCache();
      cleared = -1; // Indicates full clear
    }

    return NextResponse.json({
      message: cleared === -1
        ? 'All cache cleared successfully'
        : `${cleared} cache entries cleared successfully`,
      cleared,
      timestamp: new Date().toISOString()
    });
  },
  {
    rateLimit: {
      requests: 10,
      window: 60000 // 1 minute
    },
    monitoring: false,
    security: true
  }
);

// PUT /api/monitoring/cache/warm - Warm up cache
export const PUT = ApiHandler.handle(
  async (request: NextRequest) => {
    const body = await request.json().catch(() => ({}));
    const { routes = [] } = body;

    // Default routes to warm if none provided
    const defaultRoutes = [
      { path: '/api/companies' },
      { path: '/api/valuations' },
      { path: '/api/companies?page=1&limit=20' },
      { path: '/api/valuations?page=1&limit=20' }
    ];

    const routesToWarm = routes.length > 0 ? routes : defaultRoutes;

    // Create and execute cache warmer
    const warmer = cacheMiddleware.createWarmer(routesToWarm);

    // Run cache warming in background
    warmer().catch(error => {
      console.error('Cache warming failed:', error);
    });

    return NextResponse.json({
      message: `Cache warm-up initiated for ${routesToWarm.length} routes`,
      routes: routesToWarm,
      timestamp: new Date().toISOString()
    });
  },
  {
    rateLimit: {
      requests: 5,
      window: 300000 // 5 minutes
    },
    monitoring: false,
    security: true
  }
);