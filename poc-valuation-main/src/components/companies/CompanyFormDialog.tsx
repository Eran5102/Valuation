import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Company } from '@/hooks/useCompanyManagement'
import { toast } from 'sonner'

const INDUSTRIES = [
  'Technology',
  'Manufacturing',
  'Financial Services',
  'Healthcare',
  'Retail',
  'Energy',
  'Real Estate',
  'Transportation',
]

const CURRENCIES = [
  { code: 'USD', label: 'US Dollar (USD)' },
  { code: 'EUR', label: 'Euro (EUR)' },
  { code: 'GBP', label: 'British Pound (GBP)' },
  { code: 'JPY', label: 'Japanese Yen (JPY)' },
]

const MONTHS = Array.from({ length: 12 }, (_, i) => {
  const month = new Date(0, i).toLocaleString('default', { month: 'long' })
  return { value: String(i + 1).padStart(2, '0'), label: month }
})

const NAICS_CODES = [
  { code: '11', label: 'Agriculture, Forestry, Fishing and Hunting' },
  { code: '21', label: 'Mining, Quarrying, and Oil and Gas Extraction' },
  { code: '22', label: 'Utilities' },
  { code: '23', label: 'Construction' },
  { code: '31-33', label: 'Manufacturing' },
  { code: '42', label: 'Wholesale Trade' },
  { code: '44-45', label: 'Retail Trade' },
  { code: '48-49', label: 'Transportation and Warehousing' },
  { code: '51', label: 'Information' },
  { code: '52', label: 'Finance and Insurance' },
  { code: '53', label: 'Real Estate and Rental and Leasing' },
  { code: '54', label: 'Professional, Scientific, and Technical Services' },
]

const mockTickerSearch = (query: string) => {
  const mockResults = [
    { ticker: 'AAPL', name: 'Apple Inc.' },
    { ticker: 'MSFT', name: 'Microsoft Corporation' },
    { ticker: 'GOOGL', name: 'Alphabet Inc.' },
    { ticker: 'AMZN', name: 'Amazon.com Inc.' },
    { ticker: 'META', name: 'Meta Platforms Inc.' },
  ]
  return mockResults.filter(
    (item) =>
      item.ticker.toLowerCase().includes(query.toLowerCase()) ||
      item.name.toLowerCase().includes(query.toLowerCase())
  )
}

const FORM_STEPS = [
  'Company Info',
  'Financial Details',
  'Industry & Comps',
  'Additional Info',
] as const

interface CompanyFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingCompany?: Company
  clients: Array<{ id: string; name: string }>
  onSave?: (company: Partial<Company>) => void
}

const formSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  legalName: z.string().optional(),
  industry: z.string().optional(),
  location: z.string().optional(),
  geography: z.string().optional(),
  currency: z.string({ required_error: 'Please select a reporting currency' }),
  fyEndMonth: z.string({ required_error: 'Please select a month' }),
  fyEndDay: z.string().optional(),
  clientId: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  naicsCode: z.string().optional(),
  comparables: z
    .array(
      z.object({
        ticker: z.string(),
        name: z.string(),
      })
    )
    .optional(),
})

export default function CompanyFormDialog({
  open,
  onOpenChange,
  editingCompany,
  clients,
  onSave,
}: CompanyFormDialogProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: editingCompany?.name || '',
      legalName: editingCompany?.legalName || '',
      industry: editingCompany?.industry || '',
      location: editingCompany?.location || '',
      geography: editingCompany?.geography || '',
      currency: editingCompany?.currency || '',
      fyEndMonth: editingCompany?.fyEndMonth || '',
      fyEndDay: editingCompany?.fyEndDay || '31',
      clientId: editingCompany?.clientId || '',
      description: editingCompany?.description || '',
      notes: editingCompany?.notes || '',
      naicsCode: editingCompany?.naicsCode || '',
      comparables: editingCompany?.comparables || [],
    },
  })

  // Update form values when editing company changes
  useEffect(() => {
    if (editingCompany) {
      form.reset({
        name: editingCompany.name || '',
        legalName: editingCompany.legalName || '',
        industry: editingCompany.industry || '',
        location: editingCompany.location || '',
        geography: editingCompany.geography || '',
        currency: editingCompany.currency || '',
        fyEndMonth: editingCompany.fyEndMonth || '',
        fyEndDay: editingCompany.fyEndDay || '31',
        clientId: editingCompany.clientId || '',
        description: editingCompany.description || '',
        notes: editingCompany.notes || '',
        naicsCode: editingCompany.naicsCode || '',
        comparables: editingCompany.comparables || [],
      })
    }
  }, [editingCompany, form])

  const [tickerSearch, setTickerSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Array<{ ticker: string; name: string }>>([])

  const handleTickerSearch = (query: string) => {
    setTickerSearch(query)
    if (query.length > 1) {
      const results = mockTickerSearch(query)
      setSearchResults(results)
    } else {
      setSearchResults([])
    }
  }

  const addComparable = (comparable: { ticker: string; name: string }) => {
    const currentComparables = form.getValues('comparables') || []
    if (currentComparables.length < 10) {
      form.setValue('comparables', [...currentComparables, comparable])
      setSearchResults([])
      setTickerSearch('')
    }
  }

  const removeComparable = (index: number) => {
    const currentComparables = form.getValues('comparables') || []
    form.setValue(
      'comparables',
      currentComparables.filter((_, i) => i !== index)
    )
  }

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const clientName = clients.find((c) => c.id === values.clientId)?.name || ''

    // Fix the comparables typing issue by ensuring each comparable has required fields
    const processedComparables =
      values.comparables?.map((comp) => ({
        ticker: comp.ticker,
        name: comp.name,
      })) || []

    const companyData: Partial<Company> = {
      ...values,
      id: editingCompany?.id,
      clientName,
      comparables: processedComparables,
      fyEnd: `${values.fyEndMonth}-${values.fyEndDay || '31'}`,
    }

    if (onSave) {
      onSave(companyData)
    } else {
      // Default save behavior if no onSave provided
      console.log('Company data:', companyData)
      toast.success(editingCompany ? 'Company updated successfully' : 'Company added successfully')
    }

    onOpenChange(false)
  }

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, FORM_STEPS.length))
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter company name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="legalName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Legal Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter legal name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {INDUSTRIES.map((industry) => (
                          <SelectItem key={industry} value={industry}>
                            {industry}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="geography"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Geography/HQ Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter geography" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specific Location/City</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Financial Details</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reporting Currency *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CURRENCIES.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fyEndMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Financial Year End Month *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select month" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MONTHS.map((month) => (
                          <SelectItem key={month.value} value={month.value}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fyEndDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Financial Year End Day</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Day (e.g., 31)"
                        {...field}
                        type="number"
                        min="1"
                        max="31"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Industry Classification & Comparables</h3>
            <FormField
              control={form.control}
              name="naicsCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NAICS Code & Description</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select NAICS industry" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {NAICS_CODES.map((naics) => (
                        <SelectItem key={naics.code} value={naics.code}>
                          {naics.code} - {naics.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Comparable Companies</h4>
              <div className="relative">
                <Input
                  placeholder="Search by ticker or company name"
                  value={tickerSearch}
                  onChange={(e) => handleTickerSearch(e.target.value)}
                />
                {searchResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border border-input bg-background shadow-lg">
                    {searchResults.map((result) => (
                      <button
                        key={result.ticker}
                        type="button"
                        className="w-full px-4 py-2 text-left hover:bg-muted"
                        onClick={() => addComparable(result)}
                      >
                        <span className="font-medium">{result.ticker}</span> - {result.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {form.watch('comparables')?.map((comp, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded bg-muted/50 p-2"
                  >
                    <span>
                      <span className="font-medium">{comp.ticker}</span> - {comp.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeComparable(index)}
                      className="text-destructive hover:text-destructive/90"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Additional Information</h3>
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Associated Client</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter business description"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Internal Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter internal notes"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )
      default:
        return null
    }
  }

  const progressPercentage = ((currentStep - 1) / (FORM_STEPS.length - 1)) * 100

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingCompany ? 'Edit Company' : 'Add New Company Profile'}</DialogTitle>
        </DialogHeader>

        <div className="mb-6 space-y-2">
          <div className="mb-2 flex justify-between">
            {FORM_STEPS.map((step, index) => (
              <span
                key={step}
                className={`text-xs ${
                  index + 1 <= currentStep ? 'text-teal' : 'text-muted-foreground'
                }`}
              >
                {step}
              </span>
            ))}
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {renderStepContent()}

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={prevStep}>
                  Previous
                </Button>
              )}
              {currentStep < FORM_STEPS.length ? (
                <Button type="button" onClick={nextStep}>
                  Next
                </Button>
              ) : (
                <Button type="submit">{editingCompany ? 'Update Company' : 'Save Company'}</Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
