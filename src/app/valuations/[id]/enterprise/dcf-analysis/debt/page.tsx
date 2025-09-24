import { DebtScheduleWrapper } from './wrapper'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function DebtSchedulePage({ params }: PageProps) {
  const { id } = await params

  return <DebtScheduleWrapper valuationId={id} />
}
