import { useCostApproach } from '@/contexts/CostApproachContext'
import CategoryTable from './CategoryTable'

export default function AssetCategoryTable() {
  const {
    assets,
    addAssetCategory,
    removeAssetCategory,
    addAssetItem,
    removeAssetItem,
    updateAssetItem,
  } = useCostApproach()

  return (
    <CategoryTable
      categories={assets}
      onAddCategory={addAssetCategory}
      onRemoveCategory={removeAssetCategory}
      onAddItem={addAssetItem}
      onRemoveItem={removeAssetItem}
      onUpdateItem={updateAssetItem}
      valueLabel="Adjusted Value / RCNLD ($)"
      addCategoryPlaceholder="Add new asset category (e.g., Tangible Assets: PP&E, Current Assets: Cash, Intangible Assets: Patents)"
      addItemPlaceholder="Add new asset item (e.g., Manufacturing Equipment, Inventory, Trademarks)"
    />
  )
}
