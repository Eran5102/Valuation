import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatPercent } from '@/utils/formatters'

interface DCFSettingsProps {
  settings: any
  setSettings: (settings: any) => void
}

export function DCFSettings({ settings, setSettings }: DCFSettingsProps) {
  const handleWaccChange = (value: number) => {
    setSettings({ ...settings, wacc: value / 100 })
  }

  const handleTerminalGrowthChange = (value: number) => {
    setSettings({ ...settings, terminalGrowthRate: value / 100 })
  }

  const handleForecastPeriodChange = (value: string) => {
    setSettings({ ...settings, forecastPeriod: parseInt(value) })
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">DCF Settings</h2>

      <Card>
        <CardContent className="space-y-6 p-4">
          <div className="space-y-2">
            <Label>Forecast Period (Years)</Label>
            <Select
              value={String(settings.forecastPeriod || 5)}
              onValueChange={handleForecastPeriodChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select forecast period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 Years</SelectItem>
                <SelectItem value="5">5 Years</SelectItem>
                <SelectItem value="7">7 Years</SelectItem>
                <SelectItem value="10">10 Years</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>WACC ({formatPercent(settings.wacc || 0.1)})</Label>
            <Slider
              min={5}
              max={25}
              step={0.5}
              value={[(settings.wacc || 0.1) * 100]}
              onValueChange={(values) => handleWaccChange(values[0])}
            />
          </div>

          <div className="space-y-2">
            <Label>
              Terminal Growth Rate ({formatPercent(settings.terminalGrowthRate || 0.02)})
            </Label>
            <Slider
              min={0}
              max={5}
              step={0.1}
              value={[(settings.terminalGrowthRate || 0.02) * 100]}
              onValueChange={(values) => handleTerminalGrowthChange(values[0])}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
