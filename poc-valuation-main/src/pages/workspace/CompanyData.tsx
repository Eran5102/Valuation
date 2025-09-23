import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Database, Settings, Upload, Edit, Save, Globe, Factory, Currency } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { NormalizationAdjustments } from '@/components/ui/normalization-adjustments'
import { generateHistoricalFiscalYearLabels } from '@/utils/fiscalYearUtils'
import { useProjectSettings } from '@/contexts/ProjectSettingsContext'
import { toast } from 'sonner'
import { useFinancialDataEditing } from '@/hooks/useFinancialDataEditing'
import { useCompanyManagement } from '@/hooks/useCompanyManagement'
import { useCompanyFinancialData } from '@/hooks/useCompanyFinancialData'
import { useCompanyDcfIntegration } from '@/hooks/useCompanyDcfIntegration'
import { PageHeader } from '@/components/layout/PageHeader'

export interface CompanyFinancialData {
  companyName: string
  ticker: string
  lastModified: string
  incomeStatementItems: FinancialItem[]
  balanceSheetItems: FinancialItem[]
  cashFlowItems: FinancialItem[]
  yearLabels: string[]
  currency: string
  unitMultiplier: number
}

export interface FinancialItem {
  item: string
  values: number[]
  isCalculated?: boolean
  formula?: string
}

