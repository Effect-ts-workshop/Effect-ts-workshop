import { useState } from 'react'
import type { InventoryItem } from './types/inventory'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Result, useAtomSet, useAtomValue } from '@effect-atom/atom-react'
import { ApiClient } from './lib/client'
import { InventoryItemId } from 'shared/item'
import { Cause } from 'effect'

function App() {
  const result = useAtomValue(ApiClient.query("items", "getAllItems", {}))
  const addItem = useAtomSet(ApiClient.mutation("items", "addItem"))
  const updateItemById = useAtomSet(ApiClient.mutation("items", "updateItemById"))
  const removeItemById = useAtomSet(ApiClient.mutation("items", "removeItemById"))
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [formData, setFormData] = useState({ brand: '', model: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingItem) {
      updateItemById({path: {itemId: editingItem.id}, payload: { brand: formData.brand, model: formData.model }})
    } else {
      addItem({payload: {
        id: InventoryItemId(crypto.randomUUID()),
        brand: formData.brand,
        model: formData.model,
      }})
    }
    resetForm()
  }

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item)
    setFormData({ brand: item.brand, model: item.model })
    setIsDialogOpen(true)
  }

  const handleDelete = (itemId: InventoryItemId) => {
    removeItemById({path: {itemId}})
  }

  const resetForm = () => {
    setFormData({ brand: '', model: '' })
    setEditingItem(null)
    setIsDialogOpen(false)
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Inventory</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
                <DialogDescription>
                  {editingItem ? 'Update the inventory item details.' : 'Add a new item to your inventory.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="Enter brand"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="Enter model"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingItem ? 'Update' : 'Add'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {Result.builder(result)
    .onInitial(() => <div>Loading...</div>)
    .onWaiting(() => <div>Loading...</div>)
    .onFailure((cause) => <div>Error: {Cause.pretty(cause)}</div>)
    .onSuccess(({ items }) => {
      if (items.length === 0){
        return  (
        <div className="text-center py-12 text-muted-foreground">
          No items in inventory. Add your first item to get started.
        </div>
      )
      }
      
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Brand</TableHead>
              <TableHead>Model</TableHead>
              <TableHead className="w-25">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.brand}</TableCell>
                <TableCell>{item.model}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>)
    }).render() 
      }
    </div>
  )
}

export default App
