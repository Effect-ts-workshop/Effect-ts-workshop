import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Result, useAtomSet, useAtomSubscribe, useAtomValue } from "@effect-atom/atom-react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Pencil, Trash2 } from "lucide-react"
import { useState } from "react"
import type { InventoryItemId } from "shared/item"
import { ApiClient } from "../../lib/client"
import type { InventoryItem } from "../../types/inventory"
import { upsertForm } from "../../UpsertForm"
import { UpsertItemDialog } from "../../UpsertItemDialog"

export const Route = createFileRoute("/items/")({
  component: Index
})

function Index() {
  const result = useAtomValue(ApiClient.query("items", "getAllItems", { reactivityKeys: ["items"] }))
  const removeItemById = useAtomSet(ApiClient.mutation("items", "removeItemById"))
  const reset = useAtomSet(upsertForm.reset)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const navigate = useNavigate()

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
                  onRowClick={(item) => navigate({ to: "/items/$id", params: { id: item.id } })}
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

function InventoryTableSkeleton() {
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
  )
}

function InventoryItemRow({
  item,
  onRowClick,
  onDelete,
  onEdit
}: {
  item: InventoryItem
  onRowClick: (item: InventoryItem) => void
  onEdit: (item: InventoryItem) => void
  onDelete: (itemId: InventoryItemId) => void
}) {
  return (
    <TableRow onClick={() => onRowClick(item)}>
      <TableCell className="font-medium">{item.brand}</TableCell>
      <TableCell>{item.model}</TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

function InventoryTable({
  items,
  onRowClick,
  onDelete,
  onEdit
}: {
  items: ReadonlyArray<InventoryItem>
  onRowClick: (item: InventoryItem) => void
  onEdit: (item: InventoryItem) => void
  onDelete: (itemId: InventoryItemId) => void
}) {
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
          <InventoryItemRow key={item.id} item={item} onRowClick={onRowClick} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </TableBody>
    </Table>
  )
}

export function EmptyInventory() {
  return (
    <div className="text-center py-12 text-muted-foreground">
      No items in inventory. Add your first item to get started.
    </div>
  )
}
