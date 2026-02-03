import { Array, Effect } from "effect";
import { InventoryItemId, InventoryItemSchema } from "shared/item";

type Item = typeof InventoryItemSchema.Type;
let items: Item[] = [];

export const itemRepository = {
  add: (item: Item) => {
    items = [...items, item];
  },
  update: (newItem: Item) => {
    items = items.map((item) => (item.id === newItem.id ? newItem : item));
  },
  removeById: (id: InventoryItemId) => {
    items = items.filter((item) => item.id !== id);
  },
  findById: (id: InventoryItemId) => {
    return Array.findFirst(items, (item) => item.id === id);
  },
  getAll: Effect.fn(function* () {
    return items;
  }, Effect.delay("1 second")),
};
