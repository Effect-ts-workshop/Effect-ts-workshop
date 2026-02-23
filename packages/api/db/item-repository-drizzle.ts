import { eq } from "drizzle-orm"
import { Array, Effect } from "effect"
import type { InventoryItemId, InventoryItemSchema } from "shared/item"
import { Database, DatabaseLive } from "../database"
import { items } from "./item.sql"

type Item = typeof InventoryItemSchema.Type

export class ItemRepositoryDrizzle extends Effect.Service<ItemRepositoryDrizzle>()("app/ItemRepositoryDrizzle", {
  effect: Effect.gen(function*() {
    const db = yield* Database

    const getAll = () => db.select().from(items)

    const findById = Effect.fn(function*(itemId: InventoryItemId) {
      const rows = yield* db.select().from(items).where(eq(items.id, itemId))
      return Array.head(rows)
    })

    const add = (item: Item) => db.insert(items).values(item)

    const update = (item: Item) => db.update(items).set(item).where(eq(items.id, item.id))

    const remove = (itemId: InventoryItemId) => db.delete(items).where(eq(items.id, itemId))

    return { getAll, add, update, delete: remove, findById }
  }),
  dependencies: [DatabaseLive]
}) {}
