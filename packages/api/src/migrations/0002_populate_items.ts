import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.flatMap(
  SqlClient.SqlClient,
  (sql) =>
    sql`
    INSERT INTO items (
      id,
      brand,
      model
    ) VALUES (${crypto.randomUUID()}, 'TOSHIBA', 'from migration')
  `
)
