import { Result, useAtomSet, useAtomSubscribe, useAtomValue } from "@effect-atom/atom-react"
import { useState } from "react"
import type { InventoryItemId } from "shared/item"
import { EmptyInventory } from "./EmptyInventory"
import { InventoryTable } from "./InventoryTable"
import { InventoryTableSkeleton } from "./InventoryTableSkeleton"
import { ApiClient } from "./lib/client"
import type { InventoryItem } from "./types/inventory"
import { upsertForm } from "./UpsertForm"
import { UpsertItemDialog } from "./UpsertItemDialog"

function App() {
  const result = useAtomValue(ApiClient.query("items", "getAllItems", { reactivityKeys: ["items"] }))
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
    <>
      <div className="container mx-auto py-10 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Inventory</h1>
          <UpsertItemDialog
            isOpen={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            editingItem={editingItem}
            onReset={resetForm}
          />
        </div>

        {Result.builder(result)
          .onInitial(() => <InventoryTableSkeleton />)
          .onSuccess(({ items }) =>
            (items.length === 0)
              ? <EmptyInventory />
              : (
                <InventoryTable
                  items={items}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )
          )
          .render()}
      </div>
    </>
  )
}

export default App
