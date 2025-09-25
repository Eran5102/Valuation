import { DCFAssumptionsClient } from './client'

interface DCFAssumptionsPageProps {
  params: Promise<{ id: string }>
}

export default async function DCFAssumptionsPage({ params }: DCFAssumptionsPageProps) {
  const { id } = await params

  return <DCFAssumptionsClient valuationId={id} />
}
