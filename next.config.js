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
  // SWC minification is now enabled by default in Next.js 15

  // Disable eslint during build for bundle analysis
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Temporarily disable TypeScript checking during build
  typescript: {
    ignoreBuildErrors: true,
  },

  // Enable experimental features for better performance
  experimental: {
    // Optimize package imports
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      '@tanstack/react-table',
    ],

    // Enable partial pre-rendering for faster navigation
    ppr: false,

    // Optimize CSS
    optimizeCss: true,
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

  // Webpack optimizations (for production builds)
  webpack: (config, { dev, isServer }) => {
    // Fix "self is not defined" error during SSR
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        self: false,
      }
      // Define self for server-side rendering
      config.plugins.push(
        new config.webpack.DefinePlugin({
          self: 'global',
        })
      )
    }

    // Only apply webpack optimizations for production builds
    // Turbopack handles development compilation
    if (!dev) {
      // Production optimizations - Split chunks for better caching
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true,
          },
          radix: {
            test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
            name: 'radix',
            chunks: 'all',
            priority: 15,
          },
          lucide: {
            test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
            name: 'lucide',
            chunks: 'all',
            priority: 15,
          },
        },
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
