import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { getResultAtom } from "@/lib/atom"
import { ApiClient } from "@/lib/client"
import { effectLoader, redirect } from "@/lib/router"
import { useAtomSet, useAtomValue } from "@effect-atom/atom-react"
import { createFileRoute } from "@tanstack/react-router"
import { Effect, Schema } from "effect"
import { InventoryItemId, InventoryItemIdSchema } from "shared/item"
import { updateForm } from "./upsert-form"

export const Route = createFileRoute("/items/$id/edit")({
  gcTime: 0,
  params: {
    parse: Schema.decodeSync(Schema.Struct({ id: InventoryItemIdSchema }))
  },
  loader: async ({ abortController, params: { id } }) =>
    effectLoader(
      Effect.gen(function*() {
        const foundItem = yield* getResultAtom(ApiClient.query("items", "getItemById", {
          path: { itemId: InventoryItemId(id) },
          reactivityKeys: ["items", id]
        }))

        const item = yield* Effect.orElse(
          foundItem,
          redirect({
            to: "/items"
          })
        )

        return item
      }),
      abortController
    ),
  component: RouteComponent
})

function RouteComponent() {
  const navigate = Route.useNavigate()
  const data = Route.useLoaderData()
  const submitResult = useAtomValue(updateForm.submit)
  const submit = useAtomSet(updateForm.submit, { mode: "promise" })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await submit({ editingItem: data })
    await navigate({ to: "/items" })
  }

  return (
    <Dialog
      open
      onOpenChange={() => navigate({ to: "/items" })}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
          <DialogDescription>
            Update the inventory item details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <updateForm.Initialize defaultValues={data}>
            <div className="grid gap-4 py-4">
              <updateForm.brand />
              <updateForm.model />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>

              <Button type="submit" disabled={submitResult.waiting}>
                Edit
              </Button>
            </DialogFooter>
          </updateForm.Initialize>
        </form>
      </DialogContent>
    </Dialog>
  )
}
