import { getWACCData } from './actions'
import { WACCCalculatorClient } from './client'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function WACCCalculatorPage({ params }: PageProps) {
  const { id } = await params
  const data = await getWACCData(id)

  return <WACCCalculatorClient valuationId={id} initialData={data} />
}
