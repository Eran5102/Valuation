import { ListTree, Save, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { Card } from '@/components/ui/card'
import { useParams } from 'react-router-dom'
import { useMethodology } from '@/contexts/MethodologyContext'
import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import { WorkspaceHeaderLayout } from '@/components/layout/WorkspaceHeaderLayout'

export default function MethodologyScope() {
  const { projectId } = useParams()
  const { toast } = useToast()
  const { methodologies, updateMethodologies } = useMethodology()
  const [localMethodologies, setLocalMethodologies] = useState(methodologies)
  const [hasSelectedMethods, setHasSelectedMethods] = useState(false)

  // Always sync with the latest methodologies from context
  useEffect(() => {
    // Create a deep copy to prevent reference issues
    setLocalMethodologies(JSON.parse(JSON.stringify(methodologies)))
    console.log('Methodologies in MethodologyScope:', methodologies)

    // Check if any methodology is selected
    const hasSelected = methodologies.some((group) =>
      group.methods.some((method) => method.enabled)
    )
    setHasSelectedMethods(hasSelected)
  }, [methodologies])

  const handleMethodToggle = (groupIndex: number, methodIndex: number) => {
    const newMethodologies = JSON.parse(JSON.stringify(localMethodologies))
    newMethodologies[groupIndex].methods[methodIndex].enabled =
      !newMethodologies[groupIndex].methods[methodIndex].enabled
    setLocalMethodologies(newMethodologies)

    // Update the hasSelectedMethods state
    const hasSelected = newMethodologies.some((group) =>
      group.methods.some((method) => method.enabled)
    )
    setHasSelectedMethods(hasSelected)
  }

  const handleSave = () => {
    updateMethodologies(localMethodologies)
    toast({
      title: 'Methodology scope updated',
      description:
        'Your selected valuation methods have been saved and will appear in the sidebar.',
    })
  }

  return (
    <WorkspaceHeaderLayout
      title="Methodology Scope & Selection"
      icon={<ListTree className="h-6 w-6" />}
      description="Select valuation methodologies and analyses for this specific project"
      fullWidth
      hideCollaboration
    >
      <div className="w-full">
        <div className="px-4 pb-4">
          <div className="mb-2 flex items-center gap-2">
            <p className="mb-2 text-muted-foreground">
              Configure which valuation approaches and methodologies will be applied to this
              project. Selected methods will appear in the navigation sidebar and influence the
              final valuation synthesis.
            </p>
            <InfoTooltip
              text="Select at least one valuation approach to enable it in the sidebar navigation."
              iconClassName="h-5 w-5 text-accent"
            />
          </div>

          {!hasSelectedMethods && (
            <Alert className="mb-6 border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertTitle className="text-amber-700">No methods selected</AlertTitle>
              <AlertDescription className="text-amber-600">
                Please select at least one valuation method to enable it in the workspace
                navigation.
              </AlertDescription>
            </Alert>
          )}

          {localMethodologies.map((group, groupIndex) => (
            <Card key={group.name} className="mb-4 p-6">
              <h2 className="mb-4 text-lg font-semibold">{group.name}</h2>
              <div className="space-y-4">
                {group.methods.map((method, methodIndex) => (
                  <div key={method.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={`${method.id}-${groupIndex}-${methodIndex}`}
                      checked={method.enabled}
                      onCheckedChange={() => handleMethodToggle(groupIndex, methodIndex)}
                      disabled={!method.implemented}
                      className={method.implemented ? '' : 'opacity-50'}
                    />
                    <label
                      htmlFor={`${method.id}-${groupIndex}-${methodIndex}`}
                      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed ${!method.implemented ? 'text-muted-foreground' : ''}`}
                    >
                      {method.name}
                      {!method.implemented && (
                        <span className="ml-2 text-xs text-muted-foreground">(Coming Soon)</span>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        <div className="px-4 pb-6">
          <Button onClick={handleSave} size="lg" className="w-full sm:w-auto">
            <Save className="mr-2 h-4 w-4" />
            Save Scope Selections
          </Button>
        </div>
      </div>
    </WorkspaceHeaderLayout>
  )
}
