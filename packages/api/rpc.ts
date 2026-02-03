import { Effect } from "effect"
import { ItemRpcs } from "shared/rpc"
import { itemRepository } from "./db"

export const itemHandlers = ItemRpcs.toLayer({
  addItem: Effect.fn(function*(item) {
    yield* itemRepository.add(item)
  }),
  updateItem: Effect.fn(function*(item) {
    yield* itemRepository.update(item)
  }),
  removeItemById: Effect.fn(function*({ id }) {
    yield* itemRepository.removeById(id)
  }),
  getItemById: Effect.fn(function*({ id }) {
    const item = yield* itemRepository.findById(id)
    return item
  }),
  getAllItems: Effect.fn(function*() {
    const items = yield* itemRepository.getAll()
    return { items }
  })
})
