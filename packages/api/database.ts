import { PgClient } from "@effect/sql-pg"
import { Config, Redacted } from "effect"

export const db = PgClient.layerConfig({
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
  )
})
