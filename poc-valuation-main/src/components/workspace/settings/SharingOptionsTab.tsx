import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Copy, Link, Mail, Clipboard, ClipboardCheck } from 'lucide-react'
import { toast } from 'sonner'

export default function SharingOptionsTab() {
  const [settings, setSettings] = useState({
    allowPublicLink: false,
    allowEmbedding: false,
    allowExport: true,
    requireAuthentication: true,
    linkExpiration: 'never',
  })

  const [linkCopied, setLinkCopied] = useState(false)
  const [embedCode, setEmbedCode] = useState<string | null>(null)

  const handleToggle = (setting: string) => {
    setSettings((prev) => ({ ...prev, [setting]: !prev[setting as keyof typeof prev] }))
  }

  const generateLink = () => {
    const projectUrl = `${window.location.origin}/shared/project-xyz-123`
    return projectUrl
  }

  const handleCopyLink = () => {
    const link = generateLink()
    navigator.clipboard.writeText(link)
    setLinkCopied(true)
    toast.success('Link copied to clipboard')
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const generateEmbedCode = () => {
    const projectId = 'xyz-123'
    const embedCode = `<iframe src="${window.location.origin}/embed/${projectId}" width="100%" height="600" frameborder="0"></iframe>`
    setEmbedCode(embedCode)
    return embedCode
  }

  const handleCopyEmbed = () => {
    const code = generateEmbedCode()
    navigator.clipboard.writeText(code)
    toast.success('Embed code copied to clipboard')
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Sharing Options</h3>
        <p className="text-sm text-muted-foreground">
          Control how your project can be shared with others outside your team.
        </p>
      </div>

      <Tabs defaultValue="link">
        <TabsList>
          <TabsTrigger value="link" className="flex items-center gap-2">
            <Link className="h-4 w-4" /> Share Link
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" /> Email
          </TabsTrigger>
          <TabsTrigger value="embed" className="flex items-center gap-2">
            <Copy className="h-4 w-4" /> Embed
          </TabsTrigger>
        </TabsList>

        <div className="mt-4 rounded-md border p-4">
          <TabsContent value="link">
            <div className="space-y-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="shareLink">Shareable Link</Label>
                <div className="flex">
                  <Input
                    id="shareLink"
                    readOnly
                    value={generateLink()}
                    className="rounded-r-none"
                  />
                  <Button onClick={handleCopyLink} className="rounded-l-none">
                    {linkCopied ? (
                      <ClipboardCheck className="mr-2 h-4 w-4" />
                    ) : (
                      <Clipboard className="mr-2 h-4 w-4" />
                    )}
                    {linkCopied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="allowPublicLink">Allow public link access</Label>
                    <p className="text-xs text-muted-foreground">
                      Anyone with the link can access this project
                    </p>
                  </div>
                  <Switch
                    id="allowPublicLink"
                    checked={settings.allowPublicLink}
                    onCheckedChange={() => handleToggle('allowPublicLink')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="requireAuthentication">Require user authentication</Label>
                    <p className="text-xs text-muted-foreground">
                      Users must sign in to access the shared link
                    </p>
                  </div>
                  <Switch
                    id="requireAuthentication"
                    checked={settings.requireAuthentication}
                    onCheckedChange={() => handleToggle('requireAuthentication')}
                  />
                </div>

                <div>
                  <Label htmlFor="linkExpiration">Link expiration</Label>
                  <select
                    id="linkExpiration"
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                    value={settings.linkExpiration}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, linkExpiration: e.target.value }))
                    }
                  >
                    <option value="never">Never expires</option>
                    <option value="7days">7 days</option>
                    <option value="30days">30 days</option>
                    <option value="custom">Custom date</option>
                  </select>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="email">
            <div className="space-y-4">
              <p className="text-sm">Send an email invitation directly to colleagues</p>

              <div>
                <Label htmlFor="emailTo">Email addresses</Label>
                <Input
                  id="emailTo"
                  placeholder="Enter email addresses (comma separated)"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="emailMessage">Message (optional)</Label>
                <textarea
                  id="emailMessage"
                  placeholder="Add a personal message"
                  className="mt-1 min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2"
                />
              </div>

              <div className="flex justify-end">
                <Button>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Invitation
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="embed">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="allowEmbedding">Allow embedding</Label>
                  <p className="text-xs text-muted-foreground">
                    Enable embedding this project in other websites
                  </p>
                </div>
                <Switch
                  id="allowEmbedding"
                  checked={settings.allowEmbedding}
                  onCheckedChange={() => handleToggle('allowEmbedding')}
                />
              </div>

              {settings.allowEmbedding && (
                <>
                  <div>
                    <Label htmlFor="embedCode">Embed Code</Label>
                    <div className="relative mt-2">
                      <textarea
                        id="embedCode"
                        readOnly
                        value={embedCode || generateEmbedCode()}
                        className="min-h-[80px] w-full rounded-md border border-input bg-muted/30 px-3 py-2 font-mono text-xs"
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        className="absolute right-2 top-2"
                        onClick={handleCopyEmbed}
                      >
                        <Clipboard className="mr-1 h-3 w-3" />
                        Copy
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-md bg-muted/40 p-3">
                    <h4 className="text-sm font-medium">Preview</h4>
                    <div className="mt-2 flex h-[200px] items-center justify-center rounded border bg-background p-2 text-center text-sm text-muted-foreground">
                      Embedded project preview would appear here
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>

      <div className="border-t pt-4">
        <h4 className="text-md mb-3 font-medium">Advanced Sharing Settings</h4>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="allowExport">Allow data export</Label>
              <p className="text-xs text-muted-foreground">Viewers can export data to CSV/Excel</p>
            </div>
            <Switch
              id="allowExport"
              checked={settings.allowExport}
              onCheckedChange={() => handleToggle('allowExport')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="allowComments">Allow comments from viewers</Label>
              <p className="text-xs text-muted-foreground">
                Viewers can add comments to the project
              </p>
            </div>
            <Switch id="allowComments" checked={true} onCheckedChange={() => {}} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="watermark">Add watermark</Label>
              <p className="text-xs text-muted-foreground">Include watermark on exported content</p>
            </div>
            <Switch id="watermark" checked={false} onCheckedChange={() => {}} />
          </div>
        </div>
      </div>
    </div>
  )
}
