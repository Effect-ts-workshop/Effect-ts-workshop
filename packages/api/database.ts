import { PgClient } from "@effect/sql-pg"
import { defineRelations } from "drizzle-orm"
import * as PgDrizzle from "drizzle-orm/effect-postgres"
import { Config, Context, Effect, Layer, pipe, Redacted, String } from "effect"
import type { TypeOverrides } from "pg"
import { types } from "pg"
import { items } from "./db/item.sql"

export const SqlLive = PgClient.layerConfig({
  host: Config.string("DB_HOST").pipe(
    Config.withDefault("localhost")
  ),
  port: Config.number("DB_PORT").pipe(
    Config.withDefault(5433)
  ),
  database: Config.string("DB_NAME").pipe(
    Config.withDefault("effect-workshop")
  ),
  username: Config.string("DB_USER").pipe(
    Config.withDefault("effect-workshop")
  ),
  password: Config.redacted("DB_PASSWORD").pipe(
    Config.withDefault(Redacted.make("effect-workshop"))
  ),
  transformQueryNames: Config.succeed(String.camelToSnake),
  transformResultNames: Config.succeed(String.snakeToCamel),
  types: Config.succeed({
    getTypeParser: (typeId, format) => {
      // Return raw values for date/time types to let Drizzle handle parsing
      if ([1184, 1114, 1082, 1186, 1231, 1115, 1185, 1187, 1182].includes(typeId)) {
        return (val: any) => val
      }
      return types.getTypeParser(typeId, format)
    }
  } as TypeOverrides)
})

// Create the DB effect with default services
const dbEffect = PgDrizzle.make({ casing: "snake_case", relations: defineRelations({ items }) }).pipe(
  Effect.provide(PgDrizzle.DefaultServices)
)

// Define a DB service tag for dependency injection
export class Database extends Context.Tag("Database")<Database, Effect.Effect.Success<typeof dbEffect>>() {}

// Create a layer that provides the DB service
export const DatabaseLive = pipe(
  Layer.effect(
    Database,
    Effect.gen(function*() {
      return yield* dbEffect
    })
  ),
  Layer.provide(SqlLive)
)
