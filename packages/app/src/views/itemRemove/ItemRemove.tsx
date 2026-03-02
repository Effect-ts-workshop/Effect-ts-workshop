import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { ApiClient } from "@/lib/client"
import { useAtomSet } from "@effect-atom/atom-react"
import { createFileRoute } from "@tanstack/react-router"
import { Schema } from "effect"
import { InventoryItemIdSchema } from "shared/item"

export const Route = createFileRoute("/items/$id/remove")({
  params: {
    parse: Schema.decodeSync(Schema.Struct({ id: InventoryItemIdSchema }))
  },
  component: ItemRemove
})

function ItemRemove() {
  const navigate = Route.useNavigate()
  const { id } = Route.useParams()
  const removeItemById = useAtomSet(ApiClient.mutation("items", "removeItemById"), { mode: "promise" })

  const handleDelete = () =>
    removeItemById({ path: { itemId: id }, reactivityKeys: ["items"] })
      .then(() => navigate({ to: "/items" }))

  return (
    <AlertDialog open onOpenChange={() => navigate({ to: "/items" })}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your item from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
