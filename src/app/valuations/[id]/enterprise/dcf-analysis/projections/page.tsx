import { ProjectedFinancialsWrapper } from './wrapper'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ProjectedFinancialsPage({ params }: PageProps) {
  const { id } = await params

  return <ProjectedFinancialsWrapper valuationId={id} />
}
