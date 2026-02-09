import { Model, SqlClient } from "@effect/sql"
import { Effect, Schema } from "effect"
import { InventoryItemIdSchema } from "shared/item"
import { SqlLive } from "../database"

// type Item = typeof InventoryItemSchema.Type

class DbItem extends Model.Class<DbItem>("DbItem")({
  id: InventoryItemIdSchema,
  brand: Schema.String,
  model: Schema.String,
  createdAt: Model.DateTimeInsertFromDate,
  updatedAt: Model.DateTimeUpdateFromDate
}) {}

export class ItemRepository extends Effect.Service<ItemRepository>()("app/ItemRepository", {
  // Define how to create the service
  effect: Effect.gen(function*() {
    const sql = yield* SqlClient.SqlClient
    const repoConfig = {
      tableName: "items",
      idColumn: "id" as const,
      spanPrefix: "ItemRepository"
    }

    const repo = yield* Model.makeRepository(DbItem, repoConfig)

    const getAll = Effect.fn("getAll")(function*() {
      const items = yield* sql<DbItem>`
      SELECT *
      FROM ${sql(repoConfig.tableName)}
      ORDER BY id
    `
      return items
    })

    return { getAll, add: repo.insert }
  }),
  // Specify dependencies
  dependencies: [SqlLive]
}) {}

// const findAllSchema = SqlSchema.findAll({
//   Request: DbItem.select,
//   Result: DbItem,
//   execute: () => sql`select * from ${sql(repoConfig.tableName)}`
// })

// const totot = (): Effect.Effect<S["Type"], never, S["Context"] | S["insert"]["Context"]> =>
//   findAllSchema({}).pipe(
//     Effect.orDie,
//     Effect.withSpan(`${options.spanPrefix}.insert`, {
//       captureStackTrace: false,
//       attributes: { insert }
//     })
//   ) as any

//   const sql = yield* SqlClient.SqlClient

//   const InsertItem = yield* SqlResolver.ordered("InsertItem", {
//     Request: DbItem,
//     Result: DbItem,
//     execute: (requests) =>
//       sql`
//       INSERT INTO people
//       ${sql.insert(requests)}
//       RETURNING people.*
//     `
//   })

//   const GetItemById = yield* SqlResolver.findById("GetItemById", {
//     Id: InventoryItemIdSchema,
//     Result: DbItem,
//     ResultId: (_) => _.id,
//     execute: (ids) => sql`SELECT * FROM people WHERE ${sql.in("id", ids)}`
//   })

//   const getAll = Effect.fn("getAll")(function*() {
//     const item = yield* sql<DbItem>`
//   SELECT id, brand, model
//   FROM items
//   ORDER BY id
// `
//     return item
//   })

//   const update = Effect.fn("update")(function*(item: Item) {
//     return yield* sql`
//       UPDATE people SET ${sql.update(item)}
//       RETURNING people.*
//     `
//   })

//   const removeById = Effect.fn("removeById")(function*(itemId: InventoryItemId) {
//     return yield* sql`
//       DELETE people SET ${sql.update(item)}
//       RETURNING people.*
//     `
//   })

//   return { getAll, add: InsertItem.execute, findById: GetItemById.execute, update }
