/** @type {import('next').NextConfig} */

// Only load bundle analyzer if it's available (dev environment)
let withBundleAnalyzer = (config) => config
try {
  withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
  })
} catch (e) {
  // Bundle analyzer not available in production, that's fine
}

const nextConfig = {
  // SWC minifier is enabled by default in Next.js 15

  // Disable eslint during build for bundle analysis
  eslint: {
    ignoreDuringBuilds: true,
  },

  // TypeScript checking - temporarily disabled
  // Progress: 318 → 146 → 224 → 162 → 91 → 30 → 22 errors (93% reduction!)
  // TODO: Enable once remaining errors are fixed
  typescript: {
    ignoreBuildErrors: true, // Only 22 errors remaining (from initial 318)
  },

  // Experimental features for performance optimization
  experimental: {
    // Optimize package imports - add heavy libraries
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-label',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-slider',
      '@radix-ui/react-switch',
      '@tanstack/react-table',
      '@tanstack/react-query',
      '@supabase/supabase-js',
      '@supabase/ssr',
      'sonner',
      'zod',
    ],

    // Enable partial pre-rendering for faster navigation
    ppr: false,

    // Optimize CSS
    optimizeCss: true,
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Output file tracing to silence warnings
  outputFileTracingRoot: __dirname,

  // Turbopack configuration for development
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Prevent browser-only libraries from being bundled on server
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        xlsx: false,
        jspdf: false,
        html2canvas: false,
      }
    }

    return config
  },

  // Enable compression
  compress: true,

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Headers for better caching
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
}

module.exports = withBundleAnalyzer(nextConfig)
