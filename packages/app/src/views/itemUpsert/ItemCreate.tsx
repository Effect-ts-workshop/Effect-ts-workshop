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
import { useAtomSet, useAtomValue } from "@effect-atom/atom-react"
import { createFileRoute } from "@tanstack/react-router"
import { createForm } from "./upsert-form"

export const Route = createFileRoute("/items/create")({
  component: RouteComponent
})

function RouteComponent() {
  const navigate = Route.useNavigate()
  const submitResult = useAtomValue(createForm.submit)
  const submit = useAtomSet(createForm.submit, { mode: "promise" })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await submit()
    await navigate({ to: "/items" })
  }

  return (
    <Dialog
      open
      onOpenChange={() => navigate({ to: "/items" })}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
          <DialogDescription>
            Add a new item to your inventory.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <createForm.Initialize defaultValues={{ brand: "", model: "" }}>
            <div className="grid gap-4 py-4">
              <createForm.brand />
              <createForm.model />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>

              <Button
                type="submit"
                disabled={submitResult.waiting}
              >
                Add
              </Button>
            </DialogFooter>
          </createForm.Initialize>
        </form>
      </DialogContent>
    </Dialog>
  )
}
