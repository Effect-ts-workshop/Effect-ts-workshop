import { Model, SqlClient } from "@effect/sql"
import type { InferInsertModel } from "drizzle-orm"
import { eq } from "drizzle-orm"
import { Effect, Layer, pipe, Schema } from "effect"
import { InventoryItemId, InventoryItemIdSchema } from "shared/item"
import { describe, expect, it } from "vitest"
import { SqlLive } from "../database"
import { Database, DatabaseLive, SqlDrizzleLive } from "../database-drizzle"
import { items } from "../db/item.sql"
import { MigratorLive } from "../migrator"

/**
 * Key points to document:
 * - run `docker compose up -d`
 */

describe("Native effect module", () => {
  const layer = Layer.mergeAll(SqlLive, MigratorLive)

  it("Should run raw sql", async () => {
    const getAll = Effect.fn("getAll")(function*() {
      const sql = yield* SqlClient.SqlClient
      const items = yield* sql`
          SELECT *
          FROM items
          ORDER BY id
        `
      return items
    })

    const program = pipe(getAll(), Effect.provide(layer))

    await expect(Effect.runPromise(program)).resolves.toMatchObject([{
      id: expect.any(String),
      brand: "TOSHIBA",
      model: "from migration"
    }])
  })

  it("Should operate CRUD easily", async () => {
    class DbItem extends Model.Class<DbItem>("DbItem")({
      id: InventoryItemIdSchema,
      brand: Schema.String,
      model: Schema.String,
      createdAt: Model.DateTimeInsertFromDate,
      updatedAt: Model.DateTimeUpdateFromDate
    }) {}

    const getCrud = Effect.fn("getCrud")(function*() {
      const repoConfig = {
        tableName: "items",
        idColumn: "id" as const,
        spanPrefix: "ItemRepository"
      }

      return yield* Model.makeRepository(DbItem, repoConfig)
    })

    const program = pipe(
      Effect.gen(function*() {
        const crud = yield* getCrud()
        const insertValue = yield* crud.insert({
          id: InventoryItemId(crypto.randomUUID()),
          brand: "NEW BRAND",
          model: "NEW MODEL",
          createdAt: undefined,
          updatedAt: undefined
        })

        const foundReadValue = yield* crud.findById(insertValue.id)
        const readValue = yield* foundReadValue

        return { insertValue, readValue }
      }),
      Effect.provide(layer)
    )

    const result = await Effect.runPromise(program)
    expect(result.insertValue).toEqual(result.readValue)
  })
})

describe("Drizzle effect integration", () => {
  const layer = Layer.mergeAll(DatabaseLive)

  it("Simplify with query builder", async () => {
    const add = Effect.fn("add")(function*(item: InferInsertModel<typeof items>) {
      const db = yield* Database

      return yield* db.insert(items).values(item)
    })

    const findByBrand = Effect.fn("findByBrand")(function*(brand: string) {
      const db = yield* Database

      return yield* db.select().from(items).where(eq(items.brand, brand))
    })

    const program = pipe(
      Effect.gen(function*() {
        yield* add({
          id: InventoryItemId(crypto.randomUUID()),
          brand: "NEW BRAND",
          model: "NEW MODEL"
        })
        return yield* findByBrand("TOSHIBA")
      }),
      Effect.provide(layer)
    )

    await expect(Effect.runPromise(program)).resolves.toMatchObject([{
      id: expect.any(String),
      brand: "TOSHIBA",
      model: "from migration"
    }])
  })
})
