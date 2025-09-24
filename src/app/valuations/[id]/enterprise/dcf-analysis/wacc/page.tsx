import { getWACCData } from './actions'
import { WACCCalculatorClient } from './client'

// Force dynamic rendering on Vercel
export const dynamic = 'force-dynamic'
export const revalidate = 0

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
