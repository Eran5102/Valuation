import { Button } from '@/components/ui/button'
import { ArrowLeft, ChartBar } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader } from '@/components/layout/PageHeader'
import { CommentsButton } from '@/components/collaboration/CommentsButton'
import { ShareButton } from '@/components/collaboration/ShareButton'

interface DCFHeaderProps {
  activeScenarioName: string
}

export function DCFHeader({ activeScenarioName }: DCFHeaderProps) {
  const navigate = useNavigate()

  const handleNavigateToScenarioManager = () => {
    navigate('/workspace/1/scenarios')
    toast.info('Navigating to Scenario Manager')
  }

  return (
    <div className="w-full">
      <PageHeader
        title="Discounted Cash Flow (DCF) Analysis"
        icon={<ChartBar className="text-teal h-5 w-5" />}
        description="Enterprise valuation based on projected future cash flows"
      >
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <div className="bg-teal/10 rounded-md px-3 py-1">
            <span className="text-teal font-medium">Active Scenario:</span>{' '}
            <span className="font-bold">{activeScenarioName}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleNavigateToScenarioManager}
              className="flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Scenario Manager
            </Button>

            {/* Comments button */}
            <CommentsButton size="sm" />

            {/* Share button */}
            <ShareButton size="sm" />
          </div>
        </div>
      </PageHeader>
    </div>
  )
}
