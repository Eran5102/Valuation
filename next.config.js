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

  // Experimental features for performance optimization
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

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Fix for browser globals in server environment
    if (isServer) {
      // Use ignore-loader for browser-only libraries
      config.module.rules.push({
        test: /node_modules\/(xlsx|jspdf|html2canvas)/,
        use: 'ignore-loader',
      })
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
