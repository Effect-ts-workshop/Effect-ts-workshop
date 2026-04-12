import { NodeContext } from "@effect/platform-node"
import { PgMigrator } from "@effect/sql-pg"
import { Layer, pipe } from "effect"
import { fileURLToPath } from "node:url"
import { SqlLive } from "./database"

export const MigratorLive = pipe(
  PgMigrator.layer({
    loader: PgMigrator.fromFileSystem(
      fileURLToPath(new URL("../../migrations", import.meta.url))
    )
  }),
  Layer.provide(SqlLive),
  Layer.provide(NodeContext.layer)
)
