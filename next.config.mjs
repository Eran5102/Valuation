import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable TypeScript checking in builds
  typescript: {
    ignoreBuildErrors: false,
  },

  // Enable ESLint during builds
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Enable React strict mode for better error detection
  reactStrictMode: true,

  // Optimize production builds
  swcMinify: true,

  // Image optimization
  images: {
    domains: ['localhost', 'supabase.co'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // Experimental features for performance
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      '@tanstack/react-table',
      '@tanstack/react-query',
      'date-fns',
      'lodash',
    ],
  },

  // Webpack optimization
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle splitting
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk for node_modules
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            // Separate chunk for React and related libraries
            react: {
              name: 'react',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 30,
            },
            // Separate chunk for UI libraries
            ui: {
              name: 'ui',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](@radix-ui|@tanstack|lucide-react)[\\/]/,
              priority: 25,
            },
            // Common chunk for shared code
            common: {
              name: 'common',
              minChunks: 2,
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        },
      }
    }

    // Tree shaking for production
    if (!dev) {
      config.optimization.usedExports = true
      config.optimization.sideEffects = false
    }

    return config
  },

  // Headers for caching and security
  async headers() {
    return [
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },

  // Reduce JavaScript bundle size
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Output configuration - removed standalone for Vercel deployment

  // Page extensions
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],

  // Environment variables
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },

  // Redirects for old routes
  async redirects() {
    return []
  },

  // Rewrites for API routes
  async rewrites() {
    return []
  },
}

export default withBundleAnalyzer(nextConfig)