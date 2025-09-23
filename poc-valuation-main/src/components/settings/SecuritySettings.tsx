import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Shield } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function SecuritySettings() {
  const [passwordValues, setPasswordValues] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [sessionTimeout, setSessionTimeout] = useState('30')
  const [loginHistoryOpen, setLoginHistoryOpen] = useState(false)

  // Mock login history data
  const loginHistory = [
    {
      date: '2025-04-28 14:22:31',
      device: 'Chrome / Windows',
      location: 'New York, US',
      status: 'Success',
    },
    {
      date: '2025-04-25 09:15:42',
      device: 'Safari / macOS',
      location: 'San Francisco, US',
      status: 'Success',
    },
    {
      date: '2025-04-20 18:03:15',
      device: 'Firefox / Windows',
      location: 'Chicago, US',
      status: 'Success',
    },
  ]

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmitPassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordValues.newPassword !== passwordValues.confirmPassword) {
      toast.error("New passwords don't match")
      return
    }

    // Mock password change
    toast.success('Password updated successfully')
    setPasswordValues({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
  }

  const toggleTwoFactor = () => {
    setTwoFactorEnabled(!twoFactorEnabled)
    toast.success(`Two-factor authentication ${!twoFactorEnabled ? 'enabled' : 'disabled'}`)
  }

  const handleSessionTimeoutChange = (value: string) => {
    setSessionTimeout(value)
    toast.success('Session timeout updated')
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Security Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage your account security and authentication settings.
        </p>
      </div>

      <div className="space-y-6">
        {/* Password Change Section */}
        <div>
          <h4 className="mb-4 text-base font-medium">Change Password</h4>
          <form onSubmit={handleSubmitPassword} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={passwordValues.currentPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={passwordValues.newPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={passwordValues.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit">Update Password</Button>
            </div>
          </form>
        </div>

        {/* Two-Factor Authentication */}
        <div>
          <h4 className="mb-4 text-base font-medium">Two-Factor Authentication</h4>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="twoFactor" className="text-base">
                Enable Two-Factor Authentication
              </Label>
              <p className="mt-1 text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
            <Switch id="twoFactor" checked={twoFactorEnabled} onCheckedChange={toggleTwoFactor} />
          </div>
        </div>

        {/* Session Settings */}
        <div>
          <h4 className="mb-4 text-base font-medium">Session Settings</h4>
          <div className="space-y-2">
            <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
            <Select value={sessionTimeout} onValueChange={handleSessionTimeoutChange}>
              <SelectTrigger id="sessionTimeout" className="w-full max-w-xs">
                <SelectValue placeholder="Select timeout" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
                <SelectItem value="120">120 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Login History */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-base font-medium">Login History</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLoginHistoryOpen(!loginHistoryOpen)}
            >
              {loginHistoryOpen ? 'Hide' : 'View'} History
            </Button>
          </div>

          {loginHistoryOpen && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {loginHistory.map((login, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between border-b pb-3 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="font-medium">{login.date}</p>
                        <p className="text-sm text-muted-foreground">{login.device}</p>
                        <p className="text-sm text-muted-foreground">{login.location}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium text-green-500">{login.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
