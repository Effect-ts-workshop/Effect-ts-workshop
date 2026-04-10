import { Model, SqlClient } from "@effect/sql"
import type { InferInsertModel } from "drizzle-orm"
import { Effect, Layer, pipe, Schema } from "effect"
import { InventoryItemId, InventoryItemIdSchema } from "shared/item"
import { describe, expect, it } from "vitest"
import { SqlLive } from "../database"
import { Database, DatabaseLive } from "../database-drizzle"
import type { items } from "../db/item.sql"
import { MigratorLive } from "../migrator"

const TODO: any = {}

/**
 * Key points to document:
 * - run `docker compose up -d`
 * TODO : add testcontainer
 */

describe("Native effect module", () => {
  const databaseLayer = Layer.mergeAll(SqlLive, MigratorLive)

  it("Should run raw sql", async () => {
    const getAll = Effect.fn("getAll")(function*() {
      const sql = yield* SqlClient.SqlClient
      // #start
      const items = TODO
      // #solution
      // const items = yield* sql`
      //     SELECT *
      //     FROM items
      //     ORDER BY id
      //   `
      // #end
      return items
    })

    const program = pipe(getAll(), Effect.provide(databaseLayer))

    const result = await Effect.runPromise(program)
    expect(result.length).toBeGreaterThanOrEqual(1)
    expect(result).toContainEqual(expect.objectContaining({
      id: expect.any(String),
      brand: "TOSHIBA",
      model: "from migration"
    }))
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
      // #start
      const repository = TODO
      // #solution
      // const repoConfig = {
      //   tableName: "items",
      //   idColumn: "id" as const,
      //   spanPrefix: "ItemRepository"
      // }

      // const repository = yield* Model.makeRepository(DbItem, repoConfig)
      // #end

      return repository
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
      Effect.provide(databaseLayer)
    )

    const result = await Effect.runPromise(program)
    expect(result.insertValue).toEqual(result.readValue)
  })
})

describe("Drizzle effect integration", () => {
  it("Simplify with query builder", async () => {
    const add = Effect.fn("add")(function*(item: InferInsertModel<typeof items>) {
      const db = yield* Database

      // #start
      return TODO
      // #solution
      // return yield* db.insert(items).values(item)
      // #end
    })

    const findByBrand = Effect.fn("findByBrand")(function*(brand: string) {
      const db = yield* Database

      // #start
      return TODO
      // #solution
      // return yield* db.select().from(items).where(eq(items.brand, brand))
      // #end
    })

    const program = (id: InventoryItemId) =>
      pipe(
        Effect.gen(function*() {
          yield* add({
            id,
            brand: "NEW BRAND",
            model: "NEW MODEL"
          })
          return yield* findByBrand("NEW BRAND")
        }),
        Effect.provide(DatabaseLive)
      )

    const newId = InventoryItemId(crypto.randomUUID())
    const result = await Effect.runPromise(program(newId))
    expect(result).toContainEqual(expect.objectContaining({
      id: newId,
      brand: "NEW BRAND",
      model: "NEW MODEL"
    }))
  })
})
