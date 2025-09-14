import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary Theme Colors
        background: '#f6f7f6',
        foreground: '#2E3944',
        primary: {
          DEFAULT: '#124E66',
          foreground: '#ffffff',
        },
        
        // Secondary & Accent Colors
        secondary: {
          DEFAULT: '#D3D9D4',
          foreground: '#2E3944',
        },
        accent: {
          DEFAULT: '#74BD92',
          foreground: '#ffffff',
        },
        
        // UI Component Colors
        card: {
          DEFAULT: '#ffffff',
          foreground: '#2E3944',
        },
        popover: {
          DEFAULT: '#ffffff',
          foreground: '#2E3944',
        },
        muted: {
          DEFAULT: '#D3D9D4',
          foreground: '#2E3944',
        },
        
        // Utility & Form Colors
        border: '#D3D9D4',
        input: '#D3D9D4',
        ring: '#74BD92',
        
        // Status & Feedback Colors
        destructive: {
          DEFAULT: '#d92121',
          foreground: '#ffffff',
        },
        
        // Chart & Visualization Colors
        chart: {
          1: '#124E66',
          2: '#74BD92',
          3: '#2E3944',
          4: '#D3D9D4',
          5: '#212A31',
        },
        
        // Sidebar & Navigation Colors
        sidebar: {
          DEFAULT: '#ffffff',
          foreground: '#2E3944',
          primary: '#124E66',
          'primary-foreground': '#ffffff',
          accent: '#74BD92',
          'accent-foreground': '#ffffff',
          border: '#D3D9D4',
          ring: '#74BD92',
        },
      },
    },
  },
  plugins: [],
}

export default config