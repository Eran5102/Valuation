import { NextRequest, NextResponse } from 'next/server';
import { gzipSync, deflateSync, brotliCompressSync } from 'zlib';

interface CacheOptions {
  maxAge?: number; // seconds
  sMaxAge?: number; // shared cache max age
  staleWhileRevalidate?: number; // seconds
  private?: boolean;
  noCache?: boolean;
  etag?: boolean;
}

interface CompressionOptions {
  threshold?: number; // minimum size in bytes to compress
  level?: number; // compression level (1-9)
  types?: string[]; // MIME types to compress
}

class ResponseOptimizer {
  private static readonly DEFAULT_COMPRESSION_THRESHOLD = 1024; // 1KB
  private static readonly DEFAULT_COMPRESSION_LEVEL = 6;
  private static readonly COMPRESSIBLE_TYPES = [
    'text/html',
    'text/css',
    'text/javascript',
    'text/plain',
    'application/json',
    'application/javascript',
    'application/xml',
    'text/xml',
    'image/svg+xml'
  ];

  /**
   * Add cache headers to response
   */
  static addCacheHeaders(
    response: NextResponse,
    options: CacheOptions = {}
  ): NextResponse {
    const {
      maxAge = 300, // 5 minutes default
      sMaxAge,
      staleWhileRevalidate,
      private: isPrivate = false,
      noCache = false,
      etag = true
    } = options;

    if (noCache) {
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      return response;
    }

    const cacheDirectives: string[] = [];

    if (isPrivate) {
      cacheDirectives.push('private');
    } else {
      cacheDirectives.push('public');
    }

    cacheDirectives.push(`max-age=${maxAge}`);

    if (sMaxAge) {
      cacheDirectives.push(`s-maxage=${sMaxAge}`);
    }

    if (staleWhileRevalidate) {
      cacheDirectives.push(`stale-while-revalidate=${staleWhileRevalidate}`);
    }

    response.headers.set('Cache-Control', cacheDirectives.join(', '));

    // Add ETag for conditional requests
    if (etag && response.body) {
      const hash = this.generateETag(response.body.toString());
      response.headers.set('ETag', `"${hash}"`);
    }

    // Add Last-Modified
    response.headers.set('Last-Modified', new Date().toUTCString());

    return response;
  }

  /**
   * Compress response if applicable
   */
  static compressResponse(
    request: NextRequest,
    response: NextResponse,
    options: CompressionOptions = {}
  ): NextResponse {
    const {
      threshold = this.DEFAULT_COMPRESSION_THRESHOLD,
      level = this.DEFAULT_COMPRESSION_LEVEL,
      types = this.COMPRESSIBLE_TYPES
    } = options;

    const body = response.body?.toString();
    if (!body) return response;

    const contentType = response.headers.get('content-type') || '';
    const isCompressible = types.some(type => contentType.includes(type));

    if (!isCompressible || body.length < threshold) {
      return response;
    }

    const acceptEncoding = request.headers.get('accept-encoding') || '';

    let compressedBody: Buffer | null = null;
    let encoding: string | null = null;

    // Try Brotli first (best compression)
    if (acceptEncoding.includes('br')) {
      try {
        compressedBody = brotliCompressSync(Buffer.from(body), {
          params: {
            [11]: level, // BROTLI_PARAM_QUALITY
          }
        });
        encoding = 'br';
      } catch (error) {
        console.warn('Brotli compression failed:', error);
      }
    }

    // Fallback to gzip
    if (!compressedBody && acceptEncoding.includes('gzip')) {
      try {
        compressedBody = gzipSync(Buffer.from(body), { level });
        encoding = 'gzip';
      } catch (error) {
        console.warn('Gzip compression failed:', error);
      }
    }

    // Fallback to deflate
    if (!compressedBody && acceptEncoding.includes('deflate')) {
      try {
        compressedBody = deflateSync(Buffer.from(body), { level });
        encoding = 'deflate';
      } catch (error) {
        console.warn('Deflate compression failed:', error);
      }
    }

    if (compressedBody && encoding) {
      // Create new response with compressed body
      const compressedResponse = new NextResponse(compressedBody, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });

      compressedResponse.headers.set('Content-Encoding', encoding);
      compressedResponse.headers.set('Content-Length', compressedBody.length.toString());
      compressedResponse.headers.set('Vary', 'Accept-Encoding');

      // Add compression ratio info for monitoring
      const originalSize = Buffer.from(body).length;
      const compressionRatio = ((originalSize - compressedBody.length) / originalSize * 100).toFixed(1);
      compressedResponse.headers.set('X-Compression-Ratio', `${compressionRatio}%`);
      compressedResponse.headers.set('X-Original-Size', originalSize.toString());

      return compressedResponse;
    }

