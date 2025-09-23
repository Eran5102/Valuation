import { useCostApproach } from '@/contexts/CostApproachContext'
import CategoryTable from './CategoryTable'

export default function LiabilityCategoryTable() {
  const {
    liabilities,
    addLiabilityCategory,
    removeLiabilityCategory,
    addLiabilityItem,
    removeLiabilityItem,
    updateLiabilityItem,
  } = useCostApproach()

  return (
    <CategoryTable
      categories={liabilities}
      onAddCategory={addLiabilityCategory}
      onRemoveCategory={removeLiabilityCategory}
      onAddItem={addLiabilityItem}
      onRemoveItem={removeLiabilityItem}
      onUpdateItem={updateLiabilityItem}
      valueLabel="Adjusted / Fair Value ($)"
      addCategoryPlaceholder="Add new liability category (e.g., Current Liabilities: Accounts Payable, Long-Term Debt)"
      addItemPlaceholder="Add new liability item (e.g., Bank Loan A, Operating Lease)"
    />
  )
}
