import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import AccountSettings from '@/components/settings/AccountSettings'
import AppearanceSettings from '@/components/settings/AppearanceSettings'
import NotificationSettings from '@/components/settings/NotificationSettings'
import ProjectSettings from '@/components/settings/ProjectSettings'
import SecuritySettings from '@/components/settings/SecuritySettings'

export default function Settings() {
  const [activeTab, setActiveTab] = useState('account')

  return (
    <div className="space-y-6 p-6">
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="project">Project Defaults</TabsTrigger>
        </TabsList>

        <Card>
          <CardContent className="pt-6">
            <TabsContent value="account" className="mt-0">
              <AccountSettings />
            </TabsContent>

            <TabsContent value="appearance" className="mt-0">
              <AppearanceSettings />
            </TabsContent>

            <TabsContent value="notifications" className="mt-0">
              <NotificationSettings />
            </TabsContent>

            <TabsContent value="security" className="mt-0">
              <SecuritySettings />
            </TabsContent>

            <TabsContent value="project" className="mt-0">
              <ProjectSettings />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  )
}
