'use client'

import React from 'react'
import { useDraggable } from '@dnd-kit/core'
import {
  Type,
  Heading1,
  List,
  Table,
  BarChart3,
  ImageIcon,
  Minus,
  FileText,
  Quote,
  Users,
  TrendingUp,
  Calendar,
  DollarSign,
  Hash,
  BookOpen,
  FileSignature,
  ScrollText,
  BookMarked,
  Library,
  BookOpenCheck,
  PenTool,
  FileUp,
  FileDown,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { BlockType } from '@/lib/templates/types'

interface BlockTypeConfig {
  type: BlockType
  label: string
  icon: React.ElementType
  description: string
  defaultContent: any
  category: 'text' | 'layout' | 'data' | 'media'
  defaultStyling?: any
}

const blockTypes: BlockTypeConfig[] = [
  {
    type: 'header',
    label: 'Header',
    icon: Heading1,
    description: 'Section headers and titles',
    defaultContent: 'New Header',
    category: 'text',
    defaultStyling: {
      fontSize: 24,
      fontWeight: 'bold',
      margin: '20px 0 10px 0',
    },
  },
  {
    type: 'paragraph',
    label: 'Paragraph',
    icon: Type,
    description: 'Text content and body copy',
    defaultContent:
      'Enter your text content here. You can use {{variable_name}} placeholders to insert dynamic data.',
    category: 'text',
    defaultStyling: {
      margin: '10px 0',
    },
  },
  {
    type: 'list',
    label: 'List',
    icon: List,
    description: 'Bulleted or numbered lists',
    defaultContent: ['First item', 'Second item', 'Third item'],
    category: 'text',
    defaultStyling: {
      margin: '10px 0',
      paddingLeft: '20px',
    },
  },
  {
    type: 'table',
    label: 'Table',
    icon: Table,
    description: 'Data tables and financial statements',
    defaultContent: {
      headers: ['Column 1', 'Column 2', 'Column 3'],
      rows: [
        ['Data 1', 'Data 2', 'Data 3'],
        ['Data 4', 'Data 5', 'Data 6'],
      ],
    },
    category: 'data',
    defaultStyling: {
      margin: '20px 0',
      width: '100%',
    },
  },
  {
    type: 'chart',
    label: 'Chart',
    icon: BarChart3,
    description: 'Charts and data visualizations',
    defaultContent: {
      type: 'bar',
      data: {
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        datasets: [
          {
            label: 'Revenue',
            data: [10, 20, 30, 40],
          },
        ],
      },
    },
    category: 'data',
    defaultStyling: {
      margin: '20px 0',
      height: '300px',
    },
  },
  {
    type: 'image',
    label: 'Image',
    icon: ImageIcon,
    description: 'Company logos and images',
    defaultContent: {
      src: '',
      alt: 'Image',
      caption: '',
    },
    category: 'media',
    defaultStyling: {
      maxWidth: '300px',
      margin: '20px auto',
      textAlign: 'center',
    },
  },
  {
    type: 'separator',
    label: 'Separator',
    icon: Minus,
    description: 'Horizontal line divider',
    defaultContent: '',
    category: 'layout',
    defaultStyling: {
      margin: '20px 0',
      borderTop: '1px solid #ccc',
    },
  },
  {
    type: 'quote',
    label: 'Quote',
    icon: Quote,
    description: 'Important quotes or highlights',
    defaultContent: 'Important information or quote goes here.',
    category: 'text',
    defaultStyling: {
      fontStyle: 'italic',
      borderLeft: '4px solid #007acc',
      paddingLeft: '20px',
      margin: '20px 0',
    },
  },
  {
    type: 'pageBreak',
    label: 'Page Break',
    icon: Minus,
    description: 'Force page break for printing',
    defaultContent: '',
    category: 'layout',
    defaultStyling: {
      pageBreakAfter: 'always',
    },
  },
  {
    type: 'dynamicTable',
    label: 'Dynamic Table',
    icon: Table,
    description: 'Data-driven table from valuation data',
    defaultContent: {
      dataSource: 'valuation.cap_table',
      columns: [
        { key: 'security_type', label: 'Security Type' },
        { key: 'shares_outstanding', label: 'Shares Outstanding' },
        { key: 'price_per_share', label: 'Price per Share' },
      ],
      filters: {},
      sortBy: 'security_type',
    },
    category: 'data',
    defaultStyling: {
      margin: '20px 0',
      width: '100%',
      borderCollapse: 'collapse',
    },
  },
  {
    type: 'breakpointsTable',
    label: 'Breakpoints Table',
    icon: TrendingUp,
    description: 'Dynamic breakpoints analysis table',
    defaultContent: {
      dataSource: 'valuation.breakpoints',
      showLiquidationPreference: true,
      showParticipationRights: true,
      dynamicColumns: true,
    },
    category: 'data',
    defaultStyling: {
      margin: '20px 0',
      width: '100%',
    },
  },
  {
    type: 'managementTable',
    label: 'Management Table',
    icon: Users,
    description: 'Management team ownership table',
    defaultContent: {
      dataSource: 'valuation.management',
      includeOptions: true,
      includeVesting: true,
    },
    category: 'data',
    defaultStyling: {
      margin: '20px 0',
      width: '100%',
    },
  },
  {
    type: 'valuationSummary',
    label: 'Valuation Summary',
    icon: DollarSign,
    description: 'Key valuation metrics summary',
    defaultContent: {
      dataSource: 'valuation.summary',
      includeMultiples: true,
      includeDCF: true,
      includeComparables: true,
    },
    category: 'data',
    defaultStyling: {
      margin: '20px 0',
      padding: '20px',
      backgroundColor: '#f8f9fa',
      border: '1px solid #dee2e6',
    },
  },
  {
    type: 'dateBlock',
    label: 'Date Block',
    icon: Calendar,
    description: 'Dynamic date display',
    defaultContent: {
      dateField: 'valuation.date',
      format: 'MMMM DD, YYYY',
    },
    category: 'text',
    defaultStyling: {
      textAlign: 'right',
      fontWeight: 'bold',
    },
  },
  {
    type: 'footnote',
    label: 'Footnote',
    icon: Hash,
    description: 'Add footnotes with dynamic content',
    defaultContent: {
      text: 'This statement is based on ',
      footnoteContent: 'Volatility of {{volatility}}% based on {{data_source}} as of {{valuation_date}}',
      type: 'footnote', // or 'endnote'
    },
    category: 'text',
    defaultStyling: {
      fontSize: 14,
    },
  },
  {
    type: 'tableOfContents',
    label: 'Table of Contents',
    icon: BookOpen,
    description: 'Auto-generated table of contents',
    defaultContent: {
      title: 'Table of Contents',
      depth: 3, // Include headers up to H3
      showPageNumbers: true,
      includeAppendices: true,
    },
    category: 'layout',
    defaultStyling: {
      margin: '40px 0',
    },
  },
  {
    type: 'coverPage',
    label: 'Cover Page',
    icon: FileSignature,
    description: 'Professional cover page',
    defaultContent: {
      title: '409A Valuation Report',
      subtitle: 'Fair Market Value Determination',
      showCompanyLogo: true,
      includeDate: true,
      includeConfidentiality: true,
    },
    category: 'layout',
    defaultStyling: {
      textAlign: 'center',
      pageBreakAfter: 'always',
    },
  },
  {
    type: 'executiveSummary',
    label: 'Executive Summary',
    icon: ScrollText,
    description: 'Key findings and conclusions',
    defaultContent: {
      title: 'Executive Summary',
      keyFindings: [],
      methodology: '',
      conclusion: '',
    },
    category: 'text',
    defaultStyling: {
      backgroundColor: '#f8f9fa',
      padding: '20px',
      borderLeft: '4px solid #007acc',
    },
  },
  {
    type: 'appendix',
    label: 'Appendix',
    icon: BookMarked,
    description: 'Supporting documentation section',
    defaultContent: {
      title: 'Appendix A',
      content: '',
      subsections: [],
    },
    category: 'layout',
    defaultStyling: {
      pageBreakBefore: 'always',
    },
  },
  {
    type: 'bibliography',
    label: 'Bibliography',
    icon: Library,
    description: 'References and citations',
    defaultContent: {
      title: 'References',
      entries: [],
      style: 'APA', // Citation style
    },
    category: 'text',
    defaultStyling: {
      fontSize: 12,
    },
  },
  {
    type: 'glossary',
    label: 'Glossary',
    icon: BookOpenCheck,
    description: 'Term definitions',
    defaultContent: {
      title: 'Glossary of Terms',
      terms: [
        { term: 'FMV', definition: 'Fair Market Value' },
        { term: 'DLOM', definition: 'Discount for Lack of Marketability' },
      ],
    },
    category: 'text',
    defaultStyling: {
      margin: '20px 0',
    },
  },
  {
    type: 'signatureBlock',
    label: 'Signature Block',
    icon: PenTool,
    description: 'Appraiser signature section',
    defaultContent: {
      signatories: [
        {
          name: '{{appraiser_name}}',
          title: '{{appraiser_title}}',
          credentials: '{{appraiser_credentials}}',
          date: '{{report_date}}',
        },
      ],
      includeDisclaimer: true,
    },
    category: 'layout',
    defaultStyling: {
      marginTop: '60px',
      borderTop: '1px solid #ddd',
      paddingTop: '20px',
    },
  },
  {
    type: 'header',
    label: 'Report Header',
    icon: FileUp,
    description: 'Page header with logo and title',
    defaultContent: {
      logoUrl: '',
      logoPosition: 'left', // 'left', 'center', 'right'
      companyName: '{{company.name}}',
      reportTitle: '409A Valuation Report',
      showDate: true,
      showPageNumbers: false, // Usually in footer
      backgroundColor: 'transparent',
      borderBottom: true,
    },
    category: 'layout',
    defaultStyling: {
      padding: '20px 0',
      borderBottom: '2px solid #e5e5e5',
      marginBottom: '30px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
  },
  {
    type: 'footer',
    label: 'Report Footer',
    icon: FileDown,
    description: 'Page footer with page numbers and info',
    defaultContent: {
      leftContent: '{{company.name}} - {{report.name}}',
      centerContent: 'Page {{page}} of {{totalPages}}',
      rightContent: '{{report.date}}',
      showConfidentiality: true,
      confidentialityText: 'CONFIDENTIAL - PROPRIETARY INFORMATION',
      confidentialityPosition: 'bottom', // 'top', 'bottom'
      backgroundColor: 'transparent',
      borderTop: true,
    },
    category: 'layout',
    defaultStyling: {
      padding: '15px 0',
      borderTop: '1px solid #e5e5e5',
      marginTop: '30px',
      fontSize: '10px',
      color: '#666',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'relative',
    },
  },
]

interface DraggableBlockProps {
  blockType: BlockTypeConfig
}

function DraggableBlock({ blockType }: DraggableBlockProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `block-${blockType.type}`,
    data: {
      blockType: blockType.type,
      defaultContent: blockType.defaultContent,
      defaultStyling: blockType.defaultStyling,
    },
  })

  const Icon = blockType.icon

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`block-library-item group cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center rounded-lg border border-border p-3 transition-all duration-200 hover:border-primary/50 hover:bg-primary/5">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon className="h-4 w-4" />
        </div>
        <div className="ml-3 min-w-0 flex-1">
          <div className="text-sm font-medium text-foreground">{blockType.label}</div>
          <div className="line-clamp-1 text-xs text-muted-foreground">{blockType.description}</div>
        </div>
      </div>
    </div>
  )
}

export function BlockLibrary() {
  const categories = {
    text: blockTypes.filter((b) => b.category === 'text'),
    data: blockTypes.filter((b) => b.category === 'data'),
    layout: blockTypes.filter((b) => b.category === 'layout'),
    media: blockTypes.filter((b) => b.category === 'media'),
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-base">
          <FileText className="mr-2 h-4 w-4" />
          Block Library
        </CardTitle>
        <p className="text-xs text-muted-foreground">Drag blocks to add them to your template</p>
      </CardHeader>
      <CardContent className="h-[calc(100vh-240px)] space-y-4 overflow-y-auto pr-2 pb-6">
        {/* Text Blocks */}
        <div>
          <h4 className="mb-2 text-sm font-medium text-muted-foreground">Text</h4>
          <div className="space-y-2">
            {categories.text.map((blockType) => (
              <DraggableBlock key={blockType.type} blockType={blockType} />
            ))}
          </div>
        </div>

        {/* Data Blocks */}
        <div>
          <h4 className="mb-2 text-sm font-medium text-muted-foreground">Data</h4>
          <div className="space-y-2">
            {categories.data.map((blockType) => (
              <DraggableBlock key={blockType.type} blockType={blockType} />
            ))}
          </div>
        </div>

        {/* Layout Blocks */}
        <div>
          <h4 className="mb-2 text-sm font-medium text-muted-foreground">Layout</h4>
          <div className="space-y-2">
            {categories.layout.map((blockType) => (
              <DraggableBlock key={blockType.type} blockType={blockType} />
            ))}
          </div>
        </div>

        {/* Media Blocks */}
        {categories.media.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-medium text-muted-foreground">Media</h4>
            <div className="space-y-2">
              {categories.media.map((blockType) => (
                <DraggableBlock key={blockType.type} blockType={blockType} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
