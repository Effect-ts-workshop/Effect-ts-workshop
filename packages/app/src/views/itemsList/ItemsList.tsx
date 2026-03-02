import { ButtonLink } from "@/components/ui/button-link"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Result, useAtomValue } from "@effect-atom/atom-react"
import { createFileRoute, Outlet } from "@tanstack/react-router"
import { Pencil, Plus, Trash2 } from "lucide-react"
import type { MouseEventHandler } from "react"
import { ApiClient } from "../../lib/client"
import type { InventoryItem } from "../../types/inventory"

export const Route = createFileRoute("/items")({
  component: Index
})

function Index() {
  const result = useAtomValue(ApiClient.query("items", "getAllItems", { reactivityKeys: ["items"] }))

  return (
    <>
      <div className="container mx-auto py-10 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Inventory</h1>
          <ButtonLink to="/items/create">
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </ButtonLink>
        </div>

        {Result.builder(result)
          .onInitial(() => <InventoryTableSkeleton />)
          .onSuccess(({ items }) =>
            (items.length === 0)
              ? <EmptyInventory />
              : (
                <InventoryTable
                  items={items}
                />
              )
          )
          .render()}
      </div>
      <Outlet />
    </>
  )
}

export function InventoryTableSkeleton() {
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
  item
}: {
  item: InventoryItem
}) {
  const navigate = Route.useNavigate()
  const onRowClick: MouseEventHandler<HTMLTableRowElement> = (e) => {
    if (e.defaultPrevented) {
      return
    }

    navigate({ to: "/items/$id", params: { id: item.id } })
  }

  return (
    <TableRow onClick={onRowClick} className="cursor-pointer">
      <TableCell className="font-medium">{item.brand}</TableCell>
      <TableCell>{item.model}</TableCell>
      <TableCell>
        <div className="flex gap-2">
          <ButtonLink
            to="/items/$id/edit"
            params={{ id: item.id }}
            variant="ghost"
            size="icon"
          >
            <Pencil className="h-4 w-4" />
          </ButtonLink>
          <ButtonLink
            to="/items/$id/remove"
            params={{ id: item.id }}
            variant="ghost"
            size="icon"
          >
            <Trash2 className="h-4 w-4" />
          </ButtonLink>
        </div>
      </TableCell>
    </TableRow>
  )
}

function InventoryTable({
  items
}: {
  items: ReadonlyArray<InventoryItem>
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
        {items.map((item) => <InventoryItemRow key={item.id} item={item} />)}
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
