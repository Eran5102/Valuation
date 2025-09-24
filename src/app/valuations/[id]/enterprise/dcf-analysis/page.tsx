import { getDCFData } from './actions'
import { DCFAnalysisClient } from './client'

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
