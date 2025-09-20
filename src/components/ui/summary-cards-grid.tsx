import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

export interface SummaryCard {
  icon: LucideIcon
  iconColor: 'primary' | 'accent' | 'chart-1' | 'chart-2' | 'chart-3' | 'muted-foreground'
  label: string
  value: string | number
}

interface SummaryCardsGridProps {
  cards: SummaryCard[]
}

const getIconColors = (color: SummaryCard['iconColor']) => {
  switch (color) {
    case 'primary':
      return { icon: 'text-primary', bg: 'bg-primary/10' }
    case 'accent':
      return { icon: 'text-accent', bg: 'bg-accent/10' }
    case 'chart-1':
      return { icon: 'text-chart-1', bg: 'bg-chart-1/10' }
    case 'chart-2':
      return { icon: 'text-chart-2', bg: 'bg-chart-2/10' }
    case 'chart-3':
      return { icon: 'text-chart-3', bg: 'bg-chart-3/10' }
    case 'muted-foreground':
      return { icon: 'text-muted-foreground', bg: 'bg-muted' }
    default:
      return { icon: 'text-primary', bg: 'bg-primary/10' }
  }
}

export function SummaryCardsGrid({ cards }: SummaryCardsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
      {cards.map((card, index) => {
        const colors = getIconColors(card.iconColor)
        return (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={`p-2 ${colors.bg} rounded-lg`}>
                  <card.icon className={`h-6 w-6 ${colors.icon}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="text-2xl font-bold">{card.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
