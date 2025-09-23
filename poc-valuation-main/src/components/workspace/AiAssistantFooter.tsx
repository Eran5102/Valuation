import { useState } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Tooltip } from '@/components/ui/tooltip'
import { InfoTooltip } from '@/components/ui/info-tooltip'

export function AiAssistantFooter() {
  const [query, setQuery] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      toast.info('AI response processing (feature coming soon)', {
        description: 'ValuAI Assistant is currently in development',
      })
      setQuery('')
    }
  }

  return (
    <div className="bg-teal/5 sticky bottom-0 z-10 w-full border-t px-4 py-3 shadow-sm">
      <form onSubmit={handleSubmit} className="mx-auto flex max-w-6xl gap-2">
        <div className="relative flex-1">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask ValuAI Assistant..."
            className="focus-visible:ring-teal border-teal/20"
          />
          <div className="absolute right-3 top-[10px]">
            <InfoTooltip text="Ask questions about valuation concepts, methodologies, or how to use specific features" />
          </div>
        </div>
        <Button type="submit" className="bg-teal hover:bg-teal/90 text-teal-foreground">
          <Send size={18} />
          <span className="ml-1 hidden sm:inline">Send</span>
        </Button>
      </form>
    </div>
  )
}
