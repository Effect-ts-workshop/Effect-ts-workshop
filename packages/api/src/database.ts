import { PgClient } from "@effect/sql-pg"
import { Config, pipe, Redacted, String } from "effect"

export const pgConfig = {
  host: pipe(Config.string("DB_HOST"), Config.withDefault("localhost")),
  port: pipe(Config.number("DB_PORT"), Config.withDefault(5433)),
  database: pipe(Config.string("DB_NAME"), Config.withDefault("effect-workshop")),
  username: pipe(Config.string("DB_USER"), Config.withDefault("effect-workshop")),
  password: pipe(Config.redacted("DB_PASSWORD"), Config.withDefault(Redacted.make("effect-workshop"))),
  transformQueryNames: Config.succeed(String.camelToSnake),
  transformResultNames: Config.succeed(String.snakeToCamel)
}
export const SqlLive = PgClient.layerConfig(pgConfig)
