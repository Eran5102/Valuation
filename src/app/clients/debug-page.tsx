'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function DebugClientsPage() {
  const { user } = useAuth()
  const [apiResponse, setApiResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDebugData = async () => {
      try {
        // Fetch from the API with cache busting
        const response = await fetch(`/api/companies?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        })

        const text = await response.text()
        let data
        try {
          data = JSON.parse(text)
        } catch {
          data = { raw: text }
        }

        setApiResponse({
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          data: data,
        })
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchDebugData()
  }, [])

  if (loading) return <div className="p-6">Loading debug info...</div>

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">Client Debug Page</h1>

      <div className="rounded bg-gray-100 p-4">
        <h2 className="mb-2 font-bold">Current User:</h2>
        <pre className="text-xs">{JSON.stringify(user, null, 2)}</pre>
      </div>

      <div className="rounded bg-gray-100 p-4">
        <h2 className="mb-2 font-bold">API Response:</h2>
        {error ? (
          <div className="text-red-500">Error: {error}</div>
        ) : (
          <div>
            <div>
              Status: {apiResponse?.status} {apiResponse?.statusText}
            </div>
            <div>Data:</div>
            <pre className="max-h-96 overflow-auto text-xs">
              {JSON.stringify(apiResponse?.data, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div className="rounded bg-gray-100 p-4">
        <h2 className="mb-2 font-bold">Companies Found:</h2>
        {apiResponse?.data?.data ? (
          <ul>
            {apiResponse.data.data.map((company: any) => (
              <li key={company.id} className="py-1">
                • {company.name} (Created: {new Date(company.created_at).toLocaleDateString()})
                {company.organization_id && (
                  <span className="ml-2 text-xs">(Org: {company.organization_id})</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div>No companies in response</div>
        )}
      </div>

      <div className="rounded bg-yellow-100 p-4">
        <h2 className="mb-2 font-bold">Troubleshooting:</h2>
        <ol className="list-inside list-decimal space-y-1">
          <li>Check if companies array has data</li>
          <li>Verify your user ID matches super admin in database</li>
          <li>Confirm API is checking correct table (user_profiles not profiles)</li>
          <li>Hard refresh the page (Ctrl+Shift+R)</li>
          <li>Clear browser cache and cookies</li>
        </ol>
      </div>
    </div>
  )
}
