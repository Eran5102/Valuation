import { NextRequest, NextResponse } from 'next/server';

interface CacheEntry {
  response: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string;
  };
  timestamp: number;
  ttl: number;
  etag: string;
  tags: string[];
  hitCount: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  tags?: string[]; // Cache tags for invalidation
  keyPrefix?: string;
  compress?: boolean;
  vary?: string[]; // Headers to vary cache on
}

interface CacheStats {
  totalEntries: number;
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  memoryUsage: number;
  topKeys: Array<{ key: string; hits: number; size: number }>;
}

class ResponseCache {
  private static instance: ResponseCache;
  private cache: Map<string, CacheEntry> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map(); // tag -> set of cache keys
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    invalidations: 0
  };
  private readonly maxSize = 1000; // Maximum number of entries
  private readonly maxMemory = 100 * 1024 * 1024; // 100MB max memory usage
  private cleanupInterval: NodeJS.Timeout;

  private constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  static getInstance(): ResponseCache {
    if (!ResponseCache.instance) {
      ResponseCache.instance = new ResponseCache();
    }
    return ResponseCache.instance;
  }

  /**
   * Generate cache key from request
   */
  generateKey(
    request: NextRequest,
    options: CacheOptions = {}
  ): string {
    const url = new URL(request.url);
    const { keyPrefix = 'api', vary = [] } = options;

    // Base key components
    const keyParts = [
      keyPrefix,
      request.method,
      url.pathname,
      url.search
    ];

    // Add vary headers to key
    vary.forEach(header => {
      const value = request.headers.get(header);
      if (value) {
        keyParts.push(`${header}:${value}`);
      }
    });

    // Create hash of the key to ensure consistent length
    const key = keyParts.join('|');
    return this.hashString(key);
  }

  /**
   * Get cached response
   */
  get(key: string): NextResponse | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update hit count and stats
    entry.hitCount++;
    this.stats.hits++;

    // Reconstruct NextResponse
    const response = new NextResponse(entry.response.body, {
      status: entry.response.status,
      statusText: entry.response.statusText,
      headers: entry.response.headers
    });

    // Add cache headers
    response.headers.set('X-Cache', 'HIT');
    response.headers.set('X-Cache-Key', key);
    response.headers.set('X-Cache-Age', Math.floor((Date.now() - entry.timestamp) / 1000).toString());

    return response;
  }

  /**
   * Store response in cache
   */
  async set(
    key: string,
    response: NextResponse,
    options: CacheOptions = {}
  ): Promise<void> {
    const {
      ttl = 5 * 60 * 1000, // 5 minutes default
      tags = [],
      compress = false
    } = options;

    try {
      // Read response body
      const body = await response.text();

      // Create cache entry
      const entry: CacheEntry = {
        response: {
          status: response.status,
          statusText: response.statusText,
          headers: this.serializeHeaders(response.headers),
          body: compress ? this.compress(body) : body
        },
        timestamp: Date.now(),
        ttl,
        etag: response.headers.get('etag') || this.generateETag(body),
        tags,
        hitCount: 0
      };

      // Store in cache
      this.cache.set(key, entry);

      // Update tag index
      tags.forEach(tag => {
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, new Set());
        }
        this.tagIndex.get(tag)!.add(key);
      });

      this.stats.sets++;

      // Enforce cache limits
      this.enforceLimits();

    } catch (error) {
      console.error('Error caching response:', error);
    }
  }

  /**
   * Delete specific cache entry
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Remove from tag index
    entry.tags.forEach(tag => {
      const tagSet = this.tagIndex.get(tag);
      if (tagSet) {
        tagSet.delete(key);
        if (tagSet.size === 0) {
          this.tagIndex.delete(tag);
        }
      }
    });

    this.cache.delete(key);
    this.stats.deletes++;
    return true;
  }

  /**
   * Invalidate cache entries by tags
   */
  invalidateByTags(tags: string[]): number {
    let invalidated = 0;

    tags.forEach(tag => {
      const keySet = this.tagIndex.get(tag);
      if (keySet) {
        keySet.forEach(key => {
          if (this.delete(key)) {
            invalidated++;
          }
        });
      }
    });

    this.stats.invalidations += invalidated;
    return invalidated;
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidateByPattern(pattern: string): number {
    const regex = new RegExp(pattern);
    let invalidated = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        if (this.delete(key)) {
          invalidated++;
        }
      }
    }

    this.stats.invalidations += invalidated;
    return invalidated;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    const count = this.cache.size;
    this.cache.clear();
    this.tagIndex.clear();
    this.stats.deletes += count;
    this.stats.invalidations += count;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? this.stats.hits / total : 0;

    // Calculate memory usage (rough estimate)
    let memoryUsage = 0;
    const topKeys: Array<{ key: string; hits: number; size: number }> = [];

    for (const [key, entry] of this.cache.entries()) {
      const size = JSON.stringify(entry).length * 2; // Rough bytes estimate
      memoryUsage += size;
      topKeys.push({ key, hits: entry.hitCount, size });
    }

    // Sort by hit count
    topKeys.sort((a, b) => b.hits - a.hits);

    return {
      totalEntries: this.cache.size,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      hitRate,
      memoryUsage,
      topKeys: topKeys.slice(0, 10)
    };
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`Cache cleanup: removed ${cleaned} expired entries`);
    }
  }

  /**
   * Enforce cache size and memory limits
   */
  private enforceLimits(): void {
    // Enforce max entries limit
    if (this.cache.size > this.maxSize) {
      // Remove oldest entries (LRU-like)
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      const toRemove = entries.slice(0, Math.floor(this.maxSize * 0.1)); // Remove 10%
      toRemove.forEach(([key]) => this.delete(key));
    }

    // Rough memory limit enforcement
    const stats = this.getStats();
    if (stats.memoryUsage > this.maxMemory) {
      // Remove least hit entries
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].hitCount - b[1].hitCount);

      const toRemove = entries.slice(0, Math.floor(this.cache.size * 0.2)); // Remove 20%
      toRemove.forEach(([key]) => this.delete(key));
    }
  }

  /**
   * Serialize headers for storage
   */
  private serializeHeaders(headers: Headers): Record<string, string> {
    const serialized: Record<string, string> = {};
    headers.forEach((value, key) => {
      serialized[key] = value;
    });
    return serialized;
  }

  /**
   * Generate ETag for content
   */
  private generateETag(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Hash string for consistent cache keys
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `cache_${Math.abs(hash).toString(16)}`;
  }

  /**
   * Simple compression (in production, use proper compression)
   */
  private compress(data: string): string {
    // In a real implementation, use zlib or similar
    return data; // Placeholder
  }

  /**
   * Simple decompression
   */
  private decompress(data: string): string {
    return data; // Placeholder
  }

  /**
   * Cleanup on shutdown
   */
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

export default ResponseCache;