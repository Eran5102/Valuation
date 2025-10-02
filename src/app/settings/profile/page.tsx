'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import AppLayout from '@/components/layout/AppLayout'
import { useAuth } from '@/contexts/AuthContext'
import { User, Save, AlertCircle, CheckCircle } from 'lucide-react'

const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email(),
})

type ProfileFormData = z.infer<typeof profileSchema>

export default function ProfileSettingsPage() {
  const router = useRouter()
  const { user, refreshSession } = useAuth()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [currentData, setCurrentData] = useState<any>(null)

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
    },
  })

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

        form.reset({
          first_name: firstName,
          last_name: lastName,
          email: data.email || '',
        })
      }
    } catch (error) {
      // Error handling
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (data: ProfileFormData) => {
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: data.first_name,
          last_name: data.last_name,
        }),
      })

      const responseData = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully! Refreshing...' })

        // Refresh the session to get updated metadata
        await refreshSession()

        // Reload the page to reflect changes
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        setMessage({ type: 'error', text: responseData.error || 'Failed to update profile' })
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
            <p className="text-muted-foreground">Update your personal information</p>
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
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your first name"
                              disabled={loading}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="last_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your last name"
                              disabled={loading}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" disabled className="bg-muted" {...field} />
                        </FormControl>
                        <FormDescription>Email cannot be changed</FormDescription>
                      </FormItem>
                    )}
                  />

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
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
