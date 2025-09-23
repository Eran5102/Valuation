import { useState } from 'react'
import { Settings, Users, Share2, Bell, Info, History, FileText, Lock, Palette } from 'lucide-react'
import { WorkspaceHeaderLayout } from '@/components/layout/WorkspaceHeaderLayout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'

// Tab Components
import TeamMembersTab from '@/components/workspace/settings/TeamMembersTab'
import SharingOptionsTab from '@/components/workspace/settings/SharingOptionsTab'
import ProjectDetailsTab from '@/components/workspace/settings/ProjectDetailsTab'
import NotificationsTab from '@/components/workspace/settings/NotificationsTab'
import DataPrivacyTab from '@/components/workspace/settings/DataPrivacyTab'
import VersionHistoryTab from '@/components/workspace/settings/VersionHistoryTab'
import ProjectPreferencesTab from '@/components/workspace/settings/ProjectPreferencesTab'
import ExportImportTab from '@/components/workspace/settings/ExportImportTab'

export default function ProjectSettings() {
  const [activeTab, setActiveTab] = useState('details')

  return (
    <WorkspaceHeaderLayout
      title="Project Settings"
      description="Configure project-specific settings, team access, and sharing options"
      icon={<Settings className="h-6 w-6" />}
      fullWidth={true}
      showCommentsButton={true}
    >
      <div className="mx-auto w-full max-w-6xl">
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-4 md:grid-cols-8">
            <TabsTrigger value="details" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span className="hidden md:inline">Details</span>
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden md:inline">Team</span>
            </TabsTrigger>
            <TabsTrigger value="sharing" className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              <span className="hidden md:inline">Sharing</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden md:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden md:inline">Preferences</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span className="hidden md:inline">Privacy</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <span className="hidden md:inline">History</span>
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden md:inline">Export</span>
            </TabsTrigger>
          </TabsList>

          <Card>
            <CardContent className="pt-6">
              <TabsContent value="details" className="mt-0">
                <ProjectDetailsTab />
              </TabsContent>

              <TabsContent value="members" className="mt-0">
                <TeamMembersTab />
              </TabsContent>

              <TabsContent value="sharing" className="mt-0">
                <SharingOptionsTab />
              </TabsContent>

              <TabsContent value="notifications" className="mt-0">
                <NotificationsTab />
              </TabsContent>

              <TabsContent value="preferences" className="mt-0">
                <ProjectPreferencesTab />
              </TabsContent>

              <TabsContent value="privacy" className="mt-0">
                <DataPrivacyTab />
              </TabsContent>

              <TabsContent value="history" className="mt-0">
                <VersionHistoryTab />
              </TabsContent>

              <TabsContent value="export" className="mt-0">
                <ExportImportTab />
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </WorkspaceHeaderLayout>
  )
}
