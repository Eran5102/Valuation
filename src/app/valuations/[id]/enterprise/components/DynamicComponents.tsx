'use client'

import dynamic from 'next/dynamic'
import { LoadingSkeleton } from '@/components/ui/loading'

// Dynamic imports for heavy DCF components
export const DynamicDCFAnalysis = dynamic(
  () => import('../dcf-analysis/client').then((mod) => ({ default: mod.DCFAnalysisClient })),
  {
    loading: () => <LoadingSkeleton variant="card" lines={5} />,
    ssr: false,
  }
)

export const DynamicWACCCalculator = dynamic(
  () => import('../wacc/client-refactored').then((mod) => ({ default: mod.WACCCalculatorClient })),
  {
    loading: () => <LoadingSkeleton variant="card" lines={5} />,
    ssr: false,
  }
)

export const DynamicPublicComps = dynamic(
  () => import('../public-comps/client').then((mod) => ({ default: mod.PublicCompsClient })),
  {
    loading: () => <LoadingSkeleton variant="card" lines={5} />,
    ssr: false,
  }
)

export const DynamicPrecedentTransactions = dynamic(
  () =>
    import('../precedent-transactions/client').then((mod) => ({
      default: mod.PrecedentTransactionsClient,
    })),
  {
    loading: () => <LoadingSkeleton variant="card" lines={5} />,
    ssr: false,
  }
)

// Dynamic imports for allocation method components
export const DynamicOPMCalculator = dynamic(
  () => import('../../allocation/opm/client').then((mod) => ({ default: mod.OPMCalculatorClient })),
  {
    loading: () => <LoadingSkeleton variant="card" lines={5} />,
    ssr: false,
  }
)

export const DynamicPWERMCalculator = dynamic(
  () =>
    import('../../allocation/pwerm/client').then((mod) => ({ default: mod.PWERMCalculatorClient })),
  {
    loading: () => <LoadingSkeleton variant="card" lines={5} />,
    ssr: false,
  }
)

export const DynamicHybridMethod = dynamic(
  () =>
    import('../../allocation/hybrid/client').then((mod) => ({ default: mod.HybridMethodClient })),
  {
    loading: () => <LoadingSkeleton variant="card" lines={5} />,
    ssr: false,
  }
)

export const DynamicCVMCalculator = dynamic(
  () => import('../../allocation/cvm/client').then((mod) => ({ default: mod.CVMCalculatorClient })),
  {
    loading: () => <LoadingSkeleton variant="card" lines={5} />,
    ssr: false,
  }
)
