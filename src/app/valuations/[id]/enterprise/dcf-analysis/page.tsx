import { getDCFData } from './actions'
import { DCFAnalysisClient } from './client'

// Force dynamic rendering on Vercel
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function DCFAnalysisPage({ params }: PageProps) {
  const { id } = await params
  const data = await getDCFData(id)

  return <DCFAnalysisClient valuationId={id} initialData={data} />
}
