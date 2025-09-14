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
  
  // Experimental features for production optimization
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'recharts'
    ],
  },
  
  // Build output optimization
  output: 'standalone',
  
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
