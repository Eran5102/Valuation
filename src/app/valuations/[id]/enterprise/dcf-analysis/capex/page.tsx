import { CapexDepreciationWrapper } from './wrapper'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function CapexDepreciationPage({ params }: PageProps) {
  const { id } = await params

  return <CapexDepreciationWrapper valuationId={id} />
}
