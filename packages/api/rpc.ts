import { Effect } from "effect";
import { ItemRpcs } from "shared/rpc";
import { itemRepository } from "./db";

export const itemHandlers = ItemRpcs.toLayer({
  addItem: Effect.fn(function* (item) {
    itemRepository.add(item);
  }),
  updateItem: Effect.fn(function* (item) {
    itemRepository.update(item);
  }),
  removeItemById: Effect.fn(function* ({ id }) {
    itemRepository.removeById(id);
  }),
  getItemById: Effect.fn(function* ({ id }) {
    return itemRepository.findById(id);
  }),
  getAllItems: Effect.fn(function* () {
    const items = yield* itemRepository.getAll();
    return { items };
  }),
});
