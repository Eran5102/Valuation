'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  AlertCircle,
  Database,
  Settings,
  Zap,
  Download,
  Upload,
  FileJson,
  TreePine,
} from 'lucide-react'
import { fieldMappingService } from '@/lib/templates/fieldMappingService'
import type { FieldMapping } from '@/lib/templates/templateDataMapper'
import { SourcePathExplorer } from '@/components/templates/SourcePathExplorer'
import { toast } from 'sonner'

interface AdminFieldMapping {
  sourceModule: 'valuation' | 'manual' | 'company' | 'dlom' | 'assumptions' | 'capTable' | 'calculated'
  sourcePath: string
  transformer?: string
  validator?: string
  fallback?: any
  required?: boolean
}

interface AdminFieldMappings {
  [fieldId: string]: AdminFieldMapping
}

const FieldMappingsAdmin = () => {
  const [mappings, setMappings] = useState<AdminFieldMappings>({})
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedMapping, setSelectedMapping] = useState<{
    id: string
    mapping: AdminFieldMapping
  } | null>(null)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [showSourceExplorer, setShowSourceExplorer] = useState(false)
  const [stats, setStats] = useState<any>(null)

  // Form state
  const [formData, setFormData] = useState({
    fieldId: '',
    sourceModule: '',
    sourcePath: '',
    transformer: '',
    fallback: '',
    required: false,
  })

  const sourceModules = [
    { value: 'assumptions', label: 'Assumptions', icon: Settings },
    { value: 'company', label: 'Company', icon: Database },
    { value: 'valuation', label: 'Valuation', icon: Zap },
    { value: 'capTable', label: 'Cap Table', icon: Database },
    { value: 'dlom', label: 'DLOM', icon: Zap },
    { value: 'calculated', label: 'Calculated', icon: Database },
    { value: 'manual', label: 'Manual', icon: Settings },
  ]

  const transformers = [
    'formatCurrency',
    'formatPercentage',
    'formatDecimalAsPercentage',
    'formatDate',
    'calculateRevenueGrowth',
    'calculateTotalFunding',
    'calculateCommonShares',
    'calculatePreferredShares',
    'calculateOptionsOutstanding',
    'calculateFullyDilutedShares',
  ]

  useEffect(() => {
    fetchMappings()
  }, [])

  const fetchMappings = async () => {
    try {
      // Load from FieldMappingService and convert to admin format
      const serviceMappings = fieldMappingService.getAllMappings()
      setMappings(convertFromServiceMapping(serviceMappings))
      setStats(fieldMappingService.getStats())

      // Also try to fetch from API if available
      try {
        const response = await fetch('/api/field-mappings')
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            // Merge API mappings with service mappings
            setMappings({ ...serviceMappings, ...result.data })
          }
        }
      } catch (apiError) {
        // API not available, use service mappings only
      }
    } catch (error) {
      showAlert('error', 'Failed to fetch field mappings')
    } finally {
      setLoading(false)
    }
  }

  const convertToServiceMapping = (adminMapping: AdminFieldMapping): FieldMapping => {
    return {
      sourceModule: adminMapping.sourceModule,
      sourcePath: adminMapping.sourcePath,
      // Convert string transformer to function if provided
      ...(adminMapping.transformer && {
        transformer: new Function('value', 'context', `return ${adminMapping.transformer}`) as (value: any, context?: any) => any
      }),
      fallback: adminMapping.fallback,
      required: adminMapping.required,
    }
  }

  const convertFromServiceMapping = (serviceMappings: any): AdminFieldMappings => {
    const adminMappings: AdminFieldMappings = {}
    Object.entries(serviceMappings).forEach(([fieldId, mapping]: [string, any]) => {
      adminMappings[fieldId] = {
        sourceModule: mapping.sourceModule,
        sourcePath: mapping.sourcePath,
        transformer: typeof mapping.transformer === 'function' ? mapping.transformer.toString() : mapping.transformer,
        fallback: mapping.fallback,
        required: mapping.required,
      }
    })
    return adminMappings
  }

  const handleAddMapping = async () => {
    try {
      const adminMappingData: AdminFieldMapping = {
        sourceModule: formData.sourceModule as AdminFieldMapping['sourceModule'],
        sourcePath: formData.sourcePath,
        ...(formData.transformer && { transformer: formData.transformer }),
        ...(formData.fallback && { fallback: formData.fallback }),
        required: formData.required,
      }

      // Convert to service format and add to service
      const serviceMappingData = convertToServiceMapping(adminMappingData)
      fieldMappingService.addMapping(formData.fieldId, serviceMappingData)

      // Try to save to API as well
      try {
        await fetch('/api/field-mappings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fieldId: formData.fieldId,
            mapping: adminMappingData,
          }),
        })
      } catch (apiError) {
        // API not available, but saved locally
      }

      toast.success('Field mapping added successfully')
      setIsAddDialogOpen(false)
      resetForm()
      fetchMappings()
    } catch (error) {
      toast.error('Failed to add field mapping')
    }
  }

  const handleExport = () => {
    try {
      const exportData = fieldMappingService.exportMappings()
      const blob = new Blob([exportData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `field-mappings-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Field mappings exported successfully')
    } catch (error) {
      toast.error('Failed to export field mappings')
    }
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e: any) => {
      const file = e.target.files[0]
      if (file) {
        try {
          const text = await file.text()
          const result = fieldMappingService.importMappings(text)
          if (result.success) {
            toast.success('Field mappings imported successfully')
            fetchMappings()
          } else {
            toast.error('Import failed: ' + result.errors.join(', '))
          }
        } catch (error) {
          toast.error('Failed to import field mappings')
        }
      }
    }
    input.click()
  }

  const resetForm = () => {
    setFormData({
      fieldId: '',
      sourceModule: '',
      sourcePath: '',
      transformer: '',
      fallback: '',
      required: false,
    })
  }

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message })
    setTimeout(() => setAlert(null), 5000)
  }

  const getModuleIcon = (module: string) => {
    const moduleData = sourceModules.find((m) => m.value === module)
    if (!moduleData) return Database
    return moduleData.icon
  }

  const getModuleBadgeColor = (module: string) => {
    const colors: Record<string, string> = {
      assumptions: 'bg-primary/10 text-primary',
      company: 'bg-green-100 text-green-800',
      valuation: 'bg-purple-100 text-purple-800',
      capTable: 'bg-orange-100 text-orange-800',
      dlom: 'bg-red-100 text-red-800',
      calculated: 'bg-yellow-100 text-yellow-800',
      manual: 'bg-gray-100 text-gray-800',
    }
    return colors[module] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-2">Loading field mappings...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-7xl p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Field Mappings Management</h1>
          <p className="text-muted-foreground">
            Manage how valuation data maps to template variables
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImport}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" asChild>
            <a href="/help/field-mapping" target="_blank">
              View Help
            </a>
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Field Mapping
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Field Mapping</DialogTitle>
                <DialogDescription>
                  Create a new mapping between a template field and a data source
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fieldId">Template Field ID</Label>
                    <Input
                      id="fieldId"
                      value={formData.fieldId}
                      onChange={(e) => setFormData({ ...formData, fieldId: e.target.value })}
                      placeholder="e.g., company_revenue"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sourceModule">Source Module</Label>
                    <Select
                      value={formData.sourceModule}
                      onValueChange={(value) => setFormData({ ...formData, sourceModule: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select source module" />
                      </SelectTrigger>
                      <SelectContent>
                        {sourceModules.map((module) => (
                          <SelectItem key={module.value} value={module.value}>
                            {module.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="sourcePath">Source Path</Label>
                  <div className="flex gap-2">
                    <Input
                      id="sourcePath"
                      value={formData.sourcePath}
                      onChange={(e) => setFormData({ ...formData, sourcePath: e.target.value })}
                      placeholder="e.g., financial_metrics.revenue_current"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowSourceExplorer(true)}
                    >
                      <TreePine className="mr-2 h-4 w-4" />
                      Browse
                    </Button>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Use dot notation to specify the path to the field, or click Browse to explore available paths
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="transformer">Transformer (Optional)</Label>
                    <Select
                      value={formData.transformer}
                      onValueChange={(value) => setFormData({ ...formData, transformer: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select transformer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {transformers.map((transformer) => (
                          <SelectItem key={transformer} value={transformer}>
                            {transformer}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="fallback">Fallback Value (Optional)</Label>
                    <Input
                      id="fallback"
                      value={formData.fallback}
                      onChange={(e) => setFormData({ ...formData, fallback: e.target.value })}
                      placeholder="Default value if field is missing"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="required"
                    checked={formData.required}
                    onCheckedChange={(checked) => setFormData({ ...formData, required: !!checked })}
                  />
                  <Label htmlFor="required">Required field</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddMapping}
                  disabled={!formData.fieldId || !formData.sourceModule || !formData.sourcePath}
                >
                  Add Mapping
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {alert && (
        <Alert
          className={`mb-6 ${alert.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
        >
          {alert.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="mappings">All Mappings</TabsTrigger>
          <TabsTrigger value="test">Test Mapping</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {stats && (
            <div className="mb-6 rounded-lg bg-muted/50 p-4">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Fields</p>
                  <p className="text-2xl font-bold">{stats.totalFields}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mapped Fields</p>
                  <p className="text-2xl font-bold">{stats.mappedFields}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Required Fields</p>
                  <p className="text-2xl font-bold">{stats.requiredFields}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Missing Required</p>
                  <p className="text-2xl font-bold">{stats.missingRequired}</p>
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Mappings</p>
                    <p className="text-2xl font-bold">{Object.keys(mappings).length}</p>
                  </div>
                  <Database className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            {sourceModules.map((module) => {
              const count = Object.values(mappings).filter(
                (m) => m.sourceModule === module.value
              ).length
              const Icon = module.icon
              return (
                <Card key={module.value}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{module.label}</p>
                        <p className="text-2xl font-bold">{count}</p>
                      </div>
                      <Icon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="mappings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Field Mappings</CardTitle>
              <CardDescription>View and manage all configured field mappings</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field ID</TableHead>
                    <TableHead>Source Module</TableHead>
                    <TableHead>Source Path</TableHead>
                    <TableHead>Transformer</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(mappings).map(([fieldId, mapping]) => (
                    <TableRow key={fieldId}>
                      <TableCell className="font-medium">{fieldId}</TableCell>
                      <TableCell>
                        <Badge className={getModuleBadgeColor(mapping.sourceModule)}>
                          {mapping.sourceModule}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{mapping.sourcePath}</TableCell>
                      <TableCell>{typeof mapping.transformer === 'function' ? (mapping.transformer as Function).name || 'custom' : mapping.transformer || '-'}</TableCell>
                      <TableCell>
                        {mapping.required ? (
                          <Badge variant="destructive">Required</Badge>
                        ) : (
                          <Badge variant="secondary">Optional</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedMapping({ id: fieldId, mapping })}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Field Mapping</CardTitle>
              <CardDescription>Test your field mappings with real valuation data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Valuation ID</Label>
                  <Input placeholder="Enter valuation ID to test with" defaultValue="1" />
                </div>
                <Button>Test All Mappings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Mapping Dialog */}
      {selectedMapping && (
        <Dialog open={!!selectedMapping} onOpenChange={() => setSelectedMapping(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Field Mapping Details</DialogTitle>
              <DialogDescription>Details for field: {selectedMapping.id}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Source Module</Label>
                <div className="mt-1">
                  <Badge className={getModuleBadgeColor(selectedMapping.mapping.sourceModule)}>
                    {selectedMapping.mapping.sourceModule}
                  </Badge>
                </div>
              </div>
              <div>
                <Label>Source Path</Label>
                <code className="mt-1 block rounded bg-muted p-2 text-sm">
                  {selectedMapping.mapping.sourcePath}
                </code>
              </div>
              {selectedMapping.mapping.transformer && (
                <div>
                  <Label>Transformer</Label>
                  <code className="mt-1 block rounded bg-muted p-2 text-sm">
                    {typeof selectedMapping.mapping.transformer === 'function'
                      ? (selectedMapping.mapping.transformer as Function).name || 'custom'
                      : selectedMapping.mapping.transformer}
                  </code>
                </div>
              )}
              {selectedMapping.mapping.fallback && (
                <div>
                  <Label>Fallback Value</Label>
                  <code className="mt-1 block rounded bg-muted p-2 text-sm">
                    {JSON.stringify(selectedMapping.mapping.fallback)}
                  </code>
                </div>
              )}
              <div>
                <Label>Required</Label>
                <div className="mt-1">
                  {selectedMapping.mapping.required ? (
                    <Badge variant="destructive">Required</Badge>
                  ) : (
                    <Badge variant="secondary">Optional</Badge>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedMapping(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Source Path Explorer Dialog */}
      <Dialog open={showSourceExplorer} onOpenChange={setShowSourceExplorer}>
        <DialogContent className="max-h-[80vh] max-w-4xl">
          <DialogHeader>
            <DialogTitle>Browse Available Data Paths</DialogTitle>
            <DialogDescription>
              Click on any path to use it in your field mapping
            </DialogDescription>
          </DialogHeader>
          <div className="h-[500px] overflow-hidden">
            <SourcePathExplorer
              onSelectPath={(path) => {
                setFormData({ ...formData, sourcePath: path })
                setShowSourceExplorer(false)
                toast.success(`Selected path: ${path}`)
              }}
              selectedModule={formData.sourceModule}
              className="h-full"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default FieldMappingsAdmin
