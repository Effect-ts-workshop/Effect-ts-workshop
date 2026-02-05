import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Result, useAtomSet, useAtomSubscribe, useAtomValue } from "@effect-atom/atom-react"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { InventoryItemId } from "shared/item"
import { ApiClient, ApiRpcClient } from "./lib/client"
import type { InventoryItem } from "./types/inventory"
import { SubmitButton, upsertForm } from "./UpsertForm"

function App() {
  const result = useAtomValue(ApiRpcClient.query("getAllItems", undefined, { reactivityKeys: ["items"] }))
  const removeItemById = useAtomSet(ApiClient.mutation("items", "removeItemById"))
  const reset = useAtomSet(upsertForm.reset)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item)
    setIsDialogOpen(true)
  }

  const handleDelete = (itemId: InventoryItemId) => {
    removeItemById({ path: { itemId }, reactivityKeys: ["items"] })
  }

  const resetForm = () => {
    reset()
    setEditingItem(null)
    setIsDialogOpen(false)
  }

  useAtomSubscribe(
    upsertForm.submit,
    (result) => {
      if (Result.isSuccess(result)) {
        resetForm()
      }
    },
    { immediate: false }
  )

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Inventory</h1>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={(e) => e.preventDefault()}>
              <upsertForm.Initialize defaultValues={{ brand: "", model: "" }}>
                <DialogHeader>
                  <DialogTitle>{editingItem ? "Edit Item" : "Add New Item"}</DialogTitle>
                  <DialogDescription>
                    {editingItem ? "Update the inventory item details." : "Add a new item to your inventory."}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <upsertForm.brand />
                  <upsertForm.model />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>

                  <SubmitButton editingItem={editingItem} />
                </DialogFooter>
              </upsertForm.Initialize>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {Result.builder(result)
        .onInitial(() => (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand</TableHead>
                <TableHead>Model</TableHead>
                <TableHead className="w-25">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3].map((i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-20" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ))
        .onSuccess(({ items }) => {
          if (items.length === 0) {
            return (
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
            </Table>
          )
        }).render()}
    </div>
  )
}

export default App
