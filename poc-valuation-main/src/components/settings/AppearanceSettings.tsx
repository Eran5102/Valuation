import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'

export default function AppearanceSettings() {
  const [theme, setTheme] = useState('light')
  const [density, setDensity] = useState('default')
  const [fontSize, setFontSize] = useState('default')
  const [useSystemTheme, setUseSystemTheme] = useState(false)

  // Check if we have any saved appearance settings in localStorage
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('app_theme')
      const savedDensity = localStorage.getItem('app_density')
      const savedFontSize = localStorage.getItem('app_font_size')
      const savedUseSystemTheme = localStorage.getItem('app_use_system_theme')

      if (savedTheme) setTheme(savedTheme)
      if (savedDensity) setDensity(savedDensity)
      if (savedFontSize) setFontSize(savedFontSize)
      if (savedUseSystemTheme) setUseSystemTheme(savedUseSystemTheme === 'true')
    } catch (error) {
      console.error('Error loading appearance settings:', error)
    }
  }, [])

  const handleSaveAppearance = () => {
    try {
      // Save to localStorage
      localStorage.setItem('app_theme', theme)
      localStorage.setItem('app_density', density)
      localStorage.setItem('app_font_size', fontSize)
      localStorage.setItem('app_use_system_theme', String(useSystemTheme))

      // In a real app, we would apply these settings to the UI
      if (useSystemTheme) {
        document.documentElement.classList.add('system-theme')
        document.documentElement.classList.remove('light', 'dark')
      } else {
        document.documentElement.classList.remove('system-theme')
        document.documentElement.classList.add(theme)
        document.documentElement.classList.remove(theme === 'light' ? 'dark' : 'light')
      }

      console.log('Saved appearance settings:', { theme, density, fontSize, useSystemTheme })
      toast.success('Appearance settings updated')
    } catch (error) {
      console.error('Error saving appearance settings:', error)
      toast.error('Failed to save appearance settings')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Appearance Settings</h3>
        <p className="text-sm text-muted-foreground">
          Customize the appearance of the application.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Theme</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="use-system-theme"
                checked={useSystemTheme}
                onCheckedChange={setUseSystemTheme}
              />
              <Label htmlFor="use-system-theme">Use system theme</Label>
            </div>

            <RadioGroup
              value={theme}
              onValueChange={setTheme}
              className="flex flex-col space-y-1"
              disabled={useSystemTheme}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="light" />
                <Label htmlFor="light" className={useSystemTheme ? 'text-muted-foreground' : ''}>
                  Light
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark" id="dark" />
                <Label htmlFor="dark" className={useSystemTheme ? 'text-muted-foreground' : ''}>
                  Dark
                </Label>
              </div>
            </RadioGroup>

            <p className="mt-2 text-sm text-muted-foreground">
              Theme settings affect the application interface only. Report theming is managed
              separately in the Report Generator.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interface Density</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="density" className="sr-only">
              Interface Density
            </Label>
            <Select value={density} onValueChange={setDensity}>
              <SelectTrigger id="density" className="w-full max-w-xs">
                <SelectValue placeholder="Select density" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compact">Compact</SelectItem>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="comfortable">Comfortable</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Font Size</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="fontSize" className="sr-only">
              Font Size
            </Label>
            <Select value={fontSize} onValueChange={setFontSize}>
              <SelectTrigger id="fontSize" className="w-full max-w-xs">
                <SelectValue placeholder="Select font size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSaveAppearance}>Save Changes</Button>
      </div>
    </div>
  )
}
