/**
 * Performance optimization utilities for the 409A valuation app
 */

// Throttle function - limits function execution to once per specified time period
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  let lastResult: any

  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      lastResult = func.apply(this, args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
    return lastResult
  }
}

// Enhanced debounce with immediate option
export function debounceWithImmediate<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate: boolean = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function (this: any, ...args: Parameters<T>) {
    const later = () => {
      timeout = null
      if (!immediate) func.apply(this, args)
    }

    const callNow = immediate && !timeout
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)

    if (callNow) func.apply(this, args)
  }
}

// Request Animation Frame throttle - better for UI updates
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null

  return function (this: any, ...args: Parameters<T>) {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
    }

    rafId = requestAnimationFrame(() => {
      func.apply(this, args)
      rafId = null
    })
  }
}

// Idle callback for non-urgent work
export function whenIdle(
  callback: () => void,
  options?: IdleRequestOptions
): number {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options)
  } else {
    // Fallback for browsers that don't support requestIdleCallback
    const timeout = setTimeout(callback, 1)
    return timeout as unknown as number
  }
}

// Cancel idle callback
export function cancelIdle(id: number): void {
  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(id)
  } else {
    clearTimeout(id)
  }
}

// Memoization helper for expensive computations
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  getKey?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>()

  return ((...args: Parameters<T>) => {
    const key = getKey ? getKey(...args) : JSON.stringify(args)

    if (cache.has(key)) {
      return cache.get(key)
    }

    const result = fn(...args)
    cache.set(key, result)

    // Limit cache size to prevent memory leaks
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value
      cache.delete(firstKey)
    }

    return result
  }) as T
}

// LRU Cache implementation
export class LRUCache<K, V> {
  private cache: Map<K, V>
  private maxSize: number

  constructor(maxSize: number = 100) {
    this.cache = new Map()
    this.maxSize = maxSize
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined

    // Move to end (most recently used)
    const value = this.cache.get(key)!
    this.cache.delete(key)
    this.cache.set(key, value)
    return value
  }

  set(key: K, value: V): void {
    // Remove if exists (to update position)
    if (this.cache.has(key)) {
      this.cache.delete(key)
    }

    // Add to end
    this.cache.set(key, value)

    // Remove oldest if over limit
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
  }

  has(key: K): boolean {
    return this.cache.has(key)
  }

  clear(): void {
    this.cache.clear()
  }

  get size(): number {
    return this.cache.size
  }
}

// Intersection Observer wrapper for lazy loading
export function createLazyLoader(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
) {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null
  }

  return new IntersectionObserver(callback, {
    root: null,
    rootMargin: '50px',
    threshold: 0.01,
    ...options
  })
}

// Performance marker utilities
export const performanceMarker = {
  start(markName: string): void {
    if (typeof window !== 'undefined' && window.performance) {
      performance.mark(`${markName}-start`)
    }
  },

  end(markName: string): number | null {
    if (typeof window !== 'undefined' && window.performance) {
      performance.mark(`${markName}-end`)
      performance.measure(markName, `${markName}-start`, `${markName}-end`)

      const measures = performance.getEntriesByName(markName)
      const duration = measures[measures.length - 1]?.duration || 0

      // Clean up
      performance.clearMarks(`${markName}-start`)
      performance.clearMarks(`${markName}-end`)
      performance.clearMeasures(markName)

      return duration
    }
    return null
  },

  time<T>(markName: string, fn: () => T): T {
    this.start(markName)
    const result = fn()
    const duration = this.end(markName)

    if (duration !== null && duration > 100) {
      console.warn(`Performance warning: ${markName} took ${duration.toFixed(2)}ms`)
    }

    return result
  }
}

// Web Vitals monitoring
export function reportWebVitals(metric: any) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
  }

  // In production, send to analytics
  // Example: send to Google Analytics
  if (typeof window !== 'undefined' && (window as any).gtag) {
    ;(window as any).gtag('event', metric.name, {
      value: Math.round(metric.value),
      event_category: 'Web Vitals',
      event_label: metric.id,
      non_interaction: true,
    })
  }
}

// Batch updates for React
export function batchUpdates<T>(updates: (() => void)[]): void {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      updates.forEach(update => update())
    })
  } else {
    // Fallback
    Promise.resolve().then(() => {
      updates.forEach(update => update())
    })
  }
}

// Virtual scroll helper
export interface VirtualScrollOptions {
  itemHeight: number
  containerHeight: number
  buffer?: number
  getScrollTop: () => number
  setScrollHeight: (height: number) => void
}

export function calculateVirtualItems<T>(
  items: T[],
  options: VirtualScrollOptions
): {
  visibleItems: T[]
  startIndex: number
  endIndex: number
  offsetY: number
} {
  const {
    itemHeight,
    containerHeight,
    buffer = 3,
    getScrollTop
  } = options

  const scrollTop = getScrollTop()
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer)
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + buffer
  )

  return {
    visibleItems: items.slice(startIndex, endIndex + 1),
    startIndex,
    endIndex,
    offsetY: startIndex * itemHeight
  }
}

// Memory usage monitor
export function getMemoryUsage(): {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
} | null {
  if (
    typeof window !== 'undefined' &&
    'performance' in window &&
    'memory' in (performance as any)
  ) {
    const memory = (performance as any).memory
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit
    }
  }
  return null
}

// Check if user prefers reduced motion
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  return mediaQuery.matches
}

// Optimize heavy computation with Web Workers (example)
export function runInWorker<T, R>(
  fn: (data: T) => R,
  data: T
): Promise<R> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([
      `self.onmessage = function(e) {
        const fn = ${fn.toString()};
        const result = fn(e.data);
        self.postMessage(result);
      }`
    ], { type: 'application/javascript' })

    const worker = new Worker(URL.createObjectURL(blob))

    worker.onmessage = (e) => {
      resolve(e.data)
      worker.terminate()
    }

    worker.onerror = reject
    worker.postMessage(data)
  })
}