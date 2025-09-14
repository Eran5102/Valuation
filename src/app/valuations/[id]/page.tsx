'use client'

import React, { useState, useEffect } from 'react'
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
  X
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TabButton } from '@/components/ui/tab-button'
import AppLayout from '@/components/layout/AppLayout'
import ValuationAssumptions from '@/components/valuation/ValuationAssumptions'
import ImprovedCapTable from '@/components/valuation/ImprovedCapTable'
import DLOMModels from '@/components/valuation/DLOMModels'
import BreakpointsAnalysis from '@/components/valuation/BreakpointsAnalysis'
import ComprehensiveWaterfall from '@/components/valuation/ComprehensiveWaterfall'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'

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

  // Save assumptions data to the database
  const saveAssumptionsData = async (categories: any[]) => {
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
        // Update local state to reflect the saved data structure
        setAssumptionCategories(categories)
        // Update the project data to reflect the new assumptions for DLOM component
        setProject(prevProject => prevProject ? { ...prevProject, assumptions: flatAssumptions } : prevProject)
      } else {
        console.error('Failed to save assumptions data')
      }
    } catch (error) {
      console.error('Error saving assumptions data:', error)
    }
  }

  // Save cap table data to the database
  const saveCapTableData = async (data: { shareClasses: any[]; options: any[] }) => {
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
  }

  useEffect(() => {
    if (id) {
      fetchValuation()
    }
  }, [id])

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
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(project.status)}`}>
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
            <ValuationAssumptions 
              valuationId={id!}
              initialCategories={assumptionCategories.length > 0 ? assumptionCategories : undefined}
              onSave={async (categories) => {
                console.log('Saving assumption categories:', categories);
                // Store categories for use in DLOM tab
                setAssumptionCategories(categories);
                // Save to database
                await saveAssumptionsData(categories);
              }}
            />
          )}

          {activeTab === 'captable' && (
            <ImprovedCapTable 
              valuationId={id!}
              onSave={async (data) => {
                console.log('Saving cap table data:', data);
                
                // Store the full cap table configuration for breakpoint calculations
                setCurrentCapTableConfig(data);
                
                // Save to database
                await saveCapTableData(data);
                
                // Update overview statistics based on cap table data
                const totalShares = data.shareClasses.reduce((sum, sc) => sum + sc.sharesOutstanding, 0);
                const totalInvested = data.shareClasses.reduce((sum, sc) => sum + (sc.amountInvested || 0), 0);
                const totalOptions = data.options.reduce((sum, option) => sum + option.numOptions, 0);
                
                setCapTableData({
                  totalShareClasses: data.shareClasses.length,
                  totalShares,
                  totalInvested,
                  totalOptions
                });
                
                console.log(`Total shares: ${totalShares}, Total invested: $${totalInvested}, Total options: ${totalOptions}`);
              }}
            />
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
            <DLOMModels assumptions={(project as any)?.assumptions || assumptionCategories} />
          )}

          {activeTab === 'breakpoints' && (
            <BreakpointsAnalysis 
              valuationId={id!}
              companyId={project?.companyId}
              capTableConfig={currentCapTableConfig}
            />
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
            <ComprehensiveWaterfall 
              companyId={parseInt(project?.companyId || '0')}
              capTableConfig={currentCapTableConfig}
            />
          )}
        </div>
      </div>
    </AppLayout>
  )
}