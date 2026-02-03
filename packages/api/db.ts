/* eslint-disable require-yield */
import { Array, Effect } from "effect"
import type { InventoryItemId, InventoryItemSchema } from "shared/item"

type Item = typeof InventoryItemSchema.Type
let items: Array<Item> = []

export const itemRepository = {
  add: Effect.fn(function*(item: Item) {
    items = [...items, item]
  }),
  update: Effect.fn(function*(newItem: Item) {
    items = items.map((item) => (item.id === newItem.id ? newItem : item))
  }),
  removeById: Effect.fn(function*(id: InventoryItemId) {
    items = items.filter((item) => item.id !== id)
  }),
  findById: Effect.fn(function*(id: InventoryItemId) {
    return Array.findFirst(items, (item) => item.id === id)
  }),
  getAll: Effect.fn(function*() {
    return items
  }, Effect.delay("1 second"))
}
