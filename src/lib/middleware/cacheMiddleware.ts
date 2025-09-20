import { NextRequest, NextResponse } from 'next/server'
import ResponseCache from '@/lib/caching/responseCache'

interface CacheMiddlewareOptions {
  ttl?: number // Time to live in milliseconds
  tags?: string[] | ((request: NextRequest) => string[])
  keyPrefix?: string
  vary?: string[] // Headers to vary cache on
  skipCache?: boolean | ((request: NextRequest) => boolean)
  skipMethods?: string[] // HTTP methods to skip caching
  invalidateOnMutation?: boolean // Invalidate cache on POST/PUT/DELETE
}

class CacheMiddleware {
  private cache = ResponseCache.getInstance()

  /**
   * Create caching middleware
   */
  create(options: CacheMiddlewareOptions = {}) {
    const {
      ttl = 5 * 60 * 1000, // 5 minutes default
      tags = [],
      keyPrefix = 'api',
      vary = ['authorization', 'accept-encoding'],
      skipCache = false,
      skipMethods = ['POST', 'PUT', 'DELETE', 'PATCH'],
      invalidateOnMutation = true,
    } = options

    return async (
      request: NextRequest,
      handler: (request: NextRequest) => Promise<NextResponse>
    ): Promise<NextResponse> => {
      const method = request.method.toUpperCase()

      // Skip caching for certain methods or conditions
      if (skipMethods.includes(method)) {
        const response = await handler(request)

        // Invalidate related cache entries on mutations
        if (invalidateOnMutation && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
          await this.handleCacheInvalidation(request, response, options)
        }

        return response
      }

      // Check if should skip cache
      if (typeof skipCache === 'function' ? skipCache(request) : skipCache) {
        return await handler(request)
      }

      // Generate cache key
      const cacheKey = this.cache.generateKey(request, {
        keyPrefix,
        vary,
      })

      // Try to get from cache first
      const cachedResponse = this.cache.get(cacheKey)
      if (cachedResponse) {
        return cachedResponse
      }

      // Execute handler
      const response = await handler(request)

      // Only cache successful responses
      if (response.status >= 200 && response.status < 300) {
        // Resolve tags
        const resolvedTags = typeof tags === 'function' ? tags(request) : tags

        // Add automatic tags based on URL
        const autoTags = this.generateAutoTags(request)
        const allTags = [...resolvedTags, ...autoTags]

        // Clone response for caching (since response body can only be read once)
        const responseClone = response.clone()

        // Cache the response (async, don't await)
        this.cache
          .set(cacheKey, responseClone, {
            ttl,
            tags: allTags,
            vary,
          })
          .catch((error) => {
            console.error('Error caching response:', error)
          })

        // Add cache headers to original response
        response.headers.set('X-Cache', 'MISS')
        response.headers.set('X-Cache-Key', cacheKey)
        response.headers.set('X-Cache-Tags', allTags.join(','))
      }

      return response
    }
  }

  /**
   * Handle cache invalidation on mutations
   */
  private async handleCacheInvalidation(
    request: NextRequest,
    response: NextResponse,
    options: CacheMiddlewareOptions
  ): Promise<void> {
    if (!options.invalidateOnMutation) return

    const url = new URL(request.url)
    const pathSegments = url.pathname.split('/').filter(Boolean)

    // Generate invalidation tags based on the request
    const invalidationTags: string[] = []

    // Add resource-based tags
    if (pathSegments.length >= 2) {
      const resource = pathSegments[1] // e.g., 'companies', 'valuations'
      invalidationTags.push(`resource:${resource}`)

      // Add specific resource ID if present
      if (pathSegments.length >= 3 && pathSegments[2] !== 'route.ts') {
        invalidationTags.push(`resource:${resource}:${pathSegments[2]}`)
      }
    }

    // Add method-based tags
    invalidationTags.push(`method:${request.method.toLowerCase()}`)

    // Custom tags from response headers or options
    if (typeof options.tags === 'function') {
      const customTags = options.tags(request)
      invalidationTags.push(...customTags)
    } else if (Array.isArray(options.tags)) {
      invalidationTags.push(...options.tags)
    }

    // Invalidate cache entries
    if (invalidationTags.length > 0) {
      const invalidated = this.cache.invalidateByTags(invalidationTags)
      if (invalidated > 0) {
        console.log(
          `Cache invalidation: ${invalidated} entries invalidated for tags:`,
          invalidationTags
        )
      }
    }
  }

  /**
   * Generate automatic cache tags based on request
   */
  private generateAutoTags(request: NextRequest): string[] {
    const url = new URL(request.url)
    const pathSegments = url.pathname.split('/').filter(Boolean)
    const tags: string[] = []

    // Add path-based tags
    if (pathSegments.length >= 2) {
      const resource = pathSegments[1]
      tags.push(`resource:${resource}`)

      // Add nested resource tags
      if (pathSegments.length >= 3) {
        tags.push(`path:${pathSegments.slice(0, 3).join('/')}`)
      }
    }

    // Add query parameter tags for common parameters
    const searchParams = url.searchParams
    if (searchParams.has('page')) {
      tags.push('paginated')
    }
    if (searchParams.has('limit')) {
      tags.push('limited')
    }
    if (searchParams.has('company_id') || searchParams.has('companyId')) {
      tags.push(`company:${searchParams.get('company_id') || searchParams.get('companyId')}`)
    }
    if (searchParams.has('valuation_id') || searchParams.has('valuationId')) {
      tags.push(`valuation:${searchParams.get('valuation_id') || searchParams.get('valuationId')}`)
    }

    return tags
  }

  /**
   * Create cache warming middleware
   */
  createWarmer(routes: Array<{ path: string; method?: string; headers?: Record<string, string> }>) {
    return async () => {
      console.log('Starting cache warm-up...')

      for (const route of routes) {
        try {
          const { path, method = 'GET', headers = {} } = route

          // Create a mock request for cache warming
          const url = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${path}`
          const request = new NextRequest(url, {
            method,
            headers: new Headers(headers),
          })

          // Generate cache key
          const cacheKey = this.cache.generateKey(request)

          // Skip if already cached
          if (this.cache.get(cacheKey)) {
            continue
          }

          // Make actual request to warm cache
          const response = await fetch(url, { method, headers })

          if (response.ok) {
            const responseData = await response.text()
            const nextResponse = new NextResponse(responseData, {
              status: response.status,
              headers: response.headers,
            })

            await this.cache.set(cacheKey, nextResponse, {
              ttl: 10 * 60 * 1000, // 10 minutes for warmed cache
              tags: this.generateAutoTags(request),
            })

            console.log(`Cache warmed: ${method} ${path}`)
          }
        } catch (error) {
          console.error(`Cache warm-up failed for ${route.path}:`, error)
        }
      }

      console.log('Cache warm-up completed')
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return this.cache.getStats()
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear()
  }

  /**
   * Invalidate cache by tags
   */
  invalidateByTags(tags: string[]) {
    return this.cache.invalidateByTags(tags)
  }

  /**
   * Invalidate cache by pattern
   */
  invalidateByPattern(pattern: string) {
    return this.cache.invalidateByPattern(pattern)
  }
}

// Export singleton instance
export const cacheMiddleware = new CacheMiddleware()
export default CacheMiddleware
