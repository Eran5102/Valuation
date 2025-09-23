import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronRight, X } from 'lucide-react'
import { formatCurrency } from '@/utils/formatters'

interface ReportContentPanelProps {
  onInsertContent: (content: string) => void
  projectData?: any
  closePanel: () => void
}

export function ReportContentPanel({
  onInsertContent,
  projectData,
  closePanel,
}: ReportContentPanelProps) {
  const [openSection, setOpenSection] = useState<string | null>(null)

  const toggleSection = (section: string) => {
    if (openSection === section) {
      setOpenSection(null)
    } else {
      setOpenSection(section)
    }
  }

  // Template content sections
  const projectDetails = `
    <div class="project-details">
      <h2>Project Details</h2>
      <table border="1" cellpadding="5" style="border-collapse: collapse; width: 100%">
        <tr>
          <th align="left">Company Name</th>
          <td>${projectData?.company || 'Acme Corporation'}</td>
        </tr>
        <tr>
          <th align="left">Valuation Date</th>
          <td>${projectData?.valuationDate || '2025-04-01'}</td>
        </tr>
        <tr>
          <th align="left">Client</th>
          <td>${projectData?.client || 'John Smith'}</td>
        </tr>
        <tr>
          <th align="left">Purpose</th>
          <td>${projectData?.purpose || 'Annual Review'}</td>
        </tr>
      </table>
    </div>
  `

  const waccDetails = `
    <div class="wacc-details">
      <h2>WACC Calculation</h2>
      <table border="1" cellpadding="5" style="border-collapse: collapse; width: 100%">
        <tr>
          <th align="left">Risk-Free Rate</th>
          <td>3.2%</td>
        </tr>
        <tr>
          <th align="left">Market Risk Premium</th>
          <td>5.0%</td>
        </tr>
        <tr>
          <th align="left">Beta</th>
          <td>1.2</td>
        </tr>
        <tr>
          <th align="left">Size Premium</th>
          <td>1.5%</td>
        </tr>
        <tr>
          <th align="left">Company-Specific Risk</th>
          <td>2.0%</td>
        </tr>
        <tr>
          <th align="left">Cost of Equity</th>
          <td>12.7%</td>
        </tr>
        <tr>
          <th align="left">Cost of Debt (Post-Tax)</th>
          <td>4.5%</td>
        </tr>
        <tr>
          <th align="left">Debt/Capital</th>
          <td>30.0%</td>
        </tr>
        <tr>
          <th align="left">Equity/Capital</th>
          <td>70.0%</td>
        </tr>
        <tr>
          <th align="left">WACC</th>
          <td>10.2%</td>
        </tr>
      </table>
    </div>
  `

  const dcfSummary = `
    <div class="dcf-summary">
      <h2>DCF Valuation Summary</h2>
      <table border="1" cellpadding="5" style="border-collapse: collapse; width: 100%">
        <tr>
          <th align="left">Present Value of Forecast Period Cash Flows</th>
          <td>$250,000,000</td>
        </tr>
        <tr>
          <th align="left">Present Value of Terminal Value</th>
          <td>$500,000,000</td>
        </tr>
        <tr>
          <th align="left">Enterprise Value</th>
          <td>$750,000,000</td>
        </tr>
        <tr>
          <th align="left">Debt</th>
          <td>($150,000,000)</td>
        </tr>
        <tr>
          <th align="left">Cash</th>
          <td>$50,000,000</td>
        </tr>
        <tr>
          <th align="left">Equity Value</th>
          <td>$650,000,000</td>
        </tr>
      </table>
    </div>
  `

  const marketApproachSummary = `
    <div class="market-approach">
      <h2>Market Approach Summary</h2>
      <table border="1" cellpadding="5" style="border-collapse: collapse; width: 100%">
        <tr>
          <th align="left">Valuation Method</th>
          <th>Multiple</th>
          <th>Value ($M)</th>
        </tr>
        <tr>
          <td>EV/Revenue (LTM)</td>
          <td>2.5x</td>
          <td>$625</td>
        </tr>
        <tr>
          <td>EV/EBITDA (LTM)</td>
          <td>12.0x</td>
          <td>$720</td>
        </tr>
        <tr>
          <td>EV/EBIT (LTM)</td>
          <td>15.5x</td>
          <td>$698</td>
        </tr>
        <tr>
          <td>P/E (LTM)</td>
          <td>18.0x</td>
          <td>$630</td>
        </tr>
      </table>
    </div>
  `

  const valuationSynthesis = `
    <div class="valuation-synthesis">
      <h2>Valuation Synthesis</h2>
      <table border="1" cellpadding="5" style="border-collapse: collapse; width: 100%">
        <tr>
          <th align="left">Valuation Method</th>
          <th>Low ($M)</th>
          <th>Midpoint ($M)</th>
          <th>High ($M)</th>
          <th>Weight</th>
        </tr>
        <tr>
          <td>Discounted Cash Flow</td>
          <td>$680</td>
          <td>$750</td>
          <td>$820</td>
          <td>50%</td>
        </tr>
        <tr>
          <td>Public Company Comps</td>
          <td>$625</td>
          <td>$680</td>
          <td>$735</td>
          <td>30%</td>
        </tr>
        <tr>
          <td>Precedent Transactions</td>
          <td>$700</td>
          <td>$775</td>
          <td>$850</td>
          <td>20%</td>
        </tr>
        <tr>
          <td><strong>Weighted Average</strong></td>
          <td><strong>$670</strong></td>
          <td><strong>$735</strong></td>
          <td><strong>$800</strong></td>
          <td>100%</td>
        </tr>
      </table>
    </div>
  `

  const sensitivitiesContent = `
    <div class="sensitivities">
      <h2>Sensitivity Analysis</h2>
      <p>WACC vs Terminal Growth Rate Impact on Enterprise Value ($M)</p>
      <table border="1" cellpadding="5" style="border-collapse: collapse; width: 100%">
        <tr>
          <th></th>
          <th>TGR: 1.5%</th>
          <th>TGR: 2.0%</th>
          <th>TGR: 2.5%</th>
          <th>TGR: 3.0%</th>
          <th>TGR: 3.5%</th>
        </tr>
        <tr>
          <th>WACC: 9.2%</th>
          <td>$810</td>
          <td>$850</td>
          <td>$895</td>
          <td>$950</td>
          <td>$1,015</td>
        </tr>
        <tr>
          <th>WACC: 9.7%</th>
          <td>$765</td>
          <td>$800</td>
          <td>$840</td>
          <td>$885</td>
          <td>$940</td>
        </tr>
        <tr>
          <th>WACC: 10.2%</th>
          <td>$725</td>
          <td>$750</td>
          <td>$790</td>
          <td>$830</td>
          <td>$875</td>
        </tr>
        <tr>
          <th>WACC: 10.7%</th>
          <td>$685</td>
          <td>$715</td>
          <td>$745</td>
          <td>$780</td>
          <td>$820</td>
        </tr>
        <tr>
          <th>WACC: 11.2%</th>
          <td>$655</td>
          <td>$680</td>
          <td>$705</td>
          <td>$735</td>
          <td>$770</td>
        </tr>
      </table>
    </div>
  `

  const qualitativeAssessment = `
    <div class="qualitative-assessment">
      <h2>Qualitative Assessment</h2>
      <h3>Strengths</h3>
      <ul>
        <li>Market-leading position in core segments</li>
        <li>Strong R&D pipeline with 5 new products in development</li>
        <li>Diversified customer base across multiple industries</li>
        <li>Experienced management team with industry expertise</li>
      </ul>
      
      <h3>Weaknesses</h3>
      <ul>
        <li>High concentration in North American markets (78% of revenue)</li>
        <li>Reliance on key supplier for critical components</li>
        <li>Lag in digital transformation initiatives compared to peers</li>
      </ul>
      
      <h3>Opportunities</h3>
      <ul>
        <li>Expansion into emerging markets in Asia-Pacific</li>
        <li>Strategic acquisitions to enhance product portfolio</li>
        <li>New partnership opportunities in adjacent markets</li>
      </ul>
      
      <h3>Threats</h3>
      <ul>
        <li>Increasing competitive pressure from low-cost alternatives</li>
        <li>Regulatory changes impacting primary market</li>
        <li>Rising raw material costs affecting margins</li>
      </ul>
    </div>
  `

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-none py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Insert Content</CardTitle>
          <Button variant="ghost" size="icon" onClick={closePanel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <Tabs defaultValue="components" className="flex flex-1 flex-col">
        <TabsList className="mx-4 grid grid-cols-2">
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="components" className="flex-1 overflow-hidden">
          <ScrollArea className="h-full px-4">
            <div className="space-y-2 py-2">
              <Collapsible
                open={openSection === 'project-info'}
                onOpenChange={() => toggleSection('project-info')}
              >
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span>Project Information</span>
                    <ChevronRight
                      className={`h-4 w-4 transition-transform ${openSection === 'project-info' ? 'rotate-90' : ''}`}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pl-4 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => onInsertContent(projectDetails)}
                  >
                    Project Details Table
                  </Button>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible open={openSection === 'dcf'} onOpenChange={() => toggleSection('dcf')}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span>DCF Analysis</span>
                    <ChevronRight
                      className={`h-4 w-4 transition-transform ${openSection === 'dcf' ? 'rotate-90' : ''}`}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pl-4 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => onInsertContent(waccDetails)}
                  >
                    WACC Calculation
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => onInsertContent(dcfSummary)}
                  >
                    DCF Summary Table
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => onInsertContent(sensitivitiesContent)}
                  >
                    Sensitivity Table
                  </Button>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible
                open={openSection === 'market'}
                onOpenChange={() => toggleSection('market')}
              >
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span>Market Approach</span>
                    <ChevronRight
                      className={`h-4 w-4 transition-transform ${openSection === 'market' ? 'rotate-90' : ''}`}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pl-4 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => onInsertContent(marketApproachSummary)}
                  >
                    Market Approach Summary
                  </Button>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible
                open={openSection === 'synthesis'}
                onOpenChange={() => toggleSection('synthesis')}
              >
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span>Valuation Synthesis</span>
                    <ChevronRight
                      className={`h-4 w-4 transition-transform ${openSection === 'synthesis' ? 'rotate-90' : ''}`}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pl-4 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => onInsertContent(valuationSynthesis)}
                  >
                    Valuation Synthesis Table
                  </Button>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible
                open={openSection === 'qualitative'}
                onOpenChange={() => toggleSection('qualitative')}
              >
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span>Qualitative Assessment</span>
                    <ChevronRight
                      className={`h-4 w-4 transition-transform ${openSection === 'qualitative' ? 'rotate-90' : ''}`}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pl-4 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => onInsertContent(qualitativeAssessment)}
                  >
                    SWOT Analysis
                  </Button>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="templates" className="flex-1 overflow-hidden">
          <ScrollArea className="h-full px-4 py-2">
            <div className="grid gap-3">
              <Card className="cursor-pointer transition-colors hover:bg-muted/50">
                <CardContent className="p-4">
                  <h3 className="mb-1 font-medium">Executive Summary Report</h3>
                  <p className="text-sm text-muted-foreground">
                    Brief overview of key findings and valuation results
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      const templateContent = `
                        <h1 style="text-align: center;">EXECUTIVE SUMMARY</h1>
                        <h2>1. Introduction</h2>
                        <p>This report presents the findings of a valuation analysis conducted for [Company Name] as of [Valuation Date].</p>
                        
                        ${projectDetails}
                        
                        <h2>2. Valuation Approach</h2>
                        <p>Multiple valuation methodologies were employed to determine a reasonable range of values for the company. These included:</p>
                        <ul>
                          <li>Discounted Cash Flow Analysis</li>
                          <li>Comparable Public Companies Analysis</li>
                          <li>Precedent Transactions Analysis</li>
                        </ul>
                        
                        <h2>3. Valuation Summary</h2>
                        ${valuationSynthesis}
                        
                        <h2>4. Qualitative Factors</h2>
                        ${qualitativeAssessment}
                        
                        <h2>5. Conclusion</h2>
                        <p>Based on our analysis, the indicated enterprise value range for [Company Name] is $[X] million to $[Y] million, with a most likely value of $[Z] million.</p>
                      `
                      onInsertContent(templateContent)
                    }}
                  >
                    Use Template
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer transition-colors hover:bg-muted/50">
                <CardContent className="p-4">
                  <h3 className="mb-1 font-medium">Detailed DCF Report</h3>
                  <p className="text-sm text-muted-foreground">
                    Comprehensive analysis of DCF methodology and results
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      const templateContent = `
                        <h1 style="text-align: center;">DETAILED DCF VALUATION ANALYSIS</h1>
                        
                        <h2>1. Overview</h2>
                        <p>This report presents a detailed analysis of the Discounted Cash Flow (DCF) valuation conducted for [Company Name].</p>
                        
                        ${projectDetails}
                        
                        <h2>2. DCF Methodology</h2>
                        <p>The DCF analysis estimates the value of the company based on its expected future cash flows, discounted to present value using an appropriate discount rate that reflects the time value of money and the risks associated with the cash flows.</p>
                        
                        <h2>3. Key Assumptions</h2>
                        <h3>Cost of Capital (WACC)</h3>
                        ${waccDetails}
                        
                        <h3>Forecast Assumptions</h3>
                        <p>[Insert forecast assumptions table]</p>
                        
                        <h2>4. DCF Results</h2>
                        ${dcfSummary}
                        
                        <h2>5. Sensitivity Analysis</h2>
                        <p>The following sensitivity table illustrates how changes in key variables impact the enterprise value.</p>
                        ${sensitivitiesContent}
                        
                        <h2>6. Conclusion</h2>
                        <p>Based on our DCF analysis, the indicated enterprise value for [Company Name] is $[X] million.</p>
                      `
                      onInsertContent(templateContent)
                    }}
                  >
                    Use Template
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer transition-colors hover:bg-muted/50">
                <CardContent className="p-4">
                  <h3 className="mb-1 font-medium">Market Approach Report</h3>
                  <p className="text-sm text-muted-foreground">
                    Analysis using comparable companies and transactions
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      const templateContent = `
                        <h1 style="text-align: center;">MARKET APPROACH VALUATION ANALYSIS</h1>
                        
                        <h2>1. Overview</h2>
                        <p>This report presents a detailed analysis of the Market Approach valuation conducted for [Company Name], including both Comparable Public Companies Analysis and Precedent Transaction Analysis.</p>
                        
                        ${projectDetails}
                        
                        <h2>2. Comparable Public Companies Analysis</h2>
                        <p>This methodology involves identifying publicly traded companies that are similar to the subject company and analyzing their trading multiples.</p>
                        
                        <h3>Selected Peer Group</h3>
                        <p>[Insert peer group table with brief descriptions]</p>
                        
                        <h3>Trading Multiples</h3>
                        ${marketApproachSummary}
                        
                        <h2>3. Precedent Transactions Analysis</h2>
                        <p>This methodology examines the acquisition prices paid for similar companies in the same industry.</p>
                        
                        <h3>Selected Transactions</h3>
                        <p>[Insert transactions table with details]</p>
                        
                        <h3>Transaction Multiples</h3>
                        <p>[Insert transaction multiples table]</p>
                        
                        <h2>4. Market Approach Conclusion</h2>
                        <p>Based on our market approach analysis, the indicated enterprise value range for [Company Name] is $[X] million to $[Y] million.</p>
                      `
                      onInsertContent(templateContent)
                    }}
                  >
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </Card>
  )
}
