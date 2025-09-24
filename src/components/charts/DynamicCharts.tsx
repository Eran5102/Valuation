'use client'

import dynamic from 'next/dynamic'
import { LoadingSpinner } from '@/components/ui/loading'

// Dynamic import for Recharts components with loading fallback
export const DynamicLineChart = dynamic(() => import('recharts').then((mod) => mod.LineChart), {
  loading: () => <LoadingSpinner size="lg" />,
  ssr: false,
})

export const DynamicBarChart = dynamic(() => import('recharts').then((mod) => mod.BarChart), {
  loading: () => <LoadingSpinner size="lg" />,
  ssr: false,
})

export const DynamicAreaChart = dynamic(() => import('recharts').then((mod) => mod.AreaChart), {
  loading: () => <LoadingSpinner size="lg" />,
  ssr: false,
})

export const DynamicPieChart = dynamic(() => import('recharts').then((mod) => mod.PieChart), {
  loading: () => <LoadingSpinner size="lg" />,
  ssr: false,
})

export const DynamicComposedChart = dynamic(
  () => import('recharts').then((mod) => mod.ComposedChart),
  {
    loading: () => <LoadingSpinner size="lg" />,
    ssr: false,
  }
)

export const DynamicRadarChart = dynamic(() => import('recharts').then((mod) => mod.RadarChart), {
  loading: () => <LoadingSpinner size="lg" />,
  ssr: false,
})

export const DynamicScatterChart = dynamic(
  () => import('recharts').then((mod) => mod.ScatterChart),
  {
    loading: () => <LoadingSpinner size="lg" />,
    ssr: false,
  }
)

// Export commonly used chart components together
export {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  Bar,
  Area,
  Pie,
  Cell,
  ReferenceLine,
  ReferenceArea,
} from 'recharts'
