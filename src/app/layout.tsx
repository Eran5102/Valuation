import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import QueryProvider from '@/providers/QueryProvider'
import { AuthProvider } from '@/contexts/AuthContext'
import { PermissionsProvider } from '@/contexts/PermissionsContext'
import { OrganizationProvider } from '@/contexts/OrganizationContext'
import { ThemeProvider } from '@/providers/ThemeProvider'
import { AppHeader } from '@/components/layout/AppHeader'
import { Toaster } from 'sonner'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Value8 - Valuation Platform',
  description: 'Complete platform for M&A, LBO, and company valuations with real-time market data',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <PermissionsProvider>
              <OrganizationProvider>
                <QueryProvider>
                  <AppHeader />
                  {children}
                </QueryProvider>
              </OrganizationProvider>
            </PermissionsProvider>
          </AuthProvider>
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  )
}
