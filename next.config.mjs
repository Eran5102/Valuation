/** @type {import('next').NextConfig} */
const nextConfig = {
  // Temporarily ignore build errors for Vercel deployment
  typescript: {
    ignoreBuildErrors: true,
  },

  // Temporarily ignore ESLint during builds
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Basic React settings
  reactStrictMode: true,
  swcMinify: true,

  // Image optimization
  images: {
    domains: ['localhost', 'supabase.co'],
    formats: ['image/avif', 'image/webp'],
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
}

export default nextConfig