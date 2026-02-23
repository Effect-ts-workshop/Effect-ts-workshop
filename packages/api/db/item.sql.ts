import { pgTable } from "drizzle-orm/pg-core"
import type { InventoryItemId } from "shared/item"

export const items = pgTable("items", (p) => ({
  id: p.uuid().$type<InventoryItemId>().primaryKey(),
  brand: p.varchar({
    length: 256
  }).notNull(),
  model: p.varchar({
    length: 256
  }).notNull(),
  createdAt: p.timestamp({
    mode: "date"
  }).notNull().defaultNow(),
  updatedAt: p.timestamp({
    mode: "date"
  }).notNull().defaultNow()
}))
