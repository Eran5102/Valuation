'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Code, Database, Zap, Settings } from 'lucide-react';

const FieldMappingHelp = () => {
  const [openSections, setOpenSections] = useState<string[]>(['overview']);

  const toggleSection = (section: string) => {
    setOpenSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const sourceModules = [
    { id: 'assumptions', name: 'Assumptions', icon: Settings, desc: 'Data from assumptions tab' },
    { id: 'company', name: 'Company', icon: Database, desc: 'Company profile data' },
    { id: 'valuation', name: 'Valuation', icon: Zap, desc: 'Valuation record data' },
    { id: 'capTable', name: 'Cap Table', icon: Database, desc: 'Cap table calculations' },
    { id: 'dlom', name: 'DLOM', icon: Zap, desc: 'DLOM calculations' },
    { id: 'calculated', name: 'Calculated', icon: Code, desc: 'Real-time calculations' }
  ];

  const examples = [
    {
      field: 'company_name',
      sourceModule: 'company',
      sourcePath: 'name',
      transformer: 'none',
      description: 'Maps company name from company profile'
    },
    {
      field: 'revenue_current',
      sourceModule: 'assumptions',
      sourcePath: 'financial_metrics.revenue_current',
      transformer: 'formatCurrency',
      description: 'Formats revenue as currency from assumptions'
    },
    {
      field: 'fully_diluted_shares',
      sourceModule: 'calculated',
      sourcePath: 'fully_diluted_shares',
      transformer: 'calculateFullyDilutedShares',
      description: 'Calculates total shares from cap table data'
    }
  ];

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Field Mapping System</h1>
        <p className="text-muted-foreground">
          Learn how to connect your valuation data to template variables automatically
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
          <TabsTrigger value="api">API Reference</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                System Overview
              </CardTitle>
              <CardDescription>
                The field mappings system automatically connects your valuation data to template variables
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sourceModules.map((module) => {
                  const Icon = module.icon;
                  return (
                    <Card key={module.id} className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="h-4 w-4" />
                        <h4 className="font-medium">{module.name}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">{module.desc}</p>
                      <Badge variant="outline" className="mt-2">
                        {module.id}
                      </Badge>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">1</div>
                  <div>
                    <h4 className="font-medium">Data Sources</h4>
                    <p className="text-sm text-muted-foreground">
                      Data is collected from 6 different modules: assumptions, company, valuation, cap table, DLOM, and calculated values
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">2</div>
                  <div>
                    <h4 className="font-medium">Field Mapping</h4>
                    <p className="text-sm text-muted-foreground">
                      Each template field is mapped to a specific data source with transformation and validation rules
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">3</div>
                  <div>
                    <h4 className="font-medium">Template Population</h4>
                    <p className="text-sm text-muted-foreground">
                      Template variables are automatically populated with formatted, validated data
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Field Mapping Configuration</CardTitle>
              <CardDescription>
                Each field mapping consists of these components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Collapsible
                  open={openSections.includes('sourceModule')}
                  onOpenChange={() => toggleSection('sourceModule')}
                >
                  <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
                    {openSections.includes('sourceModule') ?
                      <ChevronDown className="h-4 w-4" /> :
                      <ChevronRight className="h-4 w-4" />
                    }
                    <h4 className="font-medium">Source Module</h4>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 ml-6 space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Specifies which data source to use for this field
                    </p>
                    <div className="bg-muted p-3 rounded-md">
                      <code className="text-sm">
                        sourceModule: 'assumptions' | 'company' | 'valuation' | 'capTable' | 'dlom' | 'calculated' | 'manual'
                      </code>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible
                  open={openSections.includes('sourcePath')}
                  onOpenChange={() => toggleSection('sourcePath')}
                >
                  <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
                    {openSections.includes('sourcePath') ?
                      <ChevronDown className="h-4 w-4" /> :
                      <ChevronRight className="h-4 w-4" />
                    }
                    <h4 className="font-medium">Source Path</h4>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 ml-6 space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Dot notation path to the specific field in the data source
                    </p>
                    <div className="bg-muted p-3 rounded-md">
                      <code className="text-sm">
                        sourcePath: 'financial_metrics.revenue_current'
                      </code>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible
                  open={openSections.includes('transformer')}
                  onOpenChange={() => toggleSection('transformer')}
                >
                  <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
                    {openSections.includes('transformer') ?
                      <ChevronDown className="h-4 w-4" /> :
                      <ChevronRight className="h-4 w-4" />
                    }
                    <h4 className="font-medium">Transformer</h4>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 ml-6 space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Function to format the raw value (optional)
                    </p>
                    <div className="bg-muted p-3 rounded-md">
                      <code className="text-sm">
                        {`transformer: (value) => formatCurrency(value)`}
                      </code>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible
                  open={openSections.includes('validation')}
                  onOpenChange={() => toggleSection('validation')}
                >
                  <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
                    {openSections.includes('validation') ?
                      <ChevronDown className="h-4 w-4" /> :
                      <ChevronRight className="h-4 w-4" />
                    }
                    <h4 className="font-medium">Validation & Fallbacks</h4>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 ml-6 space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Validation rules and fallback values
                    </p>
                    <div className="bg-muted p-3 rounded-md">
                      <code className="text-sm">
                        {`required: true,`}<br />
                        {`validator: (value) => value > 0,`}<br />
                        {`fallback: 'Default Value'`}
                      </code>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="examples" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Field Mapping Examples</CardTitle>
              <CardDescription>
                Real examples from the current system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {examples.map((example, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">{example.field}</h4>
                      <Badge variant="outline">{example.sourceModule}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{example.description}</p>
                    <div className="bg-muted p-3 rounded-md">
                      <code className="text-sm">
                        {example.field}: {'{'}
                        <br />
                        &nbsp;&nbsp;sourceModule: '{example.sourceModule}',
                        <br />
                        &nbsp;&nbsp;sourcePath: '{example.sourcePath}',
                        <br />
                        {example.transformer !== 'none' && (
                          <>
                            &nbsp;&nbsp;transformer: {example.transformer},
                            <br />
                          </>
                        )}
                        {'}'}
                      </code>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Reference</CardTitle>
              <CardDescription>
                Available endpoints and methods for field mapping
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge>GET</Badge>
                    <code className="text-sm">/api/valuations/[id]/template-data</code>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Get all mapped template data for a valuation
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge>GET</Badge>
                    <code className="text-sm">/api/field-mappings</code>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Get all current field mappings configuration
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge>POST</Badge>
                    <code className="text-sm">/api/field-mappings</code>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Add a new field mapping
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge>PUT</Badge>
                    <code className="text-sm">/api/field-mappings/[fieldId]</code>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Update an existing field mapping
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FieldMappingHelp;