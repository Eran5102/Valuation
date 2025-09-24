import { getScenarios, compareScenarios } from './actions'
import { getDCFData } from '../actions'
import { ScenarioManagerClient } from './client'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ScenarioManagerPage({ params }: PageProps) {
  const { id } = await params

  const [scenarios, dcfData] = await Promise.all([getScenarios(id), getDCFData(id)])

  return (
    <ScenarioManagerClient valuationId={id} initialScenarios={scenarios} currentDCFData={dcfData} />
  )
}
