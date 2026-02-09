import { NodeContext } from "@effect/platform-node"
import { PgMigrator } from "@effect/sql-pg"
import { Layer } from "effect"
import { fileURLToPath } from "node:url"
import { SqlLive } from "./database"

export const MigratorLive = PgMigrator.layer({
  loader: PgMigrator.fromFileSystem(
    fileURLToPath(new URL("migrations", import.meta.url))
  ),
  // Where to put the `_schema.sql` file
  schemaDirectory: "src/migrations"
}).pipe(Layer.provide(SqlLive), Layer.provide(NodeContext.layer))
