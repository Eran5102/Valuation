import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Save } from 'lucide-react'

export default function NotificationsTab() {
  const [notificationSettings, setNotificationSettings] = useState({
    commentNotifications: true,
    editNotifications: true,
    shareNotifications: true,
    accessChanges: true,
    mentionNotifications: true,
    dailyDigest: false,
    frequency: 'immediate',
    emailNotifications: true,
    pushNotifications: false,
  })

  const [hasChanges, setHasChanges] = useState(false)

  const handleToggle = (setting: string) => {
    setNotificationSettings((prev) => ({ ...prev, [setting]: !prev[setting as keyof typeof prev] }))
    setHasChanges(true)
  }

  const handleRadioChange = (name: string, value: string) => {
    setNotificationSettings((prev) => ({ ...prev, [name]: value }))
    setHasChanges(true)
  }

  const handleSave = () => {
    toast.success('Notification preferences saved')
    setHasChanges(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Notification Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure when and how you receive notifications for this project.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="text-md mb-3 font-medium">Project Events</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="commentNotifications">Comments</Label>
                <p className="text-xs text-muted-foreground">
                  When someone comments on this project
                </p>
              </div>
              <Switch
                id="commentNotifications"
                checked={notificationSettings.commentNotifications}
                onCheckedChange={() => handleToggle('commentNotifications')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="editNotifications">Edits</Label>
                <p className="text-xs text-muted-foreground">When someone edits this project</p>
              </div>
              <Switch
                id="editNotifications"
                checked={notificationSettings.editNotifications}
                onCheckedChange={() => handleToggle('editNotifications')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="shareNotifications">Shares</Label>
                <p className="text-xs text-muted-foreground">
                  When this project is shared with new people
                </p>
              </div>
              <Switch
                id="shareNotifications"
                checked={notificationSettings.shareNotifications}
                onCheckedChange={() => handleToggle('shareNotifications')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="accessChanges">Access Changes</Label>
                <p className="text-xs text-muted-foreground">When someone's access level changes</p>
              </div>
              <Switch
                id="accessChanges"
                checked={notificationSettings.accessChanges}
                onCheckedChange={() => handleToggle('accessChanges')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="mentionNotifications">Mentions</Label>
                <p className="text-xs text-muted-foreground">When you are mentioned in a comment</p>
              </div>
              <Switch
                id="mentionNotifications"
                checked={notificationSettings.mentionNotifications}
                onCheckedChange={() => handleToggle('mentionNotifications')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="dailyDigest">Daily Digest</Label>
                <p className="text-xs text-muted-foreground">
                  Receive a summary of activity once per day
                </p>
              </div>
              <Switch
                id="dailyDigest"
                checked={notificationSettings.dailyDigest}
                onCheckedChange={() => handleToggle('dailyDigest')}
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-5">
          <h4 className="text-md mb-3 font-medium">Notification Frequency</h4>
          <RadioGroup
            value={notificationSettings.frequency}
            onValueChange={(value) => handleRadioChange('frequency', value)}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="immediate" id="immediate" />
              <Label htmlFor="immediate" className="font-normal">
                Immediate
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="hourly" id="hourly" />
              <Label htmlFor="hourly" className="font-normal">
                Hourly digest
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="daily" id="daily" />
              <Label htmlFor="daily" className="font-normal">
                Daily digest
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="border-t pt-5">
          <h4 className="text-md mb-3 font-medium">Notification Methods</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="emailNotifications">Email Notifications</Label>
                <p className="text-xs text-muted-foreground">Receive notifications via email</p>
              </div>
              <Switch
                id="emailNotifications"
                checked={notificationSettings.emailNotifications}
                onCheckedChange={() => handleToggle('emailNotifications')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="pushNotifications">Push Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Receive push notifications on your device
                </p>
              </div>
              <Switch
                id="pushNotifications"
                checked={notificationSettings.pushNotifications}
                onCheckedChange={() => handleToggle('pushNotifications')}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={!hasChanges} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Save Preferences
        </Button>
      </div>
    </div>
  )
}
