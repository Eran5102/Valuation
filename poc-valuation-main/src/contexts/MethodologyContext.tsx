import React, { createContext, useContext, useState, useEffect } from 'react'

interface Method {
  id: string
  name: string
  enabled: boolean
  implemented?: boolean
}

interface MethodologyGroup {
  name: string
  icon: string
  methods: Method[]
}

interface MethodologyContextType {
  methodologies: MethodologyGroup[]
  updateMethodologies: (methodologies: MethodologyGroup[]) => void
}

const MethodologyContext = createContext<MethodologyContextType | undefined>(undefined)
const STORAGE_KEY = 'valuwise-methodologies'

// Default methodologies configuration
const defaultMethodologies: MethodologyGroup[] = [
  {
    name: 'Income Approach',
    icon: 'chart-bar',
    methods: [
      { id: 'dcf', name: 'Discounted Cash Flow (DCF)', enabled: false, implemented: true },
      { id: 'cap-earnings', name: 'Capitalization of Earnings', enabled: false, implemented: true },
      {
        id: 'income-multiplier',
        name: 'Income Multiplier Method',
        enabled: false,
        implemented: true,
      },
      { id: 'ddm', name: 'Dividend Discount Model (DDM)', enabled: false, implemented: true },
      { id: 'earnings-based', name: 'Earnings-Based Valuation', enabled: false, implemented: true },
      {
        id: 'eva',
        name: 'Economic Value Added (EVA) Valuation',
        enabled: false,
        implemented: true,
      },
      {
        id: 'residual-income',
        name: 'Residual Income Valuation',
        enabled: false,
        implemented: true,
      },
    ],
  },
  {
    name: 'Market Approach',
    icon: 'chart-pie',
    methods: [
      {
        id: 'public-comps',
        name: 'Guideline Public Companies (GPC/CCA)',
        enabled: false,
        implemented: true,
      },
      {
        id: 'precedent-transactions',
        name: 'Precedent Transactions (PTA)',
        enabled: false,
        implemented: true,
      },
      {
        id: 'opm',
        name: 'OPM Backsolve / Complex Capital Allocation',
        enabled: false,
        implemented: true,
      },
    ],
  },
  {
    name: 'Asset Approach',
    icon: 'folder',
    methods: [
      { id: 'adjusted-book-value', name: 'Adjusted Book Value', enabled: false, implemented: true },
      {
        id: 'liquidation-value',
        name: 'Liquidation Value Method',
        enabled: false,
        implemented: true,
      },
      {
        id: 'cost-approach',
        name: 'Replacement Cost Method (Cost Approach)',
        enabled: false,
        implemented: true,
      },
    ],
  },
  {
    name: 'Other / Specialized Approaches',
    icon: 'calculator',
    methods: [
      { id: 'lbo', name: 'LBO Analysis (Leveraged Buyout)', enabled: false, implemented: false },
      { id: 'vc-method', name: 'Venture Capital (VC) Method', enabled: false, implemented: false },
      { id: 'sotp', name: 'Sum-of-the-Parts (SOTP) Valuation', enabled: false, implemented: false },
      { id: 'real-options', name: 'Real Options Valuation', enabled: false, implemented: false },
      {
        id: 'contingent-claim',
        name: 'Contingent Claim Valuation',
        enabled: false,
        implemented: false,
      },
      {
        id: 'intangible-asset',
        name: 'Intangible Asset Valuation',
        enabled: false,
        implemented: false,
      },
      { id: 'option-pricing', name: 'Option Pricing Models', enabled: false, implemented: false },
      { id: 'real-estate', name: 'Real Estate Valuation', enabled: false, implemented: false },
      { id: 'greenfield', name: 'Greenfield Valuation', enabled: false, implemented: false },
    ],
  },
]

export function MethodologyProvider({ children }: { children: React.ReactNode }) {
  const [methodologies, setMethodologies] = useState<MethodologyGroup[]>(() => {
    // Try to load methodologies from localStorage
    try {
      const savedMethodologies = localStorage.getItem(STORAGE_KEY)
      if (savedMethodologies) {
        const parsed = JSON.parse(savedMethodologies)

        // If the saved data structure matches what we expect, use it
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.methods) {
          // Ensure we have all methodology groups and methods from defaults
          // This prevents missing methods if the schema was updated
          const mergedMethodologies = [...defaultMethodologies]

          // Update enabled states from localStorage data
          parsed.forEach((savedGroup) => {
            const defaultGroupIndex = mergedMethodologies.findIndex(
              (group) => group.name === savedGroup.name
            )

            if (defaultGroupIndex >= 0) {
              savedGroup.methods.forEach((savedMethod) => {
                const defaultMethodIndex = mergedMethodologies[defaultGroupIndex].methods.findIndex(
                  (method) => method.id === savedMethod.id
                )

                if (defaultMethodIndex >= 0) {
                  mergedMethodologies[defaultGroupIndex].methods[defaultMethodIndex].enabled =
                    savedMethod.enabled
                }
              })
            }
          })

          return mergedMethodologies
        }
      }
    } catch (e) {
      console.error('Failed to parse saved methodologies', e)
    }

    // If localStorage failed or is empty, use defaults
    return JSON.parse(JSON.stringify(defaultMethodologies))
  })

  const updateMethodologies = (newMethodologies: MethodologyGroup[]) => {
    setMethodologies(newMethodologies)
    // Persist to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newMethodologies))
    } catch (e) {
      console.error('Failed to save methodologies to localStorage', e)
    }
  }

  // Debug methodologies at load time
  useEffect(() => {
    console.log('Current methodologies in context:', methodologies)
  }, [methodologies])

  return (
    <MethodologyContext.Provider value={{ methodologies, updateMethodologies }}>
      {children}
    </MethodologyContext.Provider>
  )
}

export function useMethodology() {
  const context = useContext(MethodologyContext)
  if (context === undefined) {
    throw new Error('useMethodology must be used within a MethodologyProvider')
  }
  return context
}