export default function CompanyData() {
  const { projectId } = useParams<{ projectId: string }>()
  const { settings } = useProjectSettings()
  const { getCompanyById } = useCompanyManagement()
  const { financialData, refreshData } = useCompanyFinancialData()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Data source dialog state
  const [showDataSourceDialog, setShowDataSourceDialog] = useState(false)
  const [selectedDataSource, setSelectedDataSource] = useState<'manual' | 'csv' | 'api'>('manual')
  const [apiEndpoint, setApiEndpoint] = useState('')
  const [apiKey, setApiKey] = useState('')

  // Get company data
  const company = projectId ? getCompanyById(projectId) : undefined

  // Generate dynamic fiscal year labels using the most recent fiscal year end
  const fiscalYears = generateHistoricalFiscalYearLabels(
    settings.mostRecentFiscalYearEnd,
    3 // Number of historical years
  )

  // Initialize financial items or use loaded data
  const initialIncomeItems = financialData?.incomeStatementItems || [
    // Note: Values are now in CHRONOLOGICAL order, oldest to newest
    { item: 'Revenue', values: [750000, 980000, 1250000] },
    { item: 'Cost of Goods Sold', values: [-450000, -588000, -750000] },
    { item: 'Gross Profit', values: [300000, 392000, 500000] },
    { item: 'Operating Expenses', values: [-180000, -235200, -300000] },
    { item: 'Operating Income', values: [120000, 156800, 200000] },
  ]

  const initialBalanceItems = financialData?.balanceSheetItems || [
    // Values in chronological order, oldest to newest
    { item: 'Cash & Equivalents', values: [200000, 250000, 300000] },
    { item: 'Accounts Receivable', values: [90000, 120000, 150000] },
    { item: 'Inventory', values: [150000, 180000, 200000] },
    { item: 'Total Current Assets', values: [440000, 550000, 650000] },
    { item: 'Property, Plant & Equipment', values: [700000, 850000, 1000000] },
    { item: 'Total Assets', values: [800000, 1000000, 1200000] },
    { item: 'Debt', values: [300000, 400000, 500000] },
  ]

  const initialCashFlowItems = financialData?.cashFlowItems || [
    // Values in chronological order, oldest to newest
    { item: 'Operating Cash Flow', values: [180000, 220000, 280000] },
    { item: 'Investing Cash Flow', values: [-90000, -120000, -150000] },
    { item: 'Financing Cash Flow', values: [-30000, -40000, -50000] },
    { item: 'Net Cash Flow', values: [60000, 60000, 80000] },
  ]

  // Use the financial data editing hook
  const {
    editMode,
    setEditMode,
    incomeItems,
    balanceItems,
    cashFlowItems,
    editedIncomeItems,
    editedBalanceItems,
    editedCashFlowItems,
    handleValueChange,
    saveChanges,
    cancelEditing,
  } = useFinancialDataEditing({
    initialIncomeStatementItems: initialIncomeItems,
    initialBalanceSheetItems: initialBalanceItems,
    initialCashFlowItems: initialCashFlowItems,
    fiscalYears,
  })

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check if it's a CSV
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast.error('Invalid file type', {
        description: 'Please upload a CSV file',
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        // Simple CSV parsing - in a real app you'd use a proper CSV parser
        const contents = e.target?.result as string
        const rows = contents.split('\n').map((row) => row.split(','))

        // Ensure we have column headers in the first row
        if (rows.length < 2) {
          throw new Error('CSV file does not contain enough data')
        }

        toast.success('Financial data imported', {
          description: 'CSV data has been processed. Please review and save.',
        })

        // In a real implementation, you would map the CSV data to your financial items here
        // For the demo, we'll just simulate a successful import
        setEditMode(true) // Enter edit mode to review the imported data
      } catch (error) {
        toast.error('Error parsing CSV', {
          description: 'Please check the file format and try again',
        })
      }
    }

    reader.readAsText(file)

    // Reset the input so the same file can be uploaded again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleManageDataSource = () => {
    setShowDataSourceDialog(true)
  }

  const saveDataSourceSettings = () => {
    toast.success('Data source settings saved', {
      description: `Data source set to: ${selectedDataSource}`,
    })
    setShowDataSourceDialog(false)
  }

  const saveFinancialData = (event: React.MouseEvent<HTMLButtonElement>) => {
    // Create the data to save based on current state
    const dataToSave: CompanyFinancialData = {
      companyName: company?.legalName || company?.name || 'Company',
      ticker: company?.ticker || '',
      lastModified: new Date().toISOString(),
      incomeStatementItems: editMode ? editedIncomeItems : incomeItems,
      balanceSheetItems: editMode ? editedBalanceItems : balanceItems,
      cashFlowItems: editMode ? editedCashFlowItems : cashFlowItems,
      yearLabels: fiscalYears,
      currency: company?.currency || 'USD',
      unitMultiplier: 1,
    }

    localStorage.setItem('companyFinancialData', JSON.stringify(dataToSave))

    // Find last actual revenue for DCF calculations (newest value)
    const revenueItem = dataToSave.incomeStatementItems.find(
      (item) =>
        item.item.toLowerCase().includes('revenue') || item.item.toLowerCase().includes('sales')
    )

    if (revenueItem && revenueItem.values.length > 0) {
      // Use the LAST value (newest) in the array
      const latestRevenue = revenueItem.values[revenueItem.values.length - 1]
      localStorage.setItem('lastActualRevenue', latestRevenue.toString())

      // Dispatch a custom event to notify other components
      const event = new CustomEvent('companyFinancialDataUpdated', {
        detail: { lastActualRevenue: latestRevenue },
      })
      window.dispatchEvent(event)
    }

    // Display a success message
    toast.success('Financial data saved successfully!')
  }

  // Render table cells based on edit mode
  const renderTableCell = (
    item: FinancialItem,
    index: number,
    valueIndex: number,
    statementType: 'income' | 'balance' | 'cashflow'
  ) => {
    const value = editMode
      ? statementType === 'income'
        ? editedIncomeItems[index].values[valueIndex]
        : statementType === 'balance'
          ? editedBalanceItems[index].values[valueIndex]
          : editedCashFlowItems[index].values[valueIndex]
      : item.values[valueIndex]

    if (editMode) {
      return (
        <TableCell key={`${item.item}-${fiscalYears[valueIndex]}`} className="p-2 text-right">
          <Input
            type="number"
            value={value}
            onChange={(e) => handleValueChange(statementType, index, valueIndex, e.target.value)}
            className="h-8 w-32 text-right"
          />
        </TableCell>
      )
    }

    return (
      <TableCell key={`${item.item}-${fiscalYears[valueIndex]}`} className="text-right">
        {value.toLocaleString('en-US', {
          style: 'currency',
          currency: company?.currency || 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}
      </TableCell>
    )
  }

  const { lastActualRevenue } = useCompanyDcfIntegration()

  return (
    <div className="w-full">
      <PageHeader
        title="Company Data & Financials"
        icon={<Database className="h-6 w-6" />}
        description={`Review and manage financial data for ${company?.legalName || company?.name || 'the Company'}`}
      />

      <div className="grid gap-6 p-4">
        {/* Basic Company Information Card */}
        <Card className="p-6">
          <div className="mb-4 flex items-center space-x-2">
            <Database className="text-teal h-5 w-5" />
            <h3 className="text-lg font-semibold">Basic Company Information</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Legal Name</p>
              <p className="text-sm font-semibold">
                {company?.legalName || company?.name || 'Not specified'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Industry</p>
              <div className="flex items-center gap-1">
                <Factory className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-sm font-semibold">{company?.industry || 'Not specified'}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Geography</p>
              <div className="flex items-center gap-1">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-sm font-semibold">{company?.geography || 'Not specified'}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Reporting Currency</p>
              <div className="flex items-center gap-1">
                <Currency className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-sm font-semibold">{company?.currency || 'USD'}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Financial Year End</p>
              <p className="text-sm font-semibold">
                {company?.fyEnd
                  ? `${company.fyEndMonth ? new Date(0, parseInt(company.fyEndMonth) - 1).toLocaleString('default', { month: 'long' }) : ''} ${company.fyEndDay || ''}`
                  : 'Not specified'}
              </p>
            </div>
          </div>
        </Card>

        {/* Data Source Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Settings className="text-teal h-5 w-5" />
              <h3 className="text-lg font-semibold">Data Source</h3>
            </div>
            <Button variant="outline" className="space-x-2" onClick={handleManageDataSource}>
              <Settings className="h-4 w-4" />
              <span>Manage Data Source</span>
            </Button>
          </div>
          <div className="mt-4">
            <Badge variant="secondary" className="bg-teal/10 text-teal">
              Manual Input
            </Badge>
            <p className="mt-2 text-sm text-muted-foreground">
              Financial data is currently being managed through manual input. Click 'Manage Data
              Source' to change this setting.
            </p>
          </div>
        </Card>

        {/* Hidden file input for CSV upload */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".csv"
          onChange={handleFileUpload}
        />

        {/* Historical Financial Statements Section */}
        <Card className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Database className="text-teal h-5 w-5" />
                <h3 className="text-lg font-semibold">Historical Financial Statements</h3>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  className="space-x-2"
                  onClick={() => (editMode ? cancelEditing() : setEditMode(true))}
                >
                  <Edit className="h-4 w-4" />
                  <span>{editMode ? 'Cancel Edit' : 'Edit Data'}</span>
                </Button>
                <Button variant="outline" className="space-x-2" onClick={handleUploadClick}>
                  <Upload className="h-4 w-4" />
                  <span>Upload Statements</span>
                </Button>
                <Button variant="outline" className="space-x-2" onClick={saveFinancialData}>
                  <Save className="h-4 w-4" />
                  <span>Save Data</span>
                </Button>
              </div>
            </div>

            <Tabs defaultValue="income" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="income">Income Statement</TabsTrigger>
                <TabsTrigger value="balance">Balance Sheet</TabsTrigger>
                <TabsTrigger value="cashflow">Cash Flow Statement</TabsTrigger>
              </TabsList>

              <TabsContent value="income" className="mt-4">
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px] bg-muted/50">Line Item</TableHead>
                        {fiscalYears.map((year) => (
                          <TableHead key={year} className="min-w-[120px] text-right">
                            {year}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(editMode ? editedIncomeItems : incomeItems).map((row, idx) => (
                        <TableRow key={row.item}>
                          <TableCell className="font-medium">{row.item}</TableCell>
                          {row.values.map((_, valueIdx) =>
                            renderTableCell(row, idx, valueIdx, 'income')
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="balance" className="mt-4">
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px] bg-muted/50">Line Item</TableHead>
                        {fiscalYears.map((year) => (
                          <TableHead key={year} className="min-w-[120px] text-right">
                            {year}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(editMode ? editedBalanceItems : balanceItems).map((row, idx) => (
                        <TableRow key={row.item}>
                          <TableCell className="font-medium">{row.item}</TableCell>
                          {row.values.map((_, valueIdx) =>
                            renderTableCell(row, idx, valueIdx, 'balance')
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="cashflow" className="mt-4">
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px] bg-muted/50">Line Item</TableHead>
                        {fiscalYears.map((year) => (
                          <TableHead key={year} className="min-w-[120px] text-right">
                            {year}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(editMode ? editedCashFlowItems : cashFlowItems).map((row, idx) => (
                        <TableRow key={row.item}>
                          <TableCell className="font-medium">{row.item}</TableCell>
                          {row.values.map((_, valueIdx) =>
                            renderTableCell(row, idx, valueIdx, 'cashflow')
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </Card>

        {/* Normalization Adjustments Section */}
        <NormalizationAdjustments
          years={fiscalYears}
          incomeStatementItems={incomeItems}
          balanceSheetItems={balanceItems}
          cashFlowItems={cashFlowItems}
        />
      </div>

      {/* Data Source Management Dialog */}
      <Dialog open={showDataSourceDialog} onOpenChange={setShowDataSourceDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Manage Data Source</DialogTitle>
            <DialogDescription>
              Select how you want to manage financial data for this company.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="manual-input"
                  name="data-source"
                  value="manual"
                  checked={selectedDataSource === 'manual'}
                  onChange={() => setSelectedDataSource('manual')}
                  className="h-4 w-4 text-primary"
                />
                <label htmlFor="manual-input" className="text-sm font-medium">
                  Manual Input
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="csv-upload"
                  name="data-source"
                  value="csv"
                  checked={selectedDataSource === 'csv'}
                  onChange={() => setSelectedDataSource('csv')}
                  className="h-4 w-4 text-primary"
                />
                <label htmlFor="csv-upload" className="text-sm font-medium">
                  CSV Upload
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="api-connection"
                  name="data-source"
                  value="api"
                  checked={selectedDataSource === 'api'}
                  onChange={() => setSelectedDataSource('api')}
                  className="h-4 w-4 text-primary"
                />
                <label htmlFor="api-connection" className="text-sm font-medium">
                  API Connection
                </label>
              </div>

              {selectedDataSource === 'api' && (
                <div className="mt-4 space-y-4 pl-6">
                  <div className="space-y-2">
                    <label htmlFor="api-endpoint" className="text-sm font-medium">
                      API Endpoint URL
                    </label>
                    <Input
                      id="api-endpoint"
                      value={apiEndpoint}
                      onChange={(e) => setApiEndpoint(e.target.value)}
                      placeholder="https://api.example.com/financials"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="api-key" className="text-sm font-medium">
                      API Key
                    </label>
                    <Input
                      id="api-key"
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Enter your API key"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDataSourceDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveDataSourceSettings}>Save Settings</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
