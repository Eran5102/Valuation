import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'

type NotificationCategory = 'email' | 'app'

interface NotificationSettings {
  email: {
    projectUpdates: boolean
    reportFinalized: boolean
    systemAlerts: boolean
    marketing: boolean
  }
  app: {
    projectUpdates: boolean
    commentMentions: boolean
    newReports: boolean
    systemAlerts: boolean
  }
}

export default function NotificationSettings() {
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email: {
      projectUpdates: true,
      reportFinalized: true,
      systemAlerts: false,
      marketing: false,
    },
    app: {
      projectUpdates: true,
      commentMentions: true,
      newReports: true,
      systemAlerts: true,
    },
  })

  const toggleNotification = (category: NotificationCategory, setting: string) => {
    setNotifications((prev) => {
      if (category === 'email') {
        return {
          ...prev,
          email: {
            ...prev.email,
            [setting]: !prev.email[setting as keyof typeof prev.email],
          },
        }
      } else {
        return {
          ...prev,
          app: {
            ...prev.app,
            [setting]: !prev.app[setting as keyof typeof prev.app],
          },
        }
      }
    })
  }

  const handleSaveNotifications = () => {
    // In a real app, we would save notification settings to the server
    console.log('Saving notification settings:', notifications)
    toast.success('Notification settings updated')
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Notification Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure how you want to be notified about various events.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="mb-4 text-base font-medium">Email Notifications</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-project-updates">Project updates</Label>
              <Switch
                id="email-project-updates"
                checked={notifications.email.projectUpdates}
                onCheckedChange={() => toggleNotification('email', 'projectUpdates')}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="email-report-finalized">Report finalized</Label>
              <Switch
                id="email-report-finalized"
                checked={notifications.email.reportFinalized}
                onCheckedChange={() => toggleNotification('email', 'reportFinalized')}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="email-system-alerts">System alerts</Label>
              <Switch
                id="email-system-alerts"
                checked={notifications.email.systemAlerts}
                onCheckedChange={() => toggleNotification('email', 'systemAlerts')}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="email-marketing">Marketing emails</Label>
              <Switch
                id="email-marketing"
                checked={notifications.email.marketing}
                onCheckedChange={() => toggleNotification('email', 'marketing')}
              />
            </div>
          </div>
        </div>

        <div>
          <h4 className="mb-4 text-base font-medium">In-App Notifications</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="app-project-updates">Project updates</Label>
              <Switch
                id="app-project-updates"
                checked={notifications.app.projectUpdates}
                onCheckedChange={() => toggleNotification('app', 'projectUpdates')}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="app-comment-mentions">Comment mentions</Label>
              <Switch
                id="app-comment-mentions"
                checked={notifications.app.commentMentions}
                onCheckedChange={() => toggleNotification('app', 'commentMentions')}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="app-new-reports">New reports</Label>
              <Switch
                id="app-new-reports"
                checked={notifications.app.newReports}
                onCheckedChange={() => toggleNotification('app', 'newReports')}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="app-system-alerts">System alerts</Label>
              <Switch
                id="app-system-alerts"
                checked={notifications.app.systemAlerts}
                onCheckedChange={() => toggleNotification('app', 'systemAlerts')}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSaveNotifications}>Save Changes</Button>
      </div>
    </div>
  )
}
