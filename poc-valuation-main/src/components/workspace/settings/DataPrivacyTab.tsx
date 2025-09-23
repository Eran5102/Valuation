import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Lock, Eye, EyeOff, Shield, Download, AlertTriangle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export default function DataPrivacyTab() {
  const [privacySettings, setPrivacySettings] = useState({
    dataEncryption: true,
    sensitiveDataMasking: true,
    anonymizeExports: false,
    restrictDownloads: false,
    trackActivity: true,
    dataRetention: 'indefinite',
  })

  const handleToggle = (setting: string) => {
    setPrivacySettings((prev) => ({ ...prev, [setting]: !prev[setting as keyof typeof prev] }))
    toast.success(`Privacy setting updated`)
  }

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPrivacySettings((prev) => ({ ...prev, dataRetention: e.target.value }))
    toast.success(`Data retention policy updated`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Data Privacy & Security</h3>
        <p className="text-sm text-muted-foreground">
          Configure privacy settings and security controls for this project.
        </p>
      </div>

      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="flex items-center gap-2" htmlFor="dataEncryption">
              <Lock className="h-4 w-4 text-muted-foreground" />
              Enable Data Encryption
            </Label>
            <p className="text-xs text-muted-foreground">
              Encrypt sensitive financial data at rest
            </p>
          </div>
          <Switch
            id="dataEncryption"
            checked={privacySettings.dataEncryption}
            onCheckedChange={() => handleToggle('dataEncryption')}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="flex items-center gap-2" htmlFor="sensitiveDataMasking">
              <Eye className="h-4 w-4 text-muted-foreground" />
              Sensitive Data Masking
            </Label>
            <p className="text-xs text-muted-foreground">
              Hide sensitive financial figures from viewers
            </p>
          </div>
          <Switch
            id="sensitiveDataMasking"
            checked={privacySettings.sensitiveDataMasking}
            onCheckedChange={() => handleToggle('sensitiveDataMasking')}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="flex items-center gap-2" htmlFor="anonymizeExports">
              <EyeOff className="h-4 w-4 text-muted-foreground" />
              Anonymize Data Exports
            </Label>
            <p className="text-xs text-muted-foreground">
              Remove identifying information from exported data
            </p>
          </div>
          <Switch
            id="anonymizeExports"
            checked={privacySettings.anonymizeExports}
            onCheckedChange={() => handleToggle('anonymizeExports')}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="flex items-center gap-2" htmlFor="restrictDownloads">
              <Download className="h-4 w-4 text-muted-foreground" />
              Restrict Data Downloads
            </Label>
            <p className="text-xs text-muted-foreground">
              Prevent users from downloading raw financial data
            </p>
          </div>
          <Switch
            id="restrictDownloads"
            checked={privacySettings.restrictDownloads}
            onCheckedChange={() => handleToggle('restrictDownloads')}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="flex items-center gap-2" htmlFor="trackActivity">
              <Shield className="h-4 w-4 text-muted-foreground" />
              Activity Tracking & Audit Log
            </Label>
            <p className="text-xs text-muted-foreground">
              Track all actions performed on this project
            </p>
          </div>
          <Switch
            id="trackActivity"
            checked={privacySettings.trackActivity}
            onCheckedChange={() => handleToggle('trackActivity')}
          />
        </div>

        <div className="pt-2">
          <Label htmlFor="dataRetention">Data Retention Policy</Label>
          <select
            id="dataRetention"
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={privacySettings.dataRetention}
            onChange={handleSelectChange}
          >
            <option value="indefinite">Keep indefinitely</option>
            <option value="3years">3 years after project completion</option>
            <option value="1year">1 year after project completion</option>
            <option value="custom">Custom retention policy</option>
          </select>
          <p className="mt-1 text-xs text-muted-foreground">
            Controls how long project data will be retained
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-md border border-yellow-200 bg-yellow-50 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-600" />
          <div>
            <h4 className="text-sm font-medium text-yellow-800">Data Privacy Notice</h4>
            <p className="mt-1 text-xs text-yellow-700">
              This project may contain sensitive financial information. Ensure all team members
              understand your organization's data handling policies and comply with relevant
              regulations like GDPR or CCPA.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
              Delete All Project Data
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete all data associated with
                this project and remove all records from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={() => toast.error('This feature is currently disabled')}
              >
                Delete All Data
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button variant="outline">Download Privacy Report</Button>
      </div>
    </div>
  )
}
