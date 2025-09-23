import { createContext, useContext, useState, useMemo } from 'react'
import { Category, CategoryItem } from '@/pages/workspace/methodologies/CostApproach'

interface CostApproachContextType {
  assets: Category[]
  liabilities: Category[]
  setAssets: (assets: Category[]) => void
  setLiabilities: (liabilities: Category[]) => void
  addAssetCategory: (name: string) => void
  addLiabilityCategory: (name: string) => void
  removeAssetCategory: (id: string) => void
  removeLiabilityCategory: (id: string) => void
  addAssetItem: (categoryId: string, name: string) => void
  addLiabilityItem: (categoryId: string, name: string) => void
  removeAssetItem: (categoryId: string, itemId: string) => void
  removeLiabilityItem: (categoryId: string, itemId: string) => void
  updateAssetItem: (categoryId: string, itemId: string, updates: Partial<CategoryItem>) => void
  updateLiabilityItem: (categoryId: string, itemId: string, updates: Partial<CategoryItem>) => void
  calculations: {
    totalAssets: number
    totalLiabilities: number
    impliedEquityValue: number
  }
}

const CostApproachContext = createContext<CostApproachContextType | null>(null)

export function CostApproachProvider({ children }: { children: React.ReactNode }) {
  const [assets, setAssets] = useState<Category[]>([])
  const [liabilities, setLiabilities] = useState<Category[]>([])

  const calculations = useMemo(() => {
    const totalAssets = assets.reduce(
      (sum, category) =>
        sum + category.subItems.reduce((catSum, item) => catSum + (item.value || 0), 0),
      0
    )

    const totalLiabilities = liabilities.reduce(
      (sum, category) =>
        sum + category.subItems.reduce((catSum, item) => catSum + (item.value || 0), 0),
      0
    )

    return {
      totalAssets,
      totalLiabilities,
      impliedEquityValue: totalAssets - totalLiabilities,
    }
  }, [assets, liabilities])

  function generateId() {
    return Math.random().toString(36).substr(2, 9)
  }

  const addAssetCategory = (name: string) => {
    setAssets((prev) => [...prev, { id: generateId(), name, subItems: [] }])
  }

  const addLiabilityCategory = (name: string) => {
    setLiabilities((prev) => [...prev, { id: generateId(), name, subItems: [] }])
  }

  const removeAssetCategory = (id: string) => {
    setAssets((prev) => prev.filter((cat) => cat.id !== id))
  }

  const removeLiabilityCategory = (id: string) => {
    setLiabilities((prev) => prev.filter((cat) => cat.id !== id))
  }

  const addAssetItem = (categoryId: string, name: string) => {
    setAssets((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              subItems: [...cat.subItems, { id: generateId(), name, value: 0, justification: '' }],
            }
          : cat
      )
    )
  }

  const addLiabilityItem = (categoryId: string, name: string) => {
    setLiabilities((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              subItems: [...cat.subItems, { id: generateId(), name, value: 0, justification: '' }],
            }
          : cat
      )
    )
  }

  const removeAssetItem = (categoryId: string, itemId: string) => {
    setAssets((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? { ...cat, subItems: cat.subItems.filter((item) => item.id !== itemId) }
          : cat
      )
    )
  }

  const removeLiabilityItem = (categoryId: string, itemId: string) => {
    setLiabilities((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? { ...cat, subItems: cat.subItems.filter((item) => item.id !== itemId) }
          : cat
      )
    )
  }

  const updateAssetItem = (categoryId: string, itemId: string, updates: Partial<CategoryItem>) => {
    setAssets((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              subItems: cat.subItems.map((item) =>
                item.id === itemId ? { ...item, ...updates } : item
              ),
            }
          : cat
      )
    )
  }

  const updateLiabilityItem = (
    categoryId: string,
    itemId: string,
    updates: Partial<CategoryItem>
  ) => {
    setLiabilities((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              subItems: cat.subItems.map((item) =>
                item.id === itemId ? { ...item, ...updates } : item
              ),
            }
          : cat
      )
    )
  }

  return (
    <CostApproachContext.Provider
      value={{
        assets,
        liabilities,
        setAssets,
        setLiabilities,
        addAssetCategory,
        addLiabilityCategory,
        removeAssetCategory,
        removeLiabilityCategory,
        addAssetItem,
        addLiabilityItem,
        removeAssetItem,
        removeLiabilityItem,
        updateAssetItem,
        updateLiabilityItem,
        calculations,
      }}
    >
      {children}
    </CostApproachContext.Provider>
  )
}

export function useCostApproach() {
  const context = useContext(CostApproachContext)
  if (!context) {
    throw new Error('useCostApproach must be used within a CostApproachProvider')
  }
  return context
}
