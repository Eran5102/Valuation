import { useState } from 'react'
import { FileText, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ViewToggle } from '@/components/shared/ViewToggle'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Link } from 'react-router-dom'

// Mock reports data
const mockReports = [
  {
    id: '1',
    name: 'Q1 2025 Valuation Report',
    company: 'Acme Corporation',
    type: 'Quarterly Valuation',
    createdAt: '2025-03-15',
    author: 'John Smith',
  },
  {
    id: '2',
    name: 'Annual Detailed DCF Analysis',
    company: 'Northern Manufacturing',
    type: 'Full Valuation',
    createdAt: '2025-02-28',
    author: 'Sarah Johnson',
  },
  {
    id: '3',
    name: 'Market Approach Summary',
    company: 'Crestwood Healthcare',
    type: 'Market Comps',
    createdAt: '2025-01-10',
    author: 'Michael Brown',
  },
]

export default function Reports() {
  const [searchQuery, setSearchQuery] = useState('')
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: 'asc' | 'desc'
  }>({ key: 'name', direction: 'asc' })

  const handleSort = (key: string) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
    })
  }

  const sortedReports = [...mockReports].sort((a, b) => {
    const aValue = a[sortConfig.key as keyof typeof a]
    const bValue = b[sortConfig.key as keyof typeof b]

    if (aValue && bValue) {
      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : -1
      }
      return aValue < bValue ? 1 : -1
    }
    return 0
  })

  const filteredReports = sortedReports.filter(
    (report) =>
      report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.company.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const ReportCard = ({ report }: { report: any }) => (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader>
        <CardTitle className="text-lg">{report.name}</CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Company:</span> {report.company}
          </p>
          <p>
            <span className="font-medium text-foreground">Type:</span> {report.type}
          </p>
          <p>
            <span className="font-medium text-foreground">Created:</span>{' '}
            {new Date(report.createdAt).toLocaleDateString()}
          </p>
          <p>
            <span className="font-medium text-foreground">Author:</span> {report.author}
          </p>
        </div>
        <div className="mt-4 flex justify-end">
          <Button size="sm" asChild>
            <Link to={`/workspace/${report.id}/report`}>View Report</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md pl-10"
          />
        </div>
        <div className="flex items-center gap-4">
          <ViewToggle view={view} onViewChange={setView} />
          <Button asChild>
            <Link to="/workspace/new/report">+ Create New Report</Link>
          </Button>
        </div>
      </div>

      {view === 'grid' ? (
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredReports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:text-primary"
                  onClick={() => handleSort('name')}
                >
                  Report Name{' '}
                  {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:text-primary"
                  onClick={() => handleSort('company')}
                >
                  Company{' '}
                  {sortConfig.key === 'company' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead
                  className="cursor-pointer hover:text-primary"
                  onClick={() => handleSort('createdAt')}
                >
                  Created Date{' '}
                  {sortConfig.key === 'createdAt' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead>Author</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.name}</TableCell>
                  <TableCell>{report.company}</TableCell>
                  <TableCell>{report.type}</TableCell>
                  <TableCell>{new Date(report.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{report.author}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" asChild>
                      <Link to={`/workspace/${report.id}/report`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {filteredReports.length === 0 && (
        <div className="rounded-lg border bg-muted/30 p-8 text-center">
          <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-1 text-lg font-medium">No reports found</h3>
          <p className="mb-4 text-muted-foreground">
            You don't have any reports matching your search criteria.
          </p>
          <Button asChild>
            <Link to="/workspace/new/report">Create a Report</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
