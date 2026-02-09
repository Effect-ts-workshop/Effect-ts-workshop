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
import { useAtomSet, useAtomValue } from "@effect-atom/atom-react"
import { Plus } from "lucide-react"
import type { InventoryItem } from "./types/inventory"
import { upsertForm } from "./UpsertForm"

function SubmitButton({ editingItem }: { editingItem: InventoryItem | null }) {
  const submitResult = useAtomValue(upsertForm.submit)
  const submit = useAtomSet(upsertForm.submit)
  return (
    <Button type="submit" onClick={() => submit({ editingItem })} disabled={submitResult.waiting}>
      {editingItem ? "Update" : "Add"}
    </Button>
  )
}

export function UpsertItemDialog({
  editingItem,
  isOpen,
  onOpenChange,
  onReset
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  editingItem: InventoryItem | null
  onReset: () => void
}) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        onOpenChange(open)
        if (!open) {
          onReset()
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingItem ? "Edit Item" : "Add New Item"}</DialogTitle>
          <DialogDescription>
            {editingItem ? "Update the inventory item details." : "Add a new item to your inventory."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => e.preventDefault()}>
          <upsertForm.Initialize defaultValues={editingItem || { brand: "", model: "" }}>
            <div className="grid gap-4 py-4">
              <upsertForm.brand />
              <upsertForm.model />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onReset}>
                Cancel
              </Button>

              <SubmitButton editingItem={editingItem} />
            </DialogFooter>
          </upsertForm.Initialize>
        </form>
      </DialogContent>
    </Dialog>
  )
}
