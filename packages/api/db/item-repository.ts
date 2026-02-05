import { SqlClient } from "@effect/sql"
import { Context, Effect, Layer } from "effect"
import type { InventoryItemId, InventoryItemSchema } from "shared/item"

type Item = typeof InventoryItemSchema.Type

export class ItemService extends Context.Tag("UserService")<
  ItemService,
  {
    getUsers: () => Effect.Effect<ReadonlyArray<Item>, never, never>
  }
>() {}

const makeUserService = Effect.fn(function*() {
  const sql = yield* SqlClient.SqlClient

  const getUsers = () =>
    Effect.catchAll(
      sql<{
        readonly id: InventoryItemId
        readonly brand: string
        readonly model: string
      }>`
    SELECT id, brand, model
    FROM items
    ORDER BY id
  `,
      () => Effect.succeed([] as ReadonlyArray<Item>)
    )

  return { getUsers }
})

export const UserServiceLive = Layer.effect(ItemService, makeUserService())
