'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2 } from 'lucide-react'

export default function CompanyInformationPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Company Information</h1>
        <p className="mt-1 text-muted-foreground">
          Review and update company details and financial information
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Details
          </CardTitle>
          <CardDescription>Basic information about the company</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Company information management coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )
}
