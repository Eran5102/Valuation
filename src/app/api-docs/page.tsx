'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { Loader2 } from 'lucide-react'
import './swagger-styles.css'

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <div className="flex items-center space-x-2">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span>Loading API documentation...</span>
      </div>
    </div>
  ),
})

export default function ApiDocsPage() {
  const [spec, setSpec] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Fetch the OpenAPI spec from our API endpoint
    fetch('/api/docs')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load API specification')
        return res.json()
      })
      .then((data) => {
        setSpec(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  return (
    <AppLayout>
      <div className="h-full overflow-auto bg-white">
        <div className="border-b bg-gray-50 px-6 py-4">
          <h1 className="text-2xl font-bold">API Documentation</h1>
          <p className="text-sm text-gray-600">
            Interactive API documentation powered by Swagger/OpenAPI
          </p>
        </div>

        <div className="swagger-wrapper p-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Loading API documentation...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="mx-auto max-w-2xl rounded-lg border border-red-300 bg-red-50 p-4">
              <h3 className="font-semibold text-red-800">Error loading documentation</h3>
              <p className="mt-1 text-sm text-red-600">{error}</p>
            </div>
          )}

          {spec && !loading && (
            <SwaggerUI
              spec={spec}
              docExpansion="list"
              defaultModelsExpandDepth={1}
              defaultModelExpandDepth={1}
              displayRequestDuration={true}
              filter={true}
              showExtensions={true}
              showCommonExtensions={true}
              tryItOutEnabled={true}
              persistAuthorization={true}
            />
          )}
        </div>
      </div>

      <style jsx global>{`
        .swagger-wrapper .swagger-ui {
          font-family: inherit;
        }

        .swagger-wrapper .swagger-ui .topbar {
          display: none;
        }

        .swagger-wrapper .swagger-ui .info {
          margin-bottom: 2rem;
        }

        .swagger-wrapper .swagger-ui .scheme-container {
          background-color: #f9fafb;
          padding: 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
        }

        .swagger-wrapper .swagger-ui .btn.authorize {
          background-color: #3b82f6;
          color: white;
          border: none;
        }

        .swagger-wrapper .swagger-ui .btn.authorize:hover {
          background-color: #2563eb;
        }

        .swagger-wrapper .swagger-ui .btn.execute {
          background-color: #3b82f6;
          color: white;
          border: none;
        }

        .swagger-wrapper .swagger-ui .btn.execute:hover {
          background-color: #2563eb;
        }

        .swagger-wrapper .swagger-ui .opblock.opblock-get .opblock-summary {
          border-color: #10b981;
          background-color: #10b98110;
        }

        .swagger-wrapper .swagger-ui .opblock.opblock-post .opblock-summary {
          border-color: #3b82f6;
          background-color: #3b82f610;
        }

        .swagger-wrapper .swagger-ui .opblock.opblock-put .opblock-summary {
          border-color: #f59e0b;
          background-color: #f59e0b10;
        }

        .swagger-wrapper .swagger-ui .opblock.opblock-delete .opblock-summary {
          border-color: #ef4444;
          background-color: #ef444410;
        }
      `}</style>
    </AppLayout>
  )
}
