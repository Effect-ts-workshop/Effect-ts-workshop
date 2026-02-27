import { Result, useAtomValue } from "@effect-atom/atom-react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Option, Schema } from "effect"
import { InventoryItemIdSchema } from "shared/item"
import { Separator } from "../../components/ui/separator"
import { Skeleton } from "../../components/ui/skeleton"
import { ApiClient } from "../../lib/client"

export const Route = createFileRoute("/items/$id")({
  params: {
    parse: Schema.decodeSync(Schema.Struct({ id: InventoryItemIdSchema }))
  },
  component: ItemDetail
})

function ItemDetail() {
  const { id } = Route.useParams()
  const result = useAtomValue(
    ApiClient.query("items", "getItemById", {
      path: { itemId: id }
    })
  )

  return (
    <div className="container mx-auto py-10 px-4 max-w-2xl">
      <Link
        to="/items"
        className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1"
      >
        ← Back to Inventory
      </Link>

      <div className="mt-6 rounded-lg border bg-card p-8 shadow-sm">
        {Result.builder(result)
          .onInitial(() => <ItemDetailSkeleton />)
          .onSuccess((maybeItem) =>
            Option.match(maybeItem, {
              onNone: () => (
                <div className="text-center py-12">
                  <p className="text-2xl font-semibold text-muted-foreground">Item not found</p>
                  <p className="text-sm text-muted-foreground mt-2">No item exists with ID: {id}</p>
                </div>
              ),
              onSome: (item) => (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-3xl font-bold">{item.brand} {item.model}</h1>
                  </div>

                  <Separator />

                  <dl className="grid gap-4">
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground uppercase tracking-wide">ID</dt>
                      <dd className="mt-1 font-mono text-sm text-foreground">{item.id}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Brand</dt>
                      <dd className="mt-1 text-lg font-semibold">{item.brand}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Model</dt>
                      <dd className="mt-1 text-lg font-semibold">{item.model}</dd>
                    </div>
                  </dl>
                </div>
              )
            })
          )
          .render()}
      </div>
    </div>
  )
}

function ItemDetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Separator />
      <div className="space-y-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-6 w-64" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-6 w-64" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-6 w-48" />
      </div>
    </div>
  )
}
