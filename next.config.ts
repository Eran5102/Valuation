import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production optimizations
  productionBrowserSourceMaps: false,
  poweredByHeader: false,

  // Performance optimizations
  compress: true,
  generateEtags: true,

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },

  // Bundle analyzer (enable when needed)
  // bundleAnalyzer: {
  //   enabled: process.env.ANALYZE === 'true',
  // },

  // Experimental features for development performance
  experimental: {
    // Disabled optimizeCss in development for better performance
    optimizeCss: process.env.NODE_ENV === 'production',
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'recharts',
      '@tanstack/react-table',
      '@dnd-kit/core',
      '@dnd-kit/sortable'
    ],
  },

  // Remove standalone output for development - causes bundle bloat
  ...(process.env.NODE_ENV === 'production' && { output: 'standalone' }),

  // Add webpack optimizations for development
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Optimize development builds
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      }
    }
    return config
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
};

export default nextConfig;
