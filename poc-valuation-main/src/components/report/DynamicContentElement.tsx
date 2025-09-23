import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { useParams } from 'react-router-dom'
import { BarChart2, FileBarChart, FileText, Table, Hash } from 'lucide-react'
import { FormatOptions, TableFormatOptions, ChartFormatOptions } from './DynamicContentFormatting'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

// Types for the dynamic content elements
export interface DynamicContentElementProps {
  type: 'chart' | 'table' | 'value' | 'text'
  contentId: string
  name: string
  category?: string
  formatOptions?: FormatOptions
  // The actual content will be fetched based on contentId
  // This could be a base64 image for charts, HTML for tables, or formatted text
}

// Helper function to apply number formatting
export const formatNumber = (value: number | string, format?: TableFormatOptions): string => {
  if (typeof value === 'string') {
    // Try to parse the string as a number
    const parsedValue = parseFloat(value.replace(/[^\d.-]/g, ''))
    if (isNaN(parsedValue)) {
      // If it's not a number, return the original string
      return value
    }
    value = parsedValue
  }

  const numberFormat = format?.numberFormat || 'plain'
  const decimals = format?.decimals !== undefined ? format.decimals : 2

  switch (numberFormat) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value)
    case 'percentage':
      return new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value / 100)
    case 'decimal':
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value)
    case 'multiple':
      return (
        new Intl.NumberFormat('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(value) + 'x'
      )
    default:
      return value.toString()
  }
}

// Sample data for different chart types
const getChartData = (chartId: string) => {
  switch (chartId) {
    case 'revenue-growth':
      return {
        type: 'bar',
        data: [
          { name: '2022', value: 4000 },
          { name: '2023', value: 5000 },
          { name: '2024', value: 6800 },
          { name: '2025', value: 8100 },
          { name: '2026', value: 9400 },
        ],
      }
    case 'margin-analysis':
      return {
        type: 'line',
        data: [
          { name: '2022', gross: 45, operating: 22, net: 12 },
          { name: '2023', gross: 48, operating: 24, net: 14 },
          { name: '2024', gross: 51, operating: 28, net: 16 },
          { name: '2025', gross: 53, operating: 30, net: 18 },
          { name: '2026', gross: 55, operating: 32, net: 20 },
        ],
      }
    case 'revenue-breakdown':
      return {
        type: 'pie',
        data: [
          { name: 'Product A', value: 45 },
          { name: 'Product B', value: 25 },
          { name: 'Product C', value: 20 },
          { name: 'Other', value: 10 },
        ],
      }
    case 'valuation-chart':
      return {
        type: 'bar',
        data: [
          { name: 'DCF', value: 105 },
          { name: 'Trading Comps', value: 100 },
          { name: 'Transaction Comps', value: 112.5 },
          { name: 'Weighted Average', value: 105.5 },
        ],
      }
    case 'football-field':
    case 'football-field-chart':
      return {
        type: 'bar',
        data: [
          { name: 'DCF', low: 95, high: 115, mid: 105 },
          { name: 'Trading Comps', low: 90, high: 110, mid: 100 },
          { name: 'Transaction Comps', low: 100, high: 125, mid: 112.5 },
          { name: 'Weighted Average', low: 94.5, high: 115.5, mid: 105.0 },
        ],
      }
    case 'sensitivity-tornado':
      return {
        type: 'bar',
        horizontal: true,
        data: [
          { name: 'WACC', downside: -12.5, upside: 15.0 },
          { name: 'Terminal Growth', downside: -10.0, upside: 12.0 },
          { name: 'Revenue Growth', downside: -8.0, upside: 9.5 },
          { name: 'EBITDA Margin', downside: -7.5, upside: 8.0 },
        ],
      }
    case 'cca-multiples-chart':
      return {
        type: 'bar',
        data: [
          { name: 'Company 1', ev_ebitda: 8.5, ev_revenue: 2.1 },
          { name: 'Company 2', ev_ebitda: 7.8, ev_revenue: 1.8 },
          { name: 'Company 3', ev_ebitda: 9.2, ev_revenue: 2.3 },
          { name: 'Company 4', ev_ebitda: 8.1, ev_revenue: 2.0 },
          { name: 'Company 5', ev_ebitda: 7.5, ev_revenue: 1.7 },
          { name: 'Subject', ev_ebitda: 8.0, ev_revenue: 2.0 },
        ],
      }
    case 'pta-multiples-chart':
      return {
        type: 'bar',
        data: [
          { name: 'Transaction 1', ev_ebitda: 9.2, ev_revenue: 2.4 },
          { name: 'Transaction 2', ev_ebitda: 8.5, ev_revenue: 2.1 },
          { name: 'Transaction 3', ev_ebitda: 9.8, ev_revenue: 2.5 },
          { name: 'Transaction 4', ev_ebitda: 8.8, ev_revenue: 2.2 },
          { name: 'Average', ev_ebitda: 9.1, ev_revenue: 2.3 },
        ],
      }
    default:
      // Default sample data
      return {
        type: 'bar',
        data: [
          { name: 'Category A', value: 4000 },
          { name: 'Category B', value: 3000 },
          { name: 'Category C', value: 2000 },
          { name: 'Category D', value: 2780 },
        ],
      }
  }
}

