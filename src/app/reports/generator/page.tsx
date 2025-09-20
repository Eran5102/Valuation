import { EnhancedReportGenerator } from '@/components/reports/EnhancedReportGenerator'
import AppLayout from '@/components/layout/AppLayout'

interface ReportGeneratorPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ReportGeneratorPage({ searchParams }: ReportGeneratorPageProps) {
  const params = await searchParams
  const selectedValuation = params.selectedValuation
    ? parseInt(params.selectedValuation as string)
    : undefined
  const valuationId = params.valuationId ? parseInt(params.valuationId as string) : undefined
  const templateId = params.templateId as string

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        <EnhancedReportGenerator
          preselectedValuationId={selectedValuation || valuationId}
          templateId={templateId}
          valuationId={valuationId}
        />
      </div>
    </AppLayout>
  )
}
