import { QualitativeAssessmentClient } from './client'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function QualitativeAssessmentPage({ params }: PageProps) {
  const { id } = await params

  return <QualitativeAssessmentClient valuationId={id} />
}
