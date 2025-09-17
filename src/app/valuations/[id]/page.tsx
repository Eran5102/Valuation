'use client'

import React, { useState, useEffect, Suspense, lazy, useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Calculator,
  Building2,
  Settings,
  BarChart3,
  Calendar,
  DollarSign,
  Percent,
  Download,
  Info,
  X,
  FileText,
  Plus,
  Edit,
  Eye,
  Clock,
  CheckCircle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TabButton } from '@/components/ui/tab-button'
import { Badge } from '@/components/ui/badge'
import AppLayout from '@/components/layout/AppLayout'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'

// Lazy load heavy components to improve initial page load performance
const ValuationAssumptions = lazy(() => import('@/components/valuation/ValuationAssumptions'))
const ImprovedCapTable = lazy(() => import('@/components/valuation/ImprovedCapTable'))
const DLOMModels = lazy(() => import('@/components/valuation/DLOMModels'))
const BreakpointsAnalysis = lazy(() => import('@/components/valuation/BreakpointsAnalysis'))
const ComprehensiveWaterfall = lazy(() => import('@/components/valuation/ComprehensiveWaterfall'))

interface ValuationProject {
  id: string;
  companyId: string;
  title: string;
  clientName: string;
  valuationDate: string;
  projectType: string;
  status: string;
  currency: string;
  maxProjectedYears: number;
  discountingConvention: string;
  taxRate: number;
  description: string;
}

interface FinancialAssumption {
  id: string;
  category: string;
  name: string;
  value: string;
  unit: string;
  description: string;
}