// Color palette for charts
const CHART_COLORS = ['#3b82f6', '#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6']

// Placeholder function to fetch content
const fetchDynamicContent = (
  contentId: string,
  projectId: string,
  type: string,
  formatOptions?: FormatOptions
) => {
  console.log(`Fetching dynamic content ${contentId} for project ${projectId} of type ${type}`)

  // Different sample data based on content type
  switch (type) {
    case 'chart':
      return {
        content: getChartData(contentId),
        timestamp: new Date().toISOString(),
      }
    case 'table':
      if (contentId === 'valuation-synthesis') {
        // Apply formatting to the table HTML based on formatOptions
        const tableFormat = formatOptions?.table
        const themeBranding = formatOptions?.themeBranding || {
          tableHeaderBg: '#0f172a',
          tableHeaderText: '#ffffff',
          tableAltRowBg: '#f8fafc',
          tableBorderColor: '#e2e8f0',
          tableOptions: {
            headerBold: true,
            useAltRowShading: false,
          },
        }

        // Generate table with appropriate cell alignments and formats
        const cellAlign = tableFormat?.alignment || 'left'
        const alignClass = `text-${cellAlign}`

        // Border color
        const borderColor = themeBranding.tableBorderColor || tableFormat?.borderColor || '#e2e8f0'

        // Header styles
        const headerClasses = []
        if (themeBranding.tableOptions?.headerBold || tableFormat?.headerStyle?.includes('bold')) {
          headerClasses.push('font-bold')
        }
        if (tableFormat?.headerStyle?.includes('shaded')) headerClasses.push('bg-muted')
        const headerClass = headerClasses.length > 0 ? headerClasses.join(' ') : ''

        // Footer styles
        const footerClasses = []
        if (tableFormat?.footerStyle?.includes('bold')) footerClasses.push('font-bold')
        if (tableFormat?.footerStyle?.includes('shaded')) footerClasses.push('bg-muted/50')
        const footerClass = footerClasses.length > 0 ? footerClasses.join(' ') : ''

        // Get striping classes based on settings
        const useAltRowShading = themeBranding.tableOptions?.useAltRowShading || false
        const altRowBg = themeBranding.tableAltRowBg || '#f8fafc'

        return {
          content: `
            <table border="1" cellpadding="5" style="border-collapse: collapse; width: 100%; border-color: ${borderColor}">
              <tr class="${headerClass}" style="background-color: ${themeBranding.tableHeaderBg || '#0f172a'}; color: ${themeBranding.tableHeaderText || '#ffffff'}">
                <th>Methodology</th>
                <th class="${alignClass}">Low ($M)</th>
                <th class="${alignClass}">Mid ($M)</th>
                <th class="${alignClass}">High ($M)</th>
                <th class="${alignClass}">Weight</th>
              </tr>
              <tr>
                <td>DCF Analysis</td>
                <td class="${alignClass}">${formatNumber(95.0, tableFormat)}</td>
                <td class="${alignClass}">${formatNumber(105.0, tableFormat)}</td>
                <td class="${alignClass}">${formatNumber(115.0, tableFormat)}</td>
                <td class="${alignClass}">${formatNumber(50, { ...tableFormat, numberFormat: 'percentage', decimals: 0 })}</td>
              </tr>
              <tr ${useAltRowShading ? `style="background-color: ${altRowBg}"` : ''}>
                <td>Comparable Companies</td>
                <td class="${alignClass}">${formatNumber(90.0, tableFormat)}</td>
                <td class="${alignClass}">${formatNumber(100.0, tableFormat)}</td>
                <td class="${alignClass}">${formatNumber(110.0, tableFormat)}</td>
                <td class="${alignClass}">${formatNumber(30, { ...tableFormat, numberFormat: 'percentage', decimals: 0 })}</td>
              </tr>
              <tr>
                <td>Precedent Transactions</td>
                <td class="${alignClass}">${formatNumber(100.0, tableFormat)}</td>
                <td class="${alignClass}">${formatNumber(112.5, tableFormat)}</td>
                <td class="${alignClass}">${formatNumber(125.0, tableFormat)}</td>
                <td class="${alignClass}">${formatNumber(20, { ...tableFormat, numberFormat: 'percentage', decimals: 0 })}</td>
              </tr>
              <tr class="${footerClass}" style="border-top: 2px solid ${borderColor}">
                <td>Weighted Average</td>
                <td class="${alignClass}">${formatNumber(94.5, tableFormat)}</td>
                <td class="${alignClass}">${formatNumber(105.0, tableFormat)}</td>
                <td class="${alignClass}">${formatNumber(115.5, tableFormat)}</td>
                <td class="${alignClass}">${formatNumber(100, { ...tableFormat, numberFormat: 'percentage', decimals: 0 })}</td>
              </tr>
            </table>
          `,
          timestamp: new Date().toISOString(),
        }
      }
      return {
        content: `[Dynamic table: ${contentId}]`,
        timestamp: new Date().toISOString(),
      }
    case 'value':
      if (contentId === 'final-ev-range') {
        return {
          content: '$94.5 million to $115.5 million',
          timestamp: new Date().toISOString(),
        }
      }
      if (contentId === 'final-ev-mid') {
        return {
          content: '$105.0 million',
          timestamp: new Date().toISOString(),
        }
      }
      if (contentId === 'wacc-rate') {
        return {
          content: '12.5%',
          timestamp: new Date().toISOString(),
        }
      }
      if (contentId === 'terminal-growth-rate') {
        return {
          content: '3.0%',
          timestamp: new Date().toISOString(),
        }
      }
      return {
        content: `[Dynamic value: ${contentId}]`,
        timestamp: new Date().toISOString(),
      }
    case 'text':
      if (contentId === 'qualitative-assessment') {
        return {
          content: `
            <h4>Strengths</h4>
            <ul>
              <li>Market-leading position in core segments</li>
              <li>Strong R&D pipeline with 5 new products in development</li>
              <li>Diversified customer base across multiple industries</li>
            </ul>
            <h4>Weaknesses</h4>
            <ul>
              <li>High concentration in North American markets (78% of revenue)</li>
              <li>Reliance on key supplier for critical components</li>
            </ul>
            <h4>Opportunities & Threats</h4>
            <p>The company faces both significant growth opportunities in emerging markets and competitive threats from low-cost alternatives entering the market.</p>
          `,
          timestamp: new Date().toISOString(),
        }
      }
      return {
        content: `[Dynamic text: ${contentId}]`,
        timestamp: new Date().toISOString(),
      }
    default:
      return {
        content: `[Dynamic content: ${contentId}]`,
        timestamp: new Date().toISOString(),
      }
  }
}

// Renders the appropriate chart based on chart type
const renderChart = (chartData: any, chartFormat?: ChartFormatOptions) => {
  if (!chartData || !chartData.type) {
    return (
      <div className="flex h-60 items-center justify-center rounded bg-muted/20">
        <span className="text-muted-foreground">No chart data available</span>
      </div>
    )
  }

  const height =
    chartFormat?.size === 'small'
      ? 200
      : chartFormat?.size === 'large'
        ? 400
        : chartFormat?.size === 'full'
          ? 450
          : 300 // default for medium

  switch (chartData.type) {
    case 'bar':
      if (chartData.horizontal) {
        // Horizontal bar chart (for tornado charts)
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart
              layout="vertical"
              data={chartData.data}
              margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" />
              <Tooltip formatter={(value: any) => [`${value}`, '']} />
              <Legend />
              <Bar dataKey="downside" fill="#ef4444" name="Downside Impact" />
              <Bar dataKey="upside" fill="#10b981" name="Upside Impact" />
            </BarChart>
          </ResponsiveContainer>
        )
      }

      // Check if this is a football field chart with low/high/mid values
      if (chartData.data[0] && 'low' in chartData.data[0]) {
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData.data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis domain={['dataMin - 10', 'dataMax + 10']} />
              <Tooltip
                formatter={(value: any, name: string) => {
                  const formattedName =
                    name === 'low' ? 'Low' : name === 'high' ? 'High' : 'Midpoint'
                  return [`$${value}M`, formattedName]
                }}
              />
              <Legend />
              <Bar dataKey="low" stackId="a" fill="transparent" />
              <Bar dataKey="high" stackId="a" fill="#3b82f6" name="Valuation Range" />
              <Bar dataKey="mid" fill="#ef4444" name="Midpoint" />
            </BarChart>
          </ResponsiveContainer>
        )
      }

      // Check if this is a multiples comparison chart
      if (chartData.data[0] && 'ev_ebitda' in chartData.data[0]) {
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData.data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value: any, name: string) => {
                  const formattedName = name === 'ev_ebitda' ? 'EV/EBITDA' : 'EV/Revenue'
                  return [`${value}x`, formattedName]
                }}
              />
              <Legend />
              <Bar dataKey="ev_ebitda" fill="#3b82f6" name="EV/EBITDA" />
              <Bar dataKey="ev_revenue" fill="#10b981" name="EV/Revenue" />
            </BarChart>
          </ResponsiveContainer>
        )
      }

      // Regular bar chart
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData.data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value: any) => [`${value}`, 'Value']} />
            <Legend />
            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )
    case 'line':
      return (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData.data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value: any) => [`${value}%`, '']} />
            <Legend />
            <Line type="monotone" dataKey="gross" stroke="#3b82f6" name="Gross Margin" />
            <Line type="monotone" dataKey="operating" stroke="#10b981" name="Operating Margin" />
            <Line type="monotone" dataKey="net" stroke="#6366f1" name="Net Margin" />
          </LineChart>
        </ResponsiveContainer>
      )
    case 'pie':
      return (
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={chartData.data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              label={(entry) => `${entry.name}: ${entry.value}%`}
            >
              {chartData.data.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: any) => [`${value}%`, '']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )
    default:
      return (
        <div className="flex h-60 items-center justify-center rounded bg-muted/20">
          <span className="text-muted-foreground">Unsupported chart type</span>
        </div>
      )
  }
}

