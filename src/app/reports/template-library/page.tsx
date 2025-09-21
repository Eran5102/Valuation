import { Suspense } from 'react'
import TemplateLibraryClient from './template-library-client'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function TemplateLibraryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <TemplateLibraryClient />
    </Suspense>
  )
}
