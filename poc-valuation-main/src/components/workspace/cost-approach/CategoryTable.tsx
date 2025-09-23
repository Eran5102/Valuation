import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Minus } from 'lucide-react'
import { Category, CategoryItem } from '@/pages/workspace/methodologies/CostApproach'

interface CategoryTableProps {
  categories: Category[]
  onAddCategory: (name: string) => void
  onRemoveCategory: (id: string) => void
  onAddItem: (categoryId: string, name: string) => void
  onRemoveItem: (categoryId: string, itemId: string) => void
  onUpdateItem: (categoryId: string, itemId: string, updates: Partial<CategoryItem>) => void
  valueLabel: string
  addCategoryPlaceholder: string
  addItemPlaceholder: string
}

export default function CategoryTable({
  categories,
  onAddCategory,
  onRemoveCategory,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  valueLabel,
  addCategoryPlaceholder,
  addItemPlaceholder,
}: CategoryTableProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder={addCategoryPlaceholder}
          className="max-w-sm"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              const input = e.target as HTMLInputElement
              onAddCategory(input.value)
              input.value = ''
            }
          }}
        />
        <Button
          onClick={() => {
            const name = prompt(addCategoryPlaceholder)
            if (name) onAddCategory(name)
          }}
          size="icon"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {categories.map((category) => (
        <div key={category.id} className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">{category.name}</h3>
            <Button variant="ghost" size="icon" onClick={() => onRemoveCategory(category.id)}>
              <Minus className="h-4 w-4" />
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>{valueLabel}</TableHead>
                <TableHead>Basis/Source/Justification</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {category.subItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={item.value || ''}
                      onChange={(e) =>
                        onUpdateItem(category.id, item.id, {
                          value: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-32"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={item.justification}
                      onChange={(e) =>
                        onUpdateItem(category.id, item.id, {
                          justification: e.target.value,
                        })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveItem(category.id, item.id)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={4}>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      const name = prompt(addItemPlaceholder)
                      if (name) onAddItem(category.id, name)
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  )
}
