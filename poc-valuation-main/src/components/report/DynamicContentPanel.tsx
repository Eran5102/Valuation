import React, { useState } from 'react'
import { Search, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { FormatOptions, LogoOptions } from './DynamicContentFormatting'
import { ThemeBranding } from './ReportSettings'

export interface DynamicContentItem {
  id: string
  name: string
  category: string
  description?: string
  type: 'chart' | 'table' | 'value' | 'text'
  format?: {
    type?: 'currency' | 'percent' | 'decimal' | 'multiple'
    decimals?: number
    unitMultiplier?: number
  }
}

interface DynamicContentPanelProps {
  onInsert: (item: DynamicContentItem) => void
  projectId: string
  isOpen?: boolean
  onClose?: () => void
}

// Content categories and items
const DYNAMIC_CONTENT: DynamicContentItem[] = [
  // Key Results
  {
    id: 'final-weighted-equity-value',
    name: 'Final Weighted Equity Value',
    category: 'Key Results',
    type: 'value',
    format: { type: 'currency', unitMultiplier: 1000000 },
  },
  {
    id: 'final-price-per-share',
    name: 'Final Price Per Share',
    category: 'Key Results',
    type: 'value',
    format: { type: 'currency', decimals: 2 },
  },
  {
    id: 'final-weighted-ev',
    name: 'Final Weighted Enterprise Value',
    category: 'Key Results',
    type: 'value',
    format: { type: 'currency', unitMultiplier: 1000000 },
  },

  // WACC Components
  {
    id: 'calculated-wacc',
    name: 'Calculated WACC',
    category: 'WACC Components',
    type: 'value',
    format: { type: 'percent', decimals: 2 },
  },
  {
    id: 'cost-of-equity',
    name: 'Cost of Equity',
    category: 'WACC Components',
    type: 'value',
    format: { type: 'percent', decimals: 2 },
  },
  {
    id: 'after-tax-cost-of-debt',
    name: 'After-Tax Cost of Debt',
    category: 'WACC Components',
    type: 'value',
    format: { type: 'percent', decimals: 2 },
  },
  {
    id: 'relevered-beta',
    name: 'Relevered Beta',
    category: 'WACC Components',
    type: 'value',
    format: { type: 'decimal', decimals: 2 },
  },
  {
    id: 'qualitative-risk-premium',
    name: 'Qualitative Risk Premium',
    category: 'WACC Components',
    type: 'value',
    format: { type: 'percent', decimals: 2 },
  },

  // DCF Outputs
  {
    id: 'dcf-implied-ev',
    name: 'DCF Implied Enterprise Value',
    category: 'DCF Outputs',
    type: 'value',
    format: { type: 'currency', unitMultiplier: 1000000 },
  },
  {
    id: 'terminal-value',
    name: 'Terminal Value',
    category: 'DCF Outputs',
    type: 'value',
    format: { type: 'currency', unitMultiplier: 1000000 },
  },
  {
    id: 'terminal-growth-rate',
    name: 'Terminal Growth Rate',
    category: 'DCF Outputs',
    type: 'value',
    format: { type: 'percent', decimals: 2 },
  },
  {
    id: 'exit-multiple-used',
    name: 'Exit Multiple Used',
    category: 'DCF Outputs',
    type: 'value',
    format: { type: 'multiple', decimals: 1 },
  },

  // Market Approach Metrics
  {
    id: 'cca-median-ev-ebitda',
    name: 'CCA Median EV/EBITDA',
    category: 'Market Approach Metrics',
    type: 'value',
    format: { type: 'multiple', decimals: 1 },
  },
  {
    id: 'pta-median-ev-revenue',
    name: 'PTA Median EV/Revenue',
    category: 'Market Approach Metrics',
    type: 'value',
    format: { type: 'multiple', decimals: 1 },
  },
  {
    id: 'selected-cca-metric-value',
    name: 'Selected CCA Metric Value',
    category: 'Market Approach Metrics',
    type: 'value',
    format: { type: 'currency', unitMultiplier: 1000000 },
  },
  {
    id: 'selected-pta-metric-value',
    name: 'Selected PTA Metric Value',
    category: 'Market Approach Metrics',
    type: 'value',
    format: { type: 'currency', unitMultiplier: 1000000 },
  },

  // Scenario Data
  {
    id: 'active-scenario-name',
    name: 'Active Scenario Name',
    category: 'Scenario Data',
    type: 'value',
  },
  {
    id: 'active-scenario-summary',
    name: 'Active Scenario Summary',
    category: 'Scenario Data',
    type: 'table',
  },

  // Project & Company Info
  { id: 'company-name', name: 'Company Name', category: 'Project & Company Info', type: 'value' },
  {
    id: 'valuation-date',
    name: 'Valuation Date',
    category: 'Project & Company Info',
    type: 'value',
  },
  { id: 'client-name', name: 'Client Name', category: 'Project & Company Info', type: 'value' },
  {
    id: 'purpose-of-valuation',
    name: 'Purpose of Valuation',
    category: 'Project & Company Info',
    type: 'value',
  },

  // Key Assumptions
  {
    id: 'wacc-rate',
    name: 'Discount Rate (WACC)',
    category: 'Key Assumptions',
    type: 'value',
    format: { type: 'percent', decimals: 2 },
  },
  {
    id: 'terminal-growth-rate-assumption',
    name: 'Terminal Growth Rate',
    category: 'Key Assumptions',
    type: 'value',
    format: { type: 'percent', decimals: 2 },
  },
  {
    id: 'exit-multiple',
    name: 'Exit Multiple',
    category: 'Key Assumptions',
    type: 'value',
    format: { type: 'multiple', decimals: 1 },
  },

  // Valuation Summaries
  {
    id: 'valuation-results-table',
    name: 'Valuation Results Table',
    category: 'Valuation Summaries',
    type: 'table',
  },
  {
    id: 'equity-value-range',
    name: 'Equity Value Range',
    category: 'Valuation Summaries',
    type: 'value',
    format: { type: 'currency', unitMultiplier: 1000000 },
  },
  {
    id: 'price-per-share',
    name: 'Price Per Share',
    category: 'Valuation Summaries',
    type: 'value',
    format: { type: 'currency', decimals: 2 },
  },

  // Charts
  {
    id: 'football-field-chart',
    name: 'Football Field Chart',
    category: 'Charts',
    type: 'chart',
    description: 'Comparative valuation ranges across methodologies',
  },
  {
    id: 'tornado-chart',
    name: 'Sensitivity Tornado Chart',
    category: 'Charts',
    type: 'chart',
    description: 'DCF sensitivity analysis visualization',
  },
  {
    id: 'scenario-comparison-chart',
    name: 'Scenario Comparison Chart',
    category: 'Charts',
    type: 'chart',
    description: 'Comparison of different DCF scenarios',
  },
  {
    id: 'benchmarking-chart',
    name: 'Benchmarking Chart',
    category: 'Charts',
    type: 'chart',
    description: 'Performance benchmarks against comparable companies',
  },

  // Methodology Tables
  {
    id: 'dcf-summary-table',
    name: 'DCF Summary Table',
    category: 'Methodology Tables',
    type: 'table',
  },
  {
    id: 'cca-peer-table',
    name: 'Comparable Companies Table & Statistics',
    category: 'Methodology Tables',
    type: 'table',
  },
  {
    id: 'pta-table',
    name: 'Precedent Transactions Table & Statistics',
    category: 'Methodology Tables',
    type: 'table',
  },
  {
    id: 'cost-approach-summary',
    name: 'Cost Approach Summary',
    category: 'Methodology Tables',
    type: 'table',
  },
  {
    id: 'wacc-buildup-table',
    name: 'WACC Build-up Table',
    category: 'Methodology Tables',
    type: 'table',
  },

  // Supporting Schedules
  {
    id: 'debt-schedule-table',
    name: 'Debt Schedule Table',
    category: 'Supporting Schedules',
    type: 'table',
  },
  {
    id: 'depreciation-schedule-table',
    name: 'Depreciation Schedule Table',
    category: 'Supporting Schedules',
    type: 'table',
  },
  {
    id: 'wc-schedule-table',
    name: 'Working Capital Schedule Table',
    category: 'Supporting Schedules',
    type: 'table',
  },

  // Qualitative
  {
    id: 'qualitative-assessment',
    name: 'Qualitative Assessment Scorecard',
    category: 'Qualitative',
    type: 'table',
  },
  { id: 'output-adjustments', name: 'Output Adjustments', category: 'Qualitative', type: 'table' },

  // Capitalization
  { id: 'cap-table-summary', name: 'Cap Table Summary', category: 'Capitalization', type: 'table' },
  {
    id: 'fully-diluted-shares',
    name: 'Fully Diluted Shares',
    category: 'Capitalization',
    type: 'value',
    format: { type: 'decimal', decimals: 0 },
  },
]

// Group content by category
const groupContentByCategory = () => {
  const groups: Record<string, DynamicContentItem[]> = {}

  // Define the order of categories
  const categoryOrder = [
    'Key Results',
    'WACC Components',
    'DCF Outputs',
    'Market Approach Metrics',
    'Scenario Data',
    'Project & Company Info',
    'Key Assumptions',
    'Valuation Summaries',
    'Charts',
    'Methodology Tables',
    'Supporting Schedules',
    'Qualitative',
    'Capitalization',
  ]

  // First, initialize the groups with empty arrays in the desired order
  categoryOrder.forEach((category) => {
    groups[category] = []
  })

  // Now populate the groups
  DYNAMIC_CONTENT.forEach((item) => {
    if (groups[item.category]) {
      groups[item.category].push(item)
    } else {
      groups[item.category] = [item]
    }
  })

  return groups
}

export function DynamicContentPanel({
  onInsert,
  projectId,
  isOpen,
  onClose,
}: DynamicContentPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItem, setSelectedItem] = useState<DynamicContentItem | null>(null)
  const groupedContent = groupContentByCategory()

  // Filter content based on search query
  const filterContent = () => {
    if (!searchQuery.trim()) {
      return groupedContent
    }

    const filteredGroups: Record<string, DynamicContentItem[]> = {}

    Object.entries(groupedContent).forEach(([category, items]) => {
      const filteredItems = items.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )

      if (filteredItems.length > 0) {
        filteredGroups[category] = filteredItems
      }
    })

    return filteredGroups
  }

  const filteredContent = filterContent()
  const contentCategories = Object.keys(filteredContent)

  // Get appropriate icon for content type
  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'chart':
        return <span className="text-blue-500">📊</span>
      case 'table':
        return <span className="text-green-500">📋</span>
      case 'value':
        return <span className="text-amber-500">🔢</span>
      case 'text':
        return <span className="text-gray-500">📝</span>
      default:
        return <span>📄</span>
    }
  }

  // Handle item selection
  const handleItemClick = (item: DynamicContentItem) => {
    setSelectedItem(item)
  }

  // Handle the actual insertion
  const handleInsertClick = () => {
    if (selectedItem) {
      onInsert(selectedItem)
      setSelectedItem(null)
      if (onClose) onClose()
    }
  }

  const PanelContent = () => (
    <Card className="h-full w-full border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="text-primary">Dynamic Content</span>
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
          <Input
            placeholder="Search content..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] pr-4">
          {contentCategories.length > 0 ? (
            <Accordion type="multiple" defaultValue={['Key Results', 'WACC Components', 'Charts']}>
              {contentCategories.map((category) => (
                <AccordionItem key={category} value={category}>
                  <AccordionTrigger className="px-4 py-2">{category}</AccordionTrigger>
                  <AccordionContent className="px-4 py-0">
                    <div className="mb-2 space-y-1">
                      {filteredContent[category].map((item) => (
                        <Button
                          key={item.id}
                          variant={selectedItem?.id === item.id ? 'default' : 'ghost'}
                          className="h-auto w-full justify-start py-2 text-left"
                          onClick={() => handleItemClick(item)}
                        >
                          <div className="flex items-start">
                            <div className="mr-2 mt-0.5">{getContentTypeIcon(item.type)}</div>
                            <div className="flex-1">
                              <div className="text-sm font-medium">{item.name}</div>
                              {item.description && (
                                <div className="text-xs text-muted-foreground">
                                  {item.description}
                                </div>
                              )}
                              {item.format && (
                                <div className="text-xs text-muted-foreground">
                                  {item.format.type === 'currency' &&
                                    `Currency${item.format.unitMultiplier ? ' (in millions)' : ''}`}
                                  {item.format.type === 'percent' &&
                                    `Percentage (${item.format.decimals || 1} decimal${item.format.decimals !== 1 ? 's' : ''})`}
                                  {item.format.type === 'multiple' &&
                                    `Multiple (${item.format.decimals || 1}x)`}
                                  {item.format.type === 'decimal' &&
                                    `Number (${item.format.decimals || 0} decimal${item.format.decimals !== 1 ? 's' : ''})`}
                                </div>
                              )}
                            </div>
                            {selectedItem?.id === item.id && (
                              <div className="ml-2 flex items-center">
                                <span className="rounded bg-primary/20 px-1.5 py-0.5 text-xs text-primary">
                                  Selected
                                </span>
                              </div>
                            )}
                          </div>
                        </Button>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="px-4 py-8 text-center text-muted-foreground">
              <p>No content matches your search</p>
            </div>
          )}
        </ScrollArea>

        {/* Insert button that appears only when something is selected */}
        {selectedItem && (
          <div className="border-t p-4">
            <Button className="w-full" onClick={handleInsertClick}>
              <Plus className="mr-2 h-4 w-4" />
              Insert {selectedItem.name}
            </Button>
          </div>
        )}

        <div className="border-t px-4 py-2 text-xs text-muted-foreground">
          <p className="mb-1">
            Note: Dynamic content will show the current version from your valuation project.
          </p>
          <p>Content will update if you refresh the report after making changes.</p>
        </div>
      </CardContent>
    </Card>
  )

  // Conditionally render either in a sheet or directly based on isOpen prop
  if (isOpen !== undefined) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <div className="h-full py-2">
            <PanelContent />
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  // Default rendering directly in the page
  return <PanelContent />
}

// Modify the function that adds dynamic content to the editor
export const addDynamicContentToEditor = (
  editor: any,
  contentType: string,
  contentId: string,
  contentName: string,
  category: string,
  formatOptions?: FormatOptions,
  themeBranding?: ThemeBranding
) => {
  if (!editor) return

  // If themeBranding is provided, include it in formatOptions
  const enrichedFormatOptions = themeBranding
    ? {
        ...formatOptions,
        themeBranding,
        logo: themeBranding.logoOptions,
      }
    : formatOptions

  editor
    .chain()
    .focus()
    .insertContent({
      type: 'dynamicContent',
      attrs: {
        type: contentType,
        contentId: contentId,
        name: contentName,
        category: category,
        formatOptions: enrichedFormatOptions,
      },
    })
    .run()

  // After inserting, attempt to go to a new line
  editor.chain().enter().run()
}