export function DynamicContentElement({
  type,
  contentId,
  name,
  category,
  formatOptions,
}: DynamicContentElementProps) {
  const { projectId } = useParams<{ projectId: string }>()
  const [content, setContent] = React.useState<any>(null)
  const [loadingError, setLoadingError] = React.useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!projectId) return

    try {
      // In a real implementation, this would make an async call
      const result = fetchDynamicContent(contentId, projectId, type, formatOptions)
      setContent(result.content)
      setLastUpdated(result.timestamp)
    } catch (error) {
      console.error('Error fetching dynamic content:', error)
      setLoadingError('Failed to load content')
    }
  }, [contentId, projectId, type, formatOptions])

  // Icon for content type
  const renderIcon = () => {
    switch (type) {
      case 'chart':
        return <BarChart2 className="h-4 w-4" />
      case 'table':
        return <Table className="h-4 w-4" />
      case 'value':
        return <Hash className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  // Get chart container class based on size and alignment
  const getChartContainerClass = () => {
    const chartFormat = formatOptions?.chart
    if (!chartFormat || type !== 'chart') return ''

    let classes = ''

    // Size classes
    switch (chartFormat.size) {
      case 'small':
        classes += ' w-1/2'
        break
      case 'medium':
        classes += ' w-3/4'
        break
      case 'large':
        classes += ' w-[90%]'
        break
      case 'full':
        classes += ' w-full'
        break
      default:
        classes += ' w-3/4'
    }

    // Alignment classes
    switch (chartFormat.alignment) {
      case 'left':
        classes += ' mx-0'
        break
      case 'center':
        classes += ' mx-auto'
        break
      case 'right':
        classes += ' ml-auto mr-0'
        break
      default:
        classes += ' mx-auto'
    }

    return classes
  }

  return (
    <Card className="my-4 border-2 border-dashed border-primary/40 bg-primary/5">
      <CardContent className="p-4">
        <div className="mb-2 flex items-center gap-2">
          {renderIcon()}
          <span className="font-medium">{name}</span>
          {category && (
            <span className="rounded bg-muted px-1 py-0.5 text-xs text-muted-foreground">
              {category}
            </span>
          )}
        </div>

        {loadingError ? (
          <div className="text-sm text-red-500">{loadingError}</div>
        ) : content ? (
          type === 'chart' ? (
            <div className={getChartContainerClass()}>
              {renderChart(content, formatOptions?.chart)}
              {formatOptions?.chart?.caption && (
                <div className="mt-2 text-center text-sm italic">{formatOptions.chart.caption}</div>
              )}
            </div>
          ) : type === 'table' || type === 'text' ? (
            <div className="text-sm" dangerouslySetInnerHTML={{ __html: content }} />
          ) : (
            <div className="text-sm">{content}</div>
          )
        ) : (
          <div className="flex h-20 items-center justify-center rounded bg-muted/30">
            <span className="text-muted-foreground">Loading {type}...</span>
          </div>
        )}

        <div className="mt-2 text-xs text-muted-foreground">
          {lastUpdated && `Last updated: ${new Date(lastUpdated).toLocaleString()}`}
        </div>
      </CardContent>
    </Card>
  )
}
