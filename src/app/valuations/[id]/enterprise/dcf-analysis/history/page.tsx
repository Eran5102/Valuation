import { ProjectHistoryClient } from './client'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ProjectHistoryPage({ params }: PageProps) {
  const { id } = await params

  return <ProjectHistoryClient valuationId={id} />
}
