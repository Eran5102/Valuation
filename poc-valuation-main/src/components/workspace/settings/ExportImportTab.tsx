import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
  File,
  FileJson,
  Info,
  Check,
} from 'lucide-react'

export default function ExportImportTab() {
  const [selectedFormat, setSelectedFormat] = useState('excel')
  const [importing, setImporting] = useState(false)
  const [importSuccess, setImportSuccess] = useState(false)

  const handleExport = () => {
    // In a real app, this would trigger an actual export
    toast.success(`Exporting project data in ${selectedFormat} format`)
  }

  const handleImport = () => {
    // Simulate import process
    setImporting(true)
    setTimeout(() => {
      setImporting(false)
      setImportSuccess(true)
      toast.success('Data imported successfully')

      setTimeout(() => {
        setImportSuccess(false)
      }, 3000)
    }, 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Export & Import</h3>
        <p className="text-sm text-muted-foreground">
          Export project data or import data from external sources.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Export Section */}
        <div className="rounded-md border p-5">
          <h4 className="text-md mb-4 flex items-center font-medium">
            <Download className="mr-2 h-4 w-4" />
            Export Project Data
          </h4>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Export Format</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={selectedFormat === 'excel' ? 'default' : 'outline'}
                  className="justify-start"
                  onClick={() => setSelectedFormat('excel')}
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Excel (.xlsx)
                </Button>
                <Button
                  type="button"
                  variant={selectedFormat === 'csv' ? 'default' : 'outline'}
                  className="justify-start"
                  onClick={() => setSelectedFormat('csv')}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  CSV
                </Button>
                <Button
                  type="button"
                  variant={selectedFormat === 'pdf' ? 'default' : 'outline'}
                  className="justify-start"
                  onClick={() => setSelectedFormat('pdf')}
                >
                  <File className="mr-2 h-4 w-4" />
                  PDF Report
                </Button>
                <Button
                  type="button"
                  variant={selectedFormat === 'json' ? 'default' : 'outline'}
                  className="justify-start"
                  onClick={() => setSelectedFormat('json')}
                >
                  <FileJson className="mr-2 h-4 w-4" />
                  JSON
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Export Options</Label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input type="checkbox" id="includeForecast" className="mr-2" defaultChecked />
                  <Label htmlFor="includeForecast" className="text-sm font-normal">
                    Include forecast data
                  </Label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="includeHistorical" className="mr-2" defaultChecked />
                  <Label htmlFor="includeHistorical" className="text-sm font-normal">
                    Include historical data
                  </Label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="includeCharts" className="mr-2" defaultChecked />
                  <Label htmlFor="includeCharts" className="text-sm font-normal">
                    Include charts and visualizations
                  </Label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="includeAssumptions" className="mr-2" defaultChecked />
                  <Label htmlFor="includeAssumptions" className="text-sm font-normal">
                    Include assumptions
                  </Label>
                </div>
              </div>
            </div>

            <Button onClick={handleExport} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>
          </div>
        </div>

        {/* Import Section */}
        <div className="rounded-md border p-5">
          <h4 className="text-md mb-4 flex items-center font-medium">
            <Upload className="mr-2 h-4 w-4" />
            Import Data
          </h4>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Supported Import Formats</Label>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <FileSpreadsheet className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Excel (.xlsx, .xls)</span>
                </div>
                <div className="flex items-center">
                  <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>CSV</span>
                </div>
                <div className="flex items-center">
                  <FileJson className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>JSON</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center rounded-md border-2 border-dashed p-6 text-center">
              {importSuccess ? (
                <div className="flex flex-col items-center text-green-600">
                  <div className="mb-2 rounded-full bg-green-100 p-2">
                    <Check className="h-5 w-5" />
                  </div>
                  <p className="font-medium">Import Successful</p>
                  <p className="mt-1 text-xs">Data has been imported and processed</p>
                </div>
              ) : importing ? (
                <div>
                  <div className="mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
                  <p className="text-sm">Processing data...</p>
                </div>
              ) : (
                <>
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm">Drag & drop files here, or click to select files</p>
                  <p className="mt-1 text-xs text-muted-foreground">Maximum file size: 10MB</p>
                </>
              )}
            </div>

            <Button onClick={handleImport} disabled={importing || importSuccess} className="w-full">
              <Upload className="mr-2 h-4 w-4" />
              {importing ? 'Importing...' : importSuccess ? 'Imported' : 'Select and Import Files'}
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 text-blue-600" />
          <div>
            <h4 className="text-sm font-medium text-blue-800">Import Data Guidance</h4>
            <p className="mt-1 text-xs text-blue-700">
              When importing data, ensure your files match the expected format structure. For
              template files and import specifications, see the{' '}
              <a href="#" className="underline">
                import documentation
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
