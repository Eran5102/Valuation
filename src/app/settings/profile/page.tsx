'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import AppLayout from '@/components/layout/AppLayout'
import { useAuth } from '@/contexts/AuthContext'
import { User, Building2, Save, AlertCircle, CheckCircle } from 'lucide-react'

export default function ProfileSettingsPage() {
  const router = useRouter()
  const { user, refreshSession } = useAuth()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    organization_name: '',
    organization_type: 'appraisal_firm',
    email: '',
  })

  const [currentData, setCurrentData] = useState<any>(null)

  useEffect(() => {
    fetchCurrentProfile()
  }, [])

  const fetchCurrentProfile = async () => {
    try {
      const response = await fetch('/api/auth/update-profile')
      if (response.ok) {
        const data = await response.json()
        setCurrentData(data)

        // Set form data from current user metadata
        // Handle both individual fields and full_name
        let firstName = data.user_metadata?.first_name || ''
        let lastName = data.user_metadata?.last_name || ''

        // If no individual fields but have full_name, split it
        if (!firstName && data.user_metadata?.full_name) {
          const nameParts = data.user_metadata.full_name.split(' ')
          firstName = nameParts[0] || ''
          lastName = nameParts.slice(1).join(' ') || ''
        }

        // Try to infer organization from email domain if not set
        let orgName = data.user_metadata?.organization_name || ''
        if (!orgName && data.email && data.email.includes('@bridgeland-advisors.com')) {
          orgName = 'Bridgeland Advisors'
        }

        setFormData({
          first_name: firstName,
          last_name: lastName,
          organization_name: orgName,
          organization_type: data.user_metadata?.organization_type || 'appraisal_firm',
          email: data.email || '',
        })
      }
    } catch (error) {
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully! Refreshing...' })

        // Refresh the session to get updated metadata
        await refreshSession()

        // Reload the page to reflect changes
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update profile' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while updating your profile' })
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="mx-auto max-w-2xl">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">Loading profile...</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold">Profile Settings</h1>
            <p className="text-muted-foreground">
              Update your personal and organization information
            </p>
          </div>

          {/* Debug Info Card */}
          {currentData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Current Stored Data (Debug)</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-auto rounded bg-muted p-3 text-xs">
                  {JSON.stringify(currentData, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Profile Form */}
          <Card>
            <CardHeader>
              <CardTitle>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </div>
              </CardTitle>
              <CardDescription>
                Update your personal details and organization information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      placeholder="Enter your first name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      placeholder="Enter your last name"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>

                <div className="border-t pt-4">
                  <h3 className="mb-3 flex items-center gap-2 font-medium">
                    <Building2 className="h-4 w-4" />
                    Organization Details
                  </h3>

                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="organization_name">Organization Name</Label>
                      <Input
                        id="organization_name"
                        value={formData.organization_name}
                        onChange={(e) =>
                          setFormData({ ...formData, organization_name: e.target.value })
                        }
                        placeholder="Enter your organization name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="organization_type">Organization Type</Label>
                      <Select
                        value={formData.organization_type}
                        onValueChange={(value) =>
                          setFormData({ ...formData, organization_type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="appraisal_firm">Appraisal Firm</SelectItem>
                          <SelectItem value="consulting_firm">Consulting Firm</SelectItem>
                          <SelectItem value="accounting_firm">Accounting Firm</SelectItem>
                          <SelectItem value="law_firm">Law Firm</SelectItem>
                          <SelectItem value="investment_bank">Investment Bank</SelectItem>
                          <SelectItem value="corporation">Corporation</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {message && (
                  <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                    {message.type === 'error' ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    <AlertDescription>{message.text}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      'Updating...'
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