    return response;
  }

  /**
   * Add security headers
   */
  static addSecurityHeaders(response: NextResponse): NextResponse {
    // Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Content Security Policy (basic)
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;"
    );

    return response;
  }

  /**
   * Add performance headers
   */
  static addPerformanceHeaders(
    response: NextResponse,
    startTime: number
  ): NextResponse {
    const processingTime = Date.now() - startTime;

    response.headers.set('X-Response-Time', `${processingTime}ms`);
    response.headers.set('X-Powered-By', 'Next.js Optimized');

    // Server timing for performance debugging
    response.headers.set('Server-Timing', `total;dur=${processingTime}`);

    return response;
  }

  /**
   * Handle conditional requests (304 Not Modified)
   */
  static handleConditionalRequest(
    request: NextRequest,
    response: NextResponse
  ): NextResponse | null {
    const ifNoneMatch = request.headers.get('if-none-match');
    const ifModifiedSince = request.headers.get('if-modified-since');

    const etag = response.headers.get('etag');
    const lastModified = response.headers.get('last-modified');

    // Check ETag
    if (ifNoneMatch && etag && ifNoneMatch === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          'ETag': etag,
          'Last-Modified': lastModified || '',
          'Cache-Control': response.headers.get('cache-control') || ''
        }
      });
    }

    // Check Last-Modified
    if (ifModifiedSince && lastModified) {
      const modifiedSince = new Date(ifModifiedSince);
      const lastModifiedDate = new Date(lastModified);

      if (modifiedSince >= lastModifiedDate) {
        return new NextResponse(null, {
          status: 304,
          headers: {
            'ETag': etag || '',
            'Last-Modified': lastModified,
            'Cache-Control': response.headers.get('cache-control') || ''
          }
        });
      }
    }

    return null; // No conditional response needed
  }

  /**
   * Generate ETag hash
   */
  private static generateETag(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Complete response optimization pipeline
   */
  static optimizeResponse(
    request: NextRequest,
    response: NextResponse,
    options: {
      cache?: CacheOptions;
      compression?: CompressionOptions;
      security?: boolean;
      performance?: boolean;
      startTime?: number;
    } = {}
  ): NextResponse {
    const {
      cache,
      compression,
      security = true,
      performance = true,
      startTime = Date.now()
    } = options;

    let optimizedResponse = response;

    // Handle conditional requests first
    const conditionalResponse = this.handleConditionalRequest(request, response);
    if (conditionalResponse) {
      return conditionalResponse;
    }

    // Apply compression
    if (compression !== false) {
      optimizedResponse = this.compressResponse(request, optimizedResponse, compression);
    }

    // Add cache headers
    if (cache) {
      optimizedResponse = this.addCacheHeaders(optimizedResponse, cache);
    }

    // Add security headers
    if (security) {
      optimizedResponse = this.addSecurityHeaders(optimizedResponse);
    }

    // Add performance headers
    if (performance) {
      optimizedResponse = this.addPerformanceHeaders(optimizedResponse, startTime);
    }

    return optimizedResponse;
  }
}

export default ResponseOptimizer;