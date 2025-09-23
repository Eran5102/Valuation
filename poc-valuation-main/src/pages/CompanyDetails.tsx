import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Edit,
  Settings,
  User2,
  Building2,
  Calendar,
  DollarSign,
  MapPin,
  Globe,
  FileText,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCompanyManagement } from '@/hooks/useCompanyManagement'
import { Separator } from '@/components/ui/separator'

export default function CompanyDetails() {
  const { companyId } = useParams<{ companyId: string }>()
  const { getCompanyById } = useCompanyManagement()

  const company = getCompanyById(companyId || '')

  if (!company) {
    return (
      <div className="space-y-4 p-6">
        <Link
          to="/companies"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Companies
        </Link>
        <div className="py-12 text-center">
          <h2 className="mb-2 text-2xl font-semibold">Company Not Found</h2>
          <p className="mb-6 text-muted-foreground">
            The company you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link to="/companies">Return to Companies List</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/companies"
            className="mb-2 inline-flex items-center gap-2 text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Companies
          </Link>
          <h1 className="text-2xl font-semibold">{company.name}</h1>
          {company.legalName && company.legalName !== company.name && (
            <p className="text-muted-foreground">{company.legalName}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to={`/workspace/${company.id}/company-data`}>
              <Settings className="mr-2 h-4 w-4" />
              Manage Data
            </Link>
          </Button>
          <Button
            onClick={() => {
              /* Edit would be handled by the parent component */
            }}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Company
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financials">Financial Data</TabsTrigger>
          <TabsTrigger value="projects">Related Projects</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Client</p>
                    <p className="font-medium">{company.clientName || 'Not Specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Industry</p>
                    <p className="font-medium">{company.industry || 'Not Specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{company.location || 'Not Specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Geography</p>
                    <p className="font-medium">{company.geography || 'Not Specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Currency</p>
                    <p className="font-medium">{company.currency || 'Not Specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fiscal Year End</p>
                    <p className="font-medium">{company.fyEnd || 'Not Specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">NAICS Code</p>
                    <p className="font-medium">{company.naicsCode || 'Not Specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date Added</p>
                    <p className="font-medium">
                      {new Date(company.dateAdded).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{company.description || 'No description available.'}</p>
                {company.notes && (
                  <>
                    <Separator className="my-4" />
                    <p className="text-sm text-muted-foreground">Additional Notes:</p>
                    <p>{company.notes}</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {company.comparables && company.comparables.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Comparable Companies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {company.comparables.map((comp) => (
                    <div key={comp.ticker} className="rounded-md border p-4">
                      <p className="font-medium">{comp.name}</p>
                      <p className="text-sm text-muted-foreground">Ticker: {comp.ticker}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="financials" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Financial Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="py-6 text-center">
                <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-medium">Financial Data</h3>
                <p className="mb-4 text-muted-foreground">
                  View and manage financial statements, metrics, and other financial data for this
                  company.
                </p>
                <Button asChild>
                  <Link to={`/workspace/${company.id}/company-data`}>Manage Financial Data</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Related Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="py-6 text-center">
                <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-medium">Valuation Projects</h3>
                <p className="mb-4 text-muted-foreground">
                  View all valuation projects related to this company.
                </p>
                <Button asChild>
                  <Link to="/projects">View Projects</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