export default function ValuationDetail() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const [activeTab, setActiveTab] = useState('overview')
  const [project, setProject] = useState<ValuationProject | null>(null)
  const [assumptions, setAssumptions] = useState<FinancialAssumption[]>([])
  const [assumptionCategories, setAssumptionCategories] = useState<any[]>([])
  const [capTableData, setCapTableData] = useState<{
    totalShareClasses: number;
    totalShares: number;
    totalInvested: number;
    totalOptions: number;
  }>({
    totalShareClasses: 3,
    totalShares: 950000,
    totalInvested: 5000000,
    totalOptions: 500000
  })

  // Reports data
  const [valuationReports, setValuationReports] = useState<any[]>([])
  const [loadingReports, setLoadingReports] = useState(false)

  // Store the actual cap table configuration for breakpoint calculations
  const [currentCapTableConfig, setCurrentCapTableConfig] = useState<{
    shareClasses: any[];
    options: any[];
  }>({
    shareClasses: [],
    options: []
  })




  const fetchValuation = async () => {
    console.log('fetchValuation called with id:', id)
    try {
      const response = await fetch(`/api/valuations/${id}`)
      console.log('API response status:', response.status)
      
      if (response.ok) {
        const valuationData = await response.json()
        console.log('Valuation data received:', valuationData)
        
        // Get client name
        const clientResponse = await fetch(`/api/companies/${valuationData.companyId}`)
        const clientData = clientResponse.ok ? await clientResponse.json() : null
        console.log('Client data:', clientData)
        
        const projectData = {
          id: valuationData.id.toString(),
          companyId: valuationData.companyId.toString(),
          title: valuationData.title,
          clientName: clientData?.name || 'Unknown Client',
          valuationDate: valuationData.valuationDate,
          projectType: valuationData.valuationType,
          status: valuationData.status || 'draft',
          currency: valuationData.currency || 'USD',
          maxProjectedYears: valuationData.maxProjectedYears || 5,
          discountingConvention: valuationData.discountingConvention || 'mid_year',
          taxRate: valuationData.taxRate || 21,
          description: valuationData.description || ''
        }
        
        console.log('Setting project with data:', projectData)
        setProject(projectData)
        
        // Load cap table data and assumptions after setting project
        await loadCapTableData(id!)
        await loadAssumptionsData(id!)
      } else {
        console.error('Failed to fetch valuation')
        // Fallback to mock data if API fails
        setProject({
          id: id!,
          companyId: '1',
          title: 'Example Valuation Project',
          clientName: 'Example Client',
          valuationDate: '2024-12-15',
          projectType: '409a',
          status: 'draft',
          currency: 'USD',
          maxProjectedYears: 5,
          discountingConvention: 'mid_year',
          taxRate: 21,
          description: 'Example valuation project'
        })
      }
    } catch (error) {
      console.error('Error fetching valuation:', error)
    }
  }

  // Load cap table data from the database
  const loadCapTableData = async (valuationId: string) => {
    try {
      const response = await fetch(`/api/valuations/${valuationId}/cap-table`)
      if (response.ok) {
        const capTableData = await response.json()
        
        // Only update if we have actual data
        if (capTableData.shareClasses && capTableData.shareClasses.length > 0) {
          console.log('Loading saved cap table data:', capTableData)
          setCurrentCapTableConfig({
            shareClasses: capTableData.shareClasses,
            options: capTableData.options || []
          })
        } else {
          console.log('No saved cap table data found, using default')
        }
      }
    } catch (error) {
      console.error('Error loading cap table data:', error)
    }
  }

  // Load assumptions data from the database
  const loadAssumptionsData = async (valuationId: string) => {
    try {
      const response = await fetch(`/api/valuations/${valuationId}`)
      if (response.ok) {
        const valuation = await response.json()
        
        // Only update if we have actual assumptions data
        if (valuation.assumptions && Object.keys(valuation.assumptions).length > 0) {
          console.log('Loading saved assumptions data:', valuation.assumptions)
          setAssumptionCategories(valuation.assumptions)
        } else {
          console.log('No saved assumptions data found, using defaults')
        }
      }
    } catch (error) {
      console.error('Error loading assumptions data:', error)
    }
  }

  // Save assumptions data to the database - memoized callback
  const saveAssumptionsData = useCallback(async (categories: any[]) => {
    if (!id) return

    try {
      console.log('Saving assumptions data to database:', categories)

      // Convert categories array to flat object structure expected by DLOM component
      const flatAssumptions: any = {}
      categories.forEach(category => {
        const categoryData: any = {}
        category.assumptions.forEach((assumption: any) => {
          categoryData[assumption.id] = parseFloat(assumption.value) || 0
        })
        flatAssumptions[category.id] = categoryData
      })

      console.log('Converted flat assumptions:', flatAssumptions)

      const response = await fetch(`/api/valuations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ assumptions: flatAssumptions })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Assumptions saved successfully:', result)
        setAssumptionCategories(categories)
        setProject(prevProject => prevProject ? { ...prevProject, assumptions: flatAssumptions } : prevProject)
      } else {
        console.error('Failed to save assumptions data')
      }
    } catch (error) {
      console.error('Error saving assumptions data:', error)
    }
  }, [id])

  // Handle assumptions save - memoized callback
  const handleAssumptionsSave = useCallback(async (categories: any[]) => {
    console.log('Saving assumption categories:', categories);
    setAssumptionCategories(categories);
    await saveAssumptionsData(categories);
  }, [saveAssumptionsData])

  // Save cap table data to the database - memoized callback
  const saveCapTableData = useCallback(async (data: { shareClasses: any[]; options: any[] }) => {
    if (!id) return

    try {
      console.log('Saving cap table data to database:', data)
      const response = await fetch(`/api/valuations/${id}/cap-table`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Cap table saved successfully:', result)
      } else {
        console.error('Failed to save cap table data')
      }
    } catch (error) {
      console.error('Error saving cap table data:', error)
    }
  }, [id])

  // Load reports for this valuation
  const loadValuationReports = async () => {
    if (!id) return

    setLoadingReports(true)
    try {
      // For now, use mock data since we don't have a reports API yet
      // In the future, this would fetch from /api/valuations/${id}/reports
      const mockReports = [
        {
          id: '1',
          name: '409A Valuation Report - Draft',
          status: 'draft',
          lastModified: '2024-12-15',
          templateId: 'template-409a',
          valuationId: id
        },
        {
          id: '2',
          name: 'Board Presentation Summary',
          status: 'published',
          lastModified: '2024-12-10',
          templateId: 'template-board-summary',
          valuationId: id
        }
      ]

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))

      setValuationReports(mockReports)
    } catch (error) {
      console.error('Error loading valuation reports:', error)
      setValuationReports([])
    } finally {
      setLoadingReports(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchValuation()
    }
  }, [id])

  // Load reports when reports tab becomes active
  useEffect(() => {
    if (activeTab === 'reports' && id) {
      loadValuationReports()
    }
  }, [activeTab, id])

  // Memoized calculations to avoid unnecessary re-renders
  const capTableSummary = useMemo(() => {
    if (!currentCapTableConfig.shareClasses.length) return capTableData

    const totalShares = currentCapTableConfig.shareClasses.reduce((sum, sc) => sum + sc.sharesOutstanding, 0)
    const totalInvested = currentCapTableConfig.shareClasses.reduce((sum, sc) => sum + (sc.amountInvested || 0), 0)
    const totalOptions = currentCapTableConfig.options.reduce((sum, option) => sum + option.numOptions, 0)

    return {
      totalShareClasses: currentCapTableConfig.shareClasses.length,
      totalShares,
      totalInvested,
      totalOptions
    }
  }, [currentCapTableConfig])

  // Memoized project status styling
  const statusStyling = useMemo(() => {
    return project ? getStatusColor(project.status) : ''
  }, [project?.status])

  useEffect(() => {
    // Initialize mock data for assumptions
    setAssumptions([
      {
        id: '1',
        category: 'Revenue Growth',
        name: 'Annual Revenue Growth Rate',
        value: '25',
        unit: '%',
        description: 'Expected annual revenue growth rate for the next 5 years'
      },
      {
        id: '2',
        category: 'Profitability',
        name: 'EBITDA Margin',
        value: '15',
        unit: '%',
        description: 'Target EBITDA margin at maturity'
      },
      {
        id: '3',
        category: 'Discount Rate',
        name: 'Weighted Average Cost of Capital',
        value: '12',
        unit: '%',
        description: 'Discount rate for DCF valuation'
      },
      {
        id: '4',
        category: 'Terminal Value',
        name: 'Terminal Growth Rate',
        value: '2.5',
        unit: '%',
        description: 'Long-term growth rate beyond projection period'
      },
    ])
  }, [])

  const handleDeleteValuation = async () => {
    if (confirm('Are you sure you want to delete this valuation project? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/valuations/${id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          router.push('/valuations')
        } else {
          throw new Error('Failed to delete valuation')
        }
      } catch (error) {
        console.error('Error deleting valuation:', error)
        alert('Failed to delete valuation. Please try again.')
      }
    }
  }

  if (!project) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">Loading valuation project...</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/valuations')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Valuations
            </Button>
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Calculator className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{project.title}</h1>
                <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                  <span className="flex items-center">
                    <Building2 className="h-3 w-3 mr-1" />
                    {project.clientName}
                  </span>
                  <span className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatDate(project.valuationDate)}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${statusStyling}`}>
                    {project.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleDeleteValuation}
            >
              <X className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 p-1 bg-muted rounded-lg w-fit">
          <TabButton
            active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
            icon={Info}
          >
            Overview
          </TabButton>
          <TabButton
            active={activeTab === 'assumptions'}
            onClick={() => setActiveTab('assumptions')}
            icon={Settings}
          >
            Assumptions
          </TabButton>
          <TabButton
            active={activeTab === 'captable'}
            onClick={() => setActiveTab('captable')}
            icon={BarChart3}
          >
            Cap Table
          </TabButton>
          <TabButton
            active={activeTab === 'financial'}
            onClick={() => setActiveTab('financial')}
            icon={DollarSign}
          >
            Financial Inputs
          </TabButton>
          <TabButton
            active={activeTab === 'dlom'}
            onClick={() => setActiveTab('dlom')}
            icon={Percent}
          >
            DLOM Models
          </TabButton>
          <TabButton
            active={activeTab === 'breakpoints'}
            onClick={() => setActiveTab('breakpoints')}
            icon={BarChart3}
          >
            Breakpoints
          </TabButton>
          <TabButton
            active={activeTab === 'analysis'}
            onClick={() => setActiveTab('analysis')}
            icon={Calculator}
          >
            Analysis
          </TabButton>
          <TabButton
            active={activeTab === 'waterfall'}
            onClick={() => setActiveTab('waterfall')}
            icon={BarChart3}
          >
            Waterfall
          </TabButton>
          <TabButton
            active={activeTab === 'reports'}
            onClick={() => setActiveTab('reports')}
            icon={FileText}
          >
            Reports
          </TabButton>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
                <CardDescription>Basic information about this valuation project</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Project Type:</span>
                    <p className="font-medium">409A Valuation</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Valuation Date:</span>
                    <p className="font-medium">{formatDate(project.valuationDate)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Currency:</span>
                    <p className="font-medium">{project.currency}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Projection Period:</span>
                    <p className="font-medium">{project.maxProjectedYears} years</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tax Rate:</span>
                    <p className="font-medium">{project.taxRate}%</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Discounting:</span>
                    <p className="font-medium">{project.discountingConvention.replace('_', '-')}</p>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Description:</span>
                  <p className="mt-1">{project.description}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'assumptions' && (
            <Suspense fallback={
              <Card>
                <CardContent className="p-8">
                  <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span>Loading valuation assumptions...</span>
                  </div>
                </CardContent>
              </Card>
            }>
              <ValuationAssumptions
                valuationId={id!}
                initialCategories={assumptionCategories.length > 0 ? assumptionCategories : undefined}
                onSave={handleAssumptionsSave}
              />
            </Suspense>
          )}

          {activeTab === 'captable' && (
            <Suspense fallback={
              <Card>
                <CardContent className="p-8">
                  <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span>Loading cap table...</span>
                  </div>
                </CardContent>
              </Card>
            }>
              <ImprovedCapTable
                valuationId={id!}
                onSave={useCallback(async (data) => {
                  console.log('Saving cap table data:', data);
                  setCurrentCapTableConfig(data);
                  await saveCapTableData(data);
                  console.log('Cap table data saved and configuration updated');
                }, [saveCapTableData])}
              />
            </Suspense>
          )}

          {activeTab === 'financial' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Projections</CardTitle>
                  <CardDescription>Historical and projected revenue data</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-muted-foreground py-8">
                    Financial input forms will be implemented here
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Operating Metrics</CardTitle>
                  <CardDescription>Key operating metrics and ratios</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-muted-foreground py-8">
                    Operating metrics inputs will be implemented here
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'dlom' && (
            <Suspense fallback={
              <Card>
                <CardContent className="p-8">
                  <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span>Loading DLOM models...</span>
                  </div>
                </CardContent>
              </Card>
            }>
              <DLOMModels assumptions={(project as any)?.assumptions || assumptionCategories} />
            </Suspense>
          )}

          {activeTab === 'breakpoints' && (
            <Suspense fallback={
              <Card>
                <CardContent className="p-8">
                  <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span>Loading breakpoints analysis...</span>
                  </div>
                </CardContent>
              </Card>
            }>
              <BreakpointsAnalysis
                valuationId={id!}
                companyId={project?.companyId}
                capTableConfig={currentCapTableConfig}
              />
            </Suspense>
          )}

          {activeTab === 'analysis' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Valuation Summary</CardTitle>
                  <CardDescription>Key valuation results and metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-muted-foreground py-8">
                    Valuation analysis results will be displayed here
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sensitivity Analysis</CardTitle>
                  <CardDescription>Impact of key assumptions on valuation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-muted-foreground py-8">
                    Sensitivity analysis charts will be displayed here
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'waterfall' && (
            <Suspense fallback={
              <Card>
                <CardContent className="p-8">
                  <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span>Loading waterfall analysis...</span>
                  </div>
                </CardContent>
              </Card>
            }>
              <ComprehensiveWaterfall
                companyId={parseInt(project?.companyId || '0')}
                capTableConfig={currentCapTableConfig}
              />
            </Suspense>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6">
              {/* Reports Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Valuation Reports</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create and manage reports for this valuation project
                  </p>
                </div>
                <Button
                  onClick={() => router.push(`/reports/template-library?valuationId=${id}`)}
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create New Report</span>
                </Button>
              </div>

              {/* Existing Reports */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Report Documents
                  </CardTitle>
                  <CardDescription>
                    All reports generated for this valuation project
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingReports ? (
                    <div className="text-center py-8">
                      <div className="text-muted-foreground">Loading reports...</div>
                    </div>
                  ) : valuationReports.length > 0 ? (
                    <div className="space-y-3">
                      {valuationReports.map((report) => (
                        <div key={report.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-medium text-foreground">{report.name}</h4>
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                <span className="flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {formatDate(report.lastModified)}
                                </span>
                                <Badge variant={report.status === 'published' ? 'default' : 'secondary'}>
                                  {report.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-2" />
                              Export
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="text-center">
                          <h3 className="text-lg font-medium text-foreground">No reports yet</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Create your first report from a template to get started
                          </p>
                        </div>
                        <Button
                          onClick={() => router.push(`/reports/template-library?valuationId=${id}`)}
                          className="flex items-center space-x-2"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Create First Report</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(`/reports/template-library?valuationId=${id}`)}>
                  <CardContent className="p-6 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 mx-auto mb-4">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="font-medium text-foreground mb-2">From Template</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose from pre-built templates
                    </p>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(`/reports/generator?valuationId=${id}`)}>
                  <CardContent className="p-6 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 mx-auto mb-4">
                      <Calculator className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="font-medium text-foreground mb-2">Custom Report</h3>
                    <p className="text-sm text-muted-foreground">
                      Build from scratch with data blocks
                    </p>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(`/reports/field-mapping?valuationId=${id}`)}>
                  <CardContent className="p-6 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 mx-auto mb-4">
                      <BarChart3 className="h-6 w-6 text-purple-600" />
                    </div>
                    <h3 className="font-medium text-foreground mb-2">Data Mapping</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure data field mappings
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}