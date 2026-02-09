import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil, Trash2 } from "lucide-react"
import type { InventoryItemId } from "shared/item"
import type { InventoryItem } from "./types/inventory"

function InventoryItemRow({
  item,
  onDelete,
  onEdit
}: {
  item: InventoryItem
  onEdit: (item: InventoryItem) => void
  onDelete: (itemId: InventoryItemId) => void
}) {
  return (
    <TableRow>
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

export function InventoryTable({
  items,
  onDelete,
  onEdit
}: {
  items: ReadonlyArray<InventoryItem>
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
        {items.map((item) => <InventoryItemRow key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} />)}
      </TableBody>
    </Table>
  )
}
