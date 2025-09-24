import { WorkingCapitalWrapper } from './wrapper'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function WorkingCapitalPage({ params }: PageProps) {
  const { id } = await params

  return <WorkingCapitalWrapper valuationId={id} />
}
