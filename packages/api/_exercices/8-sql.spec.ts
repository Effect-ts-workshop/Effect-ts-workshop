import { Model, SqlClient } from "@effect/sql"
import { eq, type InferInsertModel } from "drizzle-orm"
import { ConfigProvider, Effect, Layer, pipe, Schema } from "effect"
import { InventoryItemId, InventoryItemIdSchema } from "shared/item"
import { GenericContainer, Wait } from "testcontainers"
import { describe, expect, it as itBase } from "vitest"
import { items } from "../src/domains/items/db/item.sql"
import { SqlLive } from "../src/utils/database/database"
import { Database, DatabaseLive } from "../src/utils/database/database-drizzle"
import { MigratorLive } from "../src/utils/database/migrator"

const it = itBase.extend("pgConfig", async ({}, { onCleanup }) => {
  const container = await new GenericContainer("postgres:18.1")
    .withEnvironment({
      POSTGRES_USER: "test",
      POSTGRES_PASSWORD: "test",
      POSTGRES_DB: "test"
    })
    .withExposedPorts(5432)
    .withWaitStrategy(Wait.forLogMessage("database system is ready to accept connections", 2))
    .start()

  onCleanup(async () => {
    await container.stop()
  })

  return ConfigProvider.fromMap(
    new Map([
      ["DB_HOST", container.getHost()],
      ["DB_PORT", String(container.getMappedPort(5432))],
      ["DB_NAME", "test"],
      ["DB_USER", "test"],
      ["DB_PASSWORD", "test"]
    ])
  )
})

describe("Native effect module", () => {
  const databaseLayer = Layer.mergeAll(SqlLive, MigratorLive)

  /**
   * If you get an error like "Error: Could not find a working container runtime strategy"
   * Check docker is running
   */
  it("Should run raw sql", { timeout: 5_000 }, async ({ pgConfig }) => {
    const getAll = Effect.fn("getAll")(function*() {
      const sql = yield* SqlClient.SqlClient
      // #start
      // const items = TODO
      // #solution
      const items = yield* sql`
          SELECT *
          FROM items
        `
      // #end
      return items
    })

    const program = pipe(getAll(), Effect.provide(databaseLayer.pipe(Layer.provide(Layer.setConfigProvider(pgConfig)))))

    const result = await Effect.runPromise(program)
    expect(result.length).toBeGreaterThanOrEqual(1)
    expect(result).toContainEqual(expect.objectContaining({
      id: expect.any(String),
      brand: "TOSHIBA",
      model: "from migration"
    }))
  })

  it("Should operate CRUD easily", { timeout: 5_000 }, async ({ pgConfig }) => {
    class DbItem extends Model.Class<DbItem>("DbItem")({
      id: InventoryItemIdSchema,
      brand: Schema.String,
      model: Schema.String,
      createdAt: Model.DateTimeInsertFromDate,
      updatedAt: Model.DateTimeUpdateFromDate
    }) {}

    const getCrud = Effect.fn("getCrud")(function*() {
      // #start
      // const repository = TODO
      // #solution
      const repoConfig = {
        tableName: "items",
        idColumn: "id" as const,
        spanPrefix: "ItemRepository"
      }

      const repository = yield* Model.makeRepository(DbItem, repoConfig)
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
      Effect.provide(databaseLayer.pipe(Layer.provide(Layer.setConfigProvider(pgConfig))))
    )

    const result = await Effect.runPromise(program)
    expect(result.insertValue).toEqual(result.readValue)
  })
})

describe("Drizzle effect integration", () => {
  it("Simplify with query builder", { timeout: 5_000 }, async ({ pgConfig }) => {
    const testDatabaseLayer = Layer.mergeAll(
      DatabaseLive,
      Layer.mergeAll(SqlLive, MigratorLive)
    ).pipe(Layer.provide(Layer.setConfigProvider(pgConfig)))

    const add = Effect.fn("add")(function*(item: InferInsertModel<typeof items>) {
      const db = yield* Database

      // #start
      // return TODO
      // #solution
      return yield* db.insert(items).values(item)
      // #end
    })

    const findByBrand = Effect.fn("findByBrand")(function*(brand: string) {
      const db = yield* Database

      // #start
      // return TODO
      // #solution
      return yield* db.select().from(items).where(eq(items.brand, brand))
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
        Effect.provide(testDatabaseLayer)
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
