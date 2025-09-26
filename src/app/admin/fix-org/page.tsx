'use client'

import React, { useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Wrench, Check, X } from 'lucide-react'
import { usePermissions } from '@/contexts/PermissionsContext'

export default function FixOrganizationPage() {
  // Removed super admin check - any logged in user can fix their own organization
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const fixOrganization = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/admin/fix-organization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fix organization')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout>
      <div className="container max-w-2xl space-y-6 p-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Fix Organization Ownership</h1>
          <p className="mt-2 text-muted-foreground">
            Link Bridgeland Advisors to your user account as owner
          </p>
        </div>

        {/* Action Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Fix Bridgeland Advisors Organization
            </CardTitle>
            <CardDescription>
              This will set your user ID as the owner of Bridgeland Advisors organization and add
              you to the member list.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm">This action will:</p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>• Set your user ID as owner_id</li>
                <li>• Add your user ID to member_ids array</li>
                <li>• Make the organization appear in your selector</li>
              </ul>
            </div>

            <Button onClick={fixOrganization} disabled={loading} className="w-full">
              {loading ? 'Fixing...' : 'Fix Organization Ownership'}
            </Button>

            {/* Result Display */}
            {result && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-green-900">Success!</p>
                    <p className="mt-1 text-sm text-green-800">{result.message}</p>
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-green-700">
                        Organization: {result.organization?.name}
                      </p>
                      <p className="text-xs text-green-700">
                        Owner ID: {result.organization?.owner_id}
                      </p>
                      <p className="text-xs text-green-700">Your Email: {result.user?.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-2">
                  <X className="h-5 w-5 text-red-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-red-900">Error</p>
                    <p className="mt-1 text-sm text-red-800">{error}</p>
                    <p className="mt-2 text-xs text-red-700">Check browser console for details</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
