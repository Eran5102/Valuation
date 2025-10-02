'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Mail,
  Lock,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Shield,
  Users,
  BarChart3,
  FileText,
  Zap,
  Award,
} from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const magicLinkSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type LoginFormData = z.infer<typeof loginSchema>
type MagicLinkFormData = z.infer<typeof magicLinkSchema>

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [authMode, setAuthMode] = useState<'password' | 'magic'>('password')

  // Get redirect URL from query params
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'

  // Password form
  const passwordForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // Magic link form
  const magicForm = useForm<MagicLinkFormData>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: {
      email: '',
    },
  })

  // Show message if redirected for authentication
  useEffect(() => {
    if (searchParams.get('redirectTo')) {
      setMessage('Please sign in to continue')
    }
  }, [searchParams])

  const handleEmailLogin = async (data: LoginFormData) => {
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const supabase = createClient()
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      if (authData.user) {
        // Redirect to intended destination or dashboard
        router.push(redirectTo)
      }
    } catch (err) {
      console.error('Login error:', err)
      setError(
        'Failed to connect to authentication service. Please check your internet connection and try again.'
      )
      setLoading(false)
    }
  }

  const handleMagicLink = async (data: MagicLinkFormData) => {
    setLoading(true)
    setError(null)
    setMessage(null)

    const supabase = createClient()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin

    // Include redirect parameter in callback URL
    const callbackUrl = new URL('/auth/callback', baseUrl)
    if (redirectTo !== '/dashboard') {
      callbackUrl.searchParams.set('next', redirectTo)
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: data.email,
      options: {
        emailRedirectTo: callbackUrl.toString(),
        data: {
          redirect_to: redirectTo,
        },
      },
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setMessage(
      `Magic link sent to ${data.email}! Check your inbox and click the link to sign in. The link will automatically log you in and take you to your dashboard.`
    )
  }

  const features = [
    {
      icon: Shield,
      title: 'M&A & LBO Modeling',
      description: 'Full suite for deal analysis, LBO returns, and exit multiples',
    },
    {
      icon: BarChart3,
      title: 'Company Valuations',
      description: 'DCF, comps, precedent transactions with live market data',
    },
    {
      icon: Zap,
      title: '409A Specialization',
      description: 'Automated breakpoints, waterfall analysis, and PWERM scenarios',
    },
    {
      icon: FileText,
      title: 'Real-Time Data APIs',
      description: 'Bloomberg, S&P Capital IQ, PitchBook integrations',
    },
    {
      icon: Users,
      title: 'Transaction Analysis',
      description: 'Fairness opinions, purchase price allocations, earnout modeling',
    },
    {
      icon: Award,
      title: 'Private Equity Ready',
      description: 'Portfolio company valuations, fund NAV, and carry waterfalls',
    },
  ]

  return (
    <div className="flex min-h-screen">
      {/* Left side - Platform info (60%) */}
      <div className="from-primary/10 via-primary/5 hidden flex-col justify-between bg-gradient-to-br to-background p-12 lg:flex lg:w-3/5">
        <div>
          {/* Logo and Brand */}
          <div className="mb-12 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg">
              <TrendingUp className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Value8</h1>
              <p className="text-sm text-muted-foreground">Valuation Platform</p>
            </div>
          </div>

          {/* Main heading */}
          <div className="max-w-xl">
            <h2 className="mb-4 text-4xl font-bold tracking-tight">
              Complete Platform for M&A, LBO, and Company Valuations
            </h2>
            <p className="mb-12 text-lg text-muted-foreground">
              From leveraged buyouts to 409A compliance, access institutional-grade modeling with
              real-time market data. Build complex LBO models, run M&A scenarios, perform company
              valuations, and calculate equity waterfalls - all powered by live API feeds from
              Bloomberg, S&P, and PitchBook.
            </p>
          </div>

          {/* Features grid */}
          <div className="grid max-w-2xl grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="mb-1 font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom testimonial or stats */}
        <div className="bg-background/50 mt-12 rounded-xl border p-6 backdrop-blur">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="mb-2 text-sm italic text-muted-foreground">
                "The real-time market data integration is game-changing. Our 409A valuations now
                include live peer multiples and automated waterfall analysis that updates with each
                financing round. What used to take days now takes hours."
              </p>
              <p className="text-sm font-semibold">
                — Michael Torres, Partner at Global Valuation Partners
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form (40%) */}
      <div className="flex w-full items-center justify-center bg-background p-8 lg:w-2/5">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile logo (shown only on mobile) */}
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary shadow-lg">
              <TrendingUp className="h-9 w-9 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Value8 Valuation Platform</h1>
            <p className="mt-2 text-sm text-muted-foreground">Professional valuation management</p>
          </div>

          {/* Login Card */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription>Enter your credentials to access your dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              {authMode === 'password' ? (
                <Form {...passwordForm}>
                  <form
                    onSubmit={passwordForm.handleSubmit(handleEmailLogin)}
                    className="space-y-4"
                  >
                    {/* Email Field */}
                    <FormField
                      control={passwordForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="email"
                                placeholder="you@company.com"
                                className="pl-10"
                                disabled={loading}
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Password Field */}
                    <FormField
                      control={passwordForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel>Password</FormLabel>
                            <Link
                              href="/auth/reset-password"
                              className="text-xs text-muted-foreground transition-colors hover:text-primary"
                            >
                              Forgot password?
                            </Link>
                          </div>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="password"
                                placeholder="••••••••"
                                className="pl-10"
                                disabled={loading}
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Error/Success Messages */}
                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    {message && (
                      <Alert>
                        <Mail className="h-4 w-4" />
                        <AlertDescription>{message}</AlertDescription>
                      </Alert>
                    )}

                    {/* Sign In Button */}
                    <Button type="submit" className="w-full" size="lg" disabled={loading}>
                      {loading ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Signing in...
                        </>
                      ) : (
                        <>
                          Sign in with Password
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              ) : (
                <Form {...magicForm}>
                  <form onSubmit={magicForm.handleSubmit(handleMagicLink)} className="space-y-4">
                    {/* Email Field */}
                    <FormField
                      control={magicForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="email"
                                placeholder="you@company.com"
                                className="pl-10"
                                disabled={loading}
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Error/Success Messages */}
                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    {message && (
                      <Alert>
                        <Mail className="h-4 w-4" />
                        <AlertDescription>{message}</AlertDescription>
                      </Alert>
                    )}

                    {/* Send Magic Link Button */}
                    <Button
                      type="submit"
                      className="w-full"
                      size="lg"
                      disabled={loading || message !== null}
                    >
                      {loading ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Sending magic link...
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Magic Link
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              )}

              {/* Divider */}
              <div className="my-6 flex items-center">
                <Separator className="flex-1" />
                <span className="mx-4 text-xs text-muted-foreground">OR</span>
                <Separator className="flex-1" />
              </div>

              {/* Toggle Auth Mode */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setAuthMode(authMode === 'password' ? 'magic' : 'password')
                  setError(null)
                  setMessage(null)
                }}
                disabled={loading}
                type="button"
              >
                {authMode === 'password' ? (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Use magic link instead
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Use password instead
                  </>
                )}
              </Button>

              {/* Sign Up Link */}
              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">Don't have an account? </span>
                <Link href="/auth/signup" className="font-medium text-primary hover:underline">
                  Create account
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Footer links */}
          <div className="text-center text-xs text-muted-foreground">
            <Link href="/privacy" className="transition-colors hover:text-primary">
              Privacy Policy
            </Link>
            <span className="mx-2">·</span>
            <Link href="/terms" className="transition-colors hover:text-primary">
              Terms of Service
            </Link>
            <span className="mx-2">·</span>
            <Link href="/contact" className="transition-colors hover:text-primary">
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
