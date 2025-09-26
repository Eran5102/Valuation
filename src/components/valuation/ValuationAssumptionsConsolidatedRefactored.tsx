'use client'

import React, { useCallback } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Save,
  AlertCircle,
  Search,
  Filter,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { ValuationMethodologySelector } from './ValuationMethodologySelector'
import { RiskFreeRateInput } from './RiskFreeRateInput'
import { VolatilityInput } from './VolatilityInput'
import { useMethodologyStore } from '@/hooks/useMethodologyStore'

// Import our extracted components and hooks
import { ValuationAssumptionsProps } from './assumptions/types'
import { useAssumptionsData } from './assumptions/hooks/use-assumptions-data'
import { useSectionNavigation } from './assumptions/hooks/use-section-navigation'
import { useTeamManagement } from './assumptions/hooks/use-team-management'
import { TeamManagementField } from './assumptions/components/TeamManagementField'
import { InvestorManagementField } from './assumptions/components/InvestorManagementField'
import { FieldRenderer } from './assumptions/components/FieldRenderer'
import { stageDescriptions } from './assumptions/constants'

export default function ValuationAssumptionsConsolidatedRefactored({
  valuationId,
}: ValuationAssumptionsProps) {
  const { methodologies } = useMethodologyStore()

  // Use our extracted hooks
  const {
    assumptions,
    setAssumptions,
    managementTeam,
    setManagementTeam,
    keyInvestors,
    setKeyInvestors,
    hasChanges,
    setHasChanges,
    isSaving,
    isLoading,
    handleSave,
  } = useAssumptionsData(valuationId)

  const {
    expandedSections,
    activeSection,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    toggleSection,
    scrollToSection,
    getFilteredSections,
    getCompletionStats,
  } = useSectionNavigation()

  // Handle field value changes
  const handleFieldChange = useCallback(
    (sectionId: string, fieldId: string, value: any) => {
      setAssumptions((prev) => ({
        ...prev,
        [`${sectionId}.${fieldId}`]: value,
      }))
      setHasChanges(true)

      // Auto-populate stage description when company stage is selected
      if (sectionId === 'company_profile' && fieldId === 'company_stage' && value) {
        const description = stageDescriptions[value as string] || ''
        if (description) {
          setAssumptions((prev) => ({
            ...prev,
            'company_profile.stage_description': description,
          }))
        }
      }
    },
    [setAssumptions, setHasChanges]
  )

  const {
    addTeamMember,
    updateTeamMember,
    removeTeamMember,
    addInvestor,
    updateInvestor,
    removeInvestor,
  } = useTeamManagement(
    managementTeam,
    setManagementTeam,
    keyInvestors,
    setKeyInvestors,
    handleFieldChange
  )

  const stats = getCompletionStats(assumptions)
  const filteredSections = getFilteredSections(assumptions)

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading assumptions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full gap-6">
      {/* Main Content */}
      <div className="flex-1 space-y-6 overflow-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Valuation Assumptions</h1>
              <p className="mt-1 text-muted-foreground">
                Configure all assumptions and inputs for your valuation
              </p>
            </div>
            <div className="flex items-center gap-2">
              {hasChanges && (
                <Badge variant="outline" className="bg-yellow-50">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  Unsaved changes
                </Badge>
              )}
              <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="mt-4 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assumptions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fields</SelectItem>
                <SelectItem value="required">Required Only</SelectItem>
                <SelectItem value="incomplete">Incomplete Required</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {filteredSections.map((section) => {
            const Icon = section.icon
            const isExpanded = expandedSections.includes(section.id)
            const isActive = activeSection === section.id

            return (
              <Card
                key={section.id}
                id={`section-${section.id}`}
                className={cn('transition-all', isActive && 'ring-2 ring-primary')}
              >
                <CardHeader className="cursor-pointer" onClick={() => toggleSection(section.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-base">{section.name}</CardTitle>
                        {section.description && (
                          <CardDescription className="mt-1">{section.description}</CardDescription>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {section.id !== 'methodology' && (
                        <Badge variant="outline">
                          {section.fields.filter((f) => assumptions[`${section.id}.${f.id}`]).length}
                          /{section.fields.length}
                        </Badge>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0">
                    {section.id === 'methodology' ? (
                      <ValuationMethodologySelector />
                    ) : section.id === 'volatility' ? (
                      <div className="space-y-4">
                        {/* Two-column layout for Risk-Free Rate and Volatility */}
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                          {/* Risk-Free Rate Column */}
                          <div className="space-y-2">
                            <RiskFreeRateInput
                              assumption={{
                                id: 'risk_free_rate',
                                name: 'Risk-Free Rate (%)',
                                value: assumptions['volatility.risk_free_rate'] || 4.5,
                                type: 'percentage',
                                description: 'Current risk-free rate for option pricing',
                                required: true,
                              }}
                              categoryId="volatility"
                              onChange={handleFieldChange}
                              valuationDate={assumptions['company.valuation_date']}
                              timeToLiquidity={assumptions['volatility.time_to_liquidity'] || 3}
                            />
                          </div>

                          {/* Volatility Column */}
                          <div className="space-y-2">
                            <VolatilityInput
                              assumption={{
                                id: 'equity_volatility',
                                name: 'Equity Volatility (%)',
                                value: assumptions['volatility.equity_volatility'] || 60,
                                type: 'percentage',
                                description: 'Expected volatility of equity',
                              }}
                              categoryId="volatility"
                              onChange={handleFieldChange}
                            />
                          </div>
                        </div>

                        {/* Time to Liquidity - Full width below */}
                        <div className="mt-4">
                          <FieldRenderer
                            field={{
                              id: 'time_to_liquidity',
                              name: 'Expected Time to Liquidity (Years)',
                              type: 'number',
                              value: 3,
                              description: 'Expected time until a liquidity event (IPO, acquisition, etc.)',
                            }}
                            sectionId="volatility"
                            assumptions={assumptions}
                            handleFieldChange={handleFieldChange}
                          />
                        </div>
                      </div>
                    ) : section.id === 'company_profile' ? (
                      <div className="space-y-4">
                        {section.fields.map((field) => {
                          // Handle special field types
                          if (field.type === 'team') {
                            return (
                              <TeamManagementField
                                key={field.id}
                                field={field}
                                managementTeam={managementTeam}
                                addTeamMember={addTeamMember}
                                updateTeamMember={updateTeamMember}
                                removeTeamMember={removeTeamMember}
                              />
                            )
                          }

                          if (field.type === 'investors') {
                            return (
                              <InvestorManagementField
                                key={field.id}
                                field={field}
                                keyInvestors={keyInvestors}
                                addInvestor={addInvestor}
                                updateInvestor={updateInvestor}
                                removeInvestor={removeInvestor}
                              />
                            )
                          }

                          // Regular fields
                          return (
                            <FieldRenderer
                              key={field.id}
                              field={field}
                              sectionId={section.id}
                              assumptions={assumptions}
                              handleFieldChange={handleFieldChange}
                            />
                          )
                        })}
                      </div>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2">
                        {section.fields.map((field) => (
                          <FieldRenderer
                            key={field.id}
                            field={field}
                            sectionId={section.id}
                            assumptions={assumptions}
                            handleFieldChange={handleFieldChange}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-80 space-y-4">
        {/* Completion Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Completion Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span className="font-medium">{Math.round(stats.completionPercentage)}%</span>
              </div>
              <Progress value={stats.completionPercentage} className="mt-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span>Required Fields</span>
                <span className="font-medium">{Math.round(stats.requiredPercentage)}%</span>
              </div>
              <Progress value={stats.requiredPercentage} className="mt-2" />
            </div>
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Fields</span>
                <span className="font-medium">{stats.totalFields}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completed</span>
                <span className="font-medium text-green-600">{stats.completedFields}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Required</span>
                <span className="font-medium">{stats.requiredFields}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Required Complete</span>
                <span className="font-medium text-green-600">
                  {stats.requiredCompleted}/{stats.requiredFields}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Navigation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Navigation</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-1">
                {filteredSections.map((section) => {
                  const Icon = section.icon
                  const sectionStats = section.fields.filter(
                    (f) => assumptions[`${section.id}.${f.id}`]
                  ).length

                  return (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted',
                        activeSection === section.id && 'bg-muted'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span>{section.name}</span>
                      </div>
                      {section.id !== 'methodology' && (
                        <Badge variant="outline" className="h-5 px-1 text-xs">
                          {sectionStats}/{section.fields.length}
                        </Badge>
                      )}
                    </button>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Active Methodologies Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active Methodologies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {methodologies
                .filter((m) => m.enabled)
                .map((method) => (
                  <div key={method.id} className="flex items-center justify-between text-sm">
                    <span>{method.name}</span>
                    <Badge variant="secondary">{method.weight}%</Badge>
                  </div>
                ))}
              {methodologies.filter((m) => m.enabled).length === 0 && (
                <p className="text-sm text-muted-foreground">No methodologies selected</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}