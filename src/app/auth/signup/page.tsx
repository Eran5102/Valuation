'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Mail,
  Lock,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  User,
  Building2,
  CheckCircle,
  Rocket,
  Globe,
  LineChart,
  Shield,
  Clock,
  DollarSign,
} from 'lucide-react'

const step1Schema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

const step2Schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  organizationName: z.string().min(1, 'Organization name is required'),
  organizationType: z.string(),
  phone: z.string().optional(),
})

type Step1FormData = z.infer<typeof step1Schema>
type Step2FormData = z.infer<typeof step2Schema>

export default function SignUpPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const step1Form = useForm<Step1FormData>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const step2Form = useForm<Step2FormData>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      organizationName: '',
      organizationType: 'firm',
      phone: '',
    },
  })

  const handleNextStep = async () => {
    setError(null)
    const isValid = await step1Form.trigger()
    if (isValid) {
      setStep(2)
    }
  }

  const handleSignUp = async (data: Step2FormData) => {
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const step1Data = step1Form.getValues()

      // Sign up the user
      const redirectUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: step1Data.email,
        password: step1Data.password,
        options: {
          emailRedirectTo: `${redirectUrl}/auth/callback`,
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            organization_name: data.organizationName,
            organization_type: data.organizationType,
            phone: data.phone,
          },
        },
      })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      if (authData.user) {
        setSuccess(true)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const benefits = [
    {
      icon: Rocket,
      title: 'LBO & Buyout Models',
      description: 'IRR analysis, debt schedules, and management rollover scenarios',
    },
    {
      icon: Globe,
      title: 'M&A Deal Structuring',
      description: 'Merger models, synergies, accretion/dilution analysis',
    },
    {
      icon: LineChart,
      title: 'Company Valuations',
      description: 'Full DCF builds with automatic comps from API data',
    },
    {
      icon: Shield,
      title: '409A & Equity Comp',
      description: 'Breakpoints, waterfalls, PWERM, and Black-Scholes models',
    },
    {
      icon: Clock,
      title: 'Live Market Intelligence',
      description: 'Real-time feeds from 15+ financial data providers',
    },
    {
      icon: DollarSign,
      title: 'PE Portfolio Tools',
      description: 'Roll-up strategies, add-on acquisitions, exit planning',
    },
  ]

  if (success) {
    const email = step1Form.getValues('email')
    return (
      <div className="flex min-h-screen">
        <div className="flex w-full items-center justify-center p-8">
          <Card className="w-full max-w-md border-0 shadow-xl">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="mt-4 text-2xl font-bold">Check your email</h2>
                <p className="mt-2 text-muted-foreground">
                  We've sent a confirmation link to {email}
                </p>
                <p className="mt-4 text-sm text-muted-foreground">
                  Click the link in the email to verify your account and get started.
                </p>
                <Button className="mt-6" onClick={() => router.push('/auth/login')}>
                  Go to login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side - Platform benefits (60%) */}
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
              Investment Banking-Grade Tools for Every Deal Type
            </h2>
            <p className="mb-12 text-lg text-muted-foreground">
              Build LBO models with debt waterfalls. Structure M&A deals with synergy analysis.
              Value companies with live comps. Calculate 409A with automated breakpoints. All in one
              platform with real-time data from Bloomberg, Capital IQ, and PitchBook. The choice of
              PE funds, investment banks, and Big 4 advisory teams.
            </p>
          </div>

          {/* Benefits grid */}
          <div className="grid max-w-2xl grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                    <benefit.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="mb-1 font-semibold">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom stats */}
        <div className="bg-background/50 mt-12 grid max-w-2xl grid-cols-3 gap-6 rounded-xl border p-6 backdrop-blur">
          <div>
            <p className="text-3xl font-bold text-primary">$2.5T+</p>
            <p className="text-sm text-muted-foreground">Assets Valued</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-primary">50M+</p>
            <p className="text-sm text-muted-foreground">Data Points/Day</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-primary">15+</p>
            <p className="text-sm text-muted-foreground">API Integrations</p>
          </div>
        </div>
      </div>

      {/* Right side - Sign up form (40%) */}
      <div className="flex w-full items-center justify-center bg-background p-8 lg:w-2/5">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile logo (shown only on mobile) */}
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary shadow-lg">
              <TrendingUp className="h-9 w-9 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Value8 Valuation Platform</h1>
            <p className="mt-2 text-sm text-muted-foreground">Start your free trial today</p>
          </div>

          {/* Progress Indicator */}
          <div className="flex justify-center space-x-2">
            <div
              className={`h-2 w-24 rounded-full ${
                step >= 1 ? 'bg-primary' : 'bg-muted'
              } transition-colors`}
            />
            <div
              className={`h-2 w-24 rounded-full ${
                step >= 2 ? 'bg-primary' : 'bg-muted'
              } transition-colors`}
            />
          </div>

          {/* Sign Up Card */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">
                {step === 1 ? 'Create your account' : 'Complete your profile'}
              </CardTitle>
              <CardDescription>
                {step === 1
                  ? 'Start with your email and password'
                  : 'Tell us about you and your organization'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {step === 1 ? (
                <Form {...step1Form}>
                  <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                    <FormField
                      control={step1Form.control}
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

                    <FormField
                      control={step1Form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="password"
                                placeholder="At least 6 characters"
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

                    <FormField
                      control={step1Form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="password"
                                placeholder="Re-enter your password"
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

                    {/* Error Messages */}
                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <Button
                      type="button"
                      onClick={handleNextStep}
                      disabled={loading}
                      className="w-full"
                      size="lg"
                    >
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                </Form>
              ) : (
                <Form {...step2Form}>
                  <form onSubmit={step2Form.handleSubmit(handleSignUp)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={step2Form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="John"
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
                      <FormField
                        control={step2Form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" disabled={loading} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={step2Form.control}
                      name="organizationName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Your firm or company name"
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

                    <FormField
                      control={step2Form.control}
                      name="organizationType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={loading}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="firm">Appraisal Firm</SelectItem>
                              <SelectItem value="independent">Independent Appraiser</SelectItem>
                              <SelectItem value="accounting">Accounting Firm</SelectItem>
                              <SelectItem value="consulting">Consulting Firm</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={step2Form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder="+1 (555) 123-4567"
                              disabled={loading}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* Error Messages */}
                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep(1)}
                        disabled={loading}
                        className="flex-1"
                      >
                        Back
                      </Button>
                      <Button type="submit" disabled={loading} className="flex-1" size="lg">
                        {loading ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Creating account...
                          </>
                        ) : (
                          'Start free trial'
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}

              {/* Sign In Link */}
              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">Already have an account? </span>
                <Link href="/auth/login" className="font-medium text-primary hover:underline">
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Terms Notice */}
          <p className="text-center text-xs text-muted-foreground">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="transition-colors hover:text-primary">
              Terms of Service
            </Link>
            {' and '}
            <Link href="/privacy" className="transition-colors hover:text-primary">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
