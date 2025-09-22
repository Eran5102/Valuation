'use client'
// Billing and subscription management page

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import AppLayout from '@/components/layout/AppLayout'
import { useAuth } from '@/contexts/AuthContext'
import {
  CreditCard,
  Check,
  X,
  AlertCircle,
  TrendingUp,
  Users,
  FileText,
  Zap,
  Building2,
  Download,
  Calendar,
} from 'lucide-react'

interface PlanFeature {
  name: string
  starter: boolean | string
  professional: boolean | string
  enterprise: boolean | string
}

const plans = [
  {
    name: 'Starter',
    price: '$299',
    period: '/month',
    description: 'Perfect for small appraisal firms',
    features: [
      'Up to 5 valuations/month',
      'Basic 409A reports',
      '1 team member',
      'Email support',
      '30-day data retention',
    ],
  },
  {
    name: 'Professional',
    price: '$799',
    period: '/month',
    description: 'For growing appraisal practices',
    popular: true,
    features: [
      'Up to 20 valuations/month',
      'Advanced reports & templates',
      'Up to 5 team members',
      'Priority support',
      '1-year data retention',
      'API access',
      'Custom branding',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large organizations',
    features: [
      'Unlimited valuations',
      'Custom report templates',
      'Unlimited team members',
      'Dedicated support',
      'Unlimited data retention',
      'Advanced API access',
      'White-label options',
      'Training & onboarding',
      'SLA guarantee',
    ],
  },
]

const planComparison: PlanFeature[] = [
  { name: 'Valuations per month', starter: '5', professional: '20', enterprise: 'Unlimited' },
  { name: 'Team members', starter: '1', professional: '5', enterprise: 'Unlimited' },
  { name: 'Report templates', starter: 'Basic', professional: 'Advanced', enterprise: 'Custom' },
  { name: 'Data retention', starter: '30 days', professional: '1 year', enterprise: 'Unlimited' },
  { name: 'Support', starter: 'Email', professional: 'Priority', enterprise: 'Dedicated' },
  { name: 'API access', starter: false, professional: true, enterprise: true },
  { name: 'Custom branding', starter: false, professional: true, enterprise: true },
  { name: 'White-label', starter: false, professional: false, enterprise: true },
]

export default function BillingSettingsPage() {
  const router = useRouter()
  const { organization } = useAuth()
  const [loading, setLoading] = useState(false)
  const currentPlan = organization?.subscription_plan || 'starter'

  // Mock usage data
  const usage = {
    valuations: 3,
    valuationsLimit: 5,
    teamMembers: 1,
    teamLimit: 1,
    storage: 150, // MB
    storageLimit: 500, // MB
  }

  const handleUpgrade = (plan: string) => {
    setLoading(true)
    // In a real app, this would integrate with Stripe or another payment provider
    setTimeout(() => {
      setLoading(false)
      alert(`Upgrade to ${plan} plan - Payment integration coming soon!`)
    }, 1000)
  }

  return (
    <AppLayout>
      <div className="p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold">Billing & Plan</h1>
            <p className="text-muted-foreground">
              Manage your subscription and billing information
            </p>
          </div>

          {/* Current Plan */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Current Plan</CardTitle>
                  <CardDescription>You are currently on the {currentPlan} plan</CardDescription>
                </div>
                <Badge variant="default" className="px-3 py-1 text-lg">
                  {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    Valuations
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>
                        {usage.valuations} of {usage.valuationsLimit}
                      </span>
                      <span className="text-muted-foreground">
                        {Math.round((usage.valuations / usage.valuationsLimit) * 100)}%
                      </span>
                    </div>
                    <Progress value={(usage.valuations / usage.valuationsLimit) * 100} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    Team Members
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>
                        {usage.teamMembers} of {usage.teamLimit}
                      </span>
                      <span className="text-muted-foreground">
                        {Math.round((usage.teamMembers / usage.teamLimit) * 100)}%
                      </span>
                    </div>
                    <Progress value={(usage.teamMembers / usage.teamLimit) * 100} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    Storage
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>
                        {usage.storage} MB of {usage.storageLimit} MB
                      </span>
                      <span className="text-muted-foreground">
                        {Math.round((usage.storage / usage.storageLimit) * 100)}%
                      </span>
                    </div>
                    <Progress value={(usage.storage / usage.storageLimit) * 100} />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Your billing cycle resets on the 1st of each month
              </div>
            </CardContent>
          </Card>

          {/* Available Plans */}
          <div>
            <h2 className="mb-4 text-xl font-semibold">Available Plans</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {plans.map((plan) => (
                <Card
                  key={plan.name}
                  className={plan.popular ? 'relative border-primary shadow-lg' : ''}
                >
                  {plan.popular && <Badge className="absolute -top-2 right-4">Most Popular</Badge>}
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {plan.name.toLowerCase() !== currentPlan && (
                      <Button
                        className="w-full"
                        variant={plan.popular ? 'default' : 'outline'}
                        onClick={() => handleUpgrade(plan.name)}
                        disabled={loading}
                      >
                        {plan.name === 'Enterprise' ? 'Contact Sales' : `Upgrade to ${plan.name}`}
                      </Button>
                    )}

                    {plan.name.toLowerCase() === currentPlan && (
                      <Button className="w-full" variant="secondary" disabled>
                        Current Plan
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Plan Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Plan Comparison</CardTitle>
              <CardDescription>Compare features across all plans</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 text-left">Feature</th>
                      <th className="px-4 py-2 text-center">Starter</th>
                      <th className="px-4 py-2 text-center">Professional</th>
                      <th className="px-4 py-2 text-center">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody>
                    {planComparison.map((feature, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-3 text-sm font-medium">{feature.name}</td>
                        <td className="px-4 py-3 text-center">
                          {typeof feature.starter === 'boolean' ? (
                            feature.starter ? (
                              <Check className="mx-auto h-4 w-4 text-accent" />
                            ) : (
                              <X className="mx-auto h-4 w-4 text-muted-foreground" />
                            )
                          ) : (
                            <span className="text-sm">{feature.starter}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {typeof feature.professional === 'boolean' ? (
                            feature.professional ? (
                              <Check className="mx-auto h-4 w-4 text-accent" />
                            ) : (
                              <X className="mx-auto h-4 w-4 text-muted-foreground" />
                            )
                          ) : (
                            <span className="text-sm">{feature.professional}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {typeof feature.enterprise === 'boolean' ? (
                            feature.enterprise ? (
                              <Check className="mx-auto h-4 w-4 text-accent" />
                            ) : (
                              <X className="mx-auto h-4 w-4 text-muted-foreground" />
                            )
                          ) : (
                            <span className="text-sm">{feature.enterprise}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Billing History */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Billing History</CardTitle>
                  <CardDescription>View and download past invoices</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Download All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No billing history available. Invoices will appear here after your first payment.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Method
                </div>
              </CardTitle>
              <CardDescription>Manage your payment methods</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No payment method on file. Add a payment method to upgrade your plan.
                </AlertDescription>
              </Alert>

              <Button className="mt-4" variant="outline">
                <CreditCard className="mr-2 h-4 w-4" />
                Add Payment Method
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
