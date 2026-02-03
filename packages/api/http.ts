import { HttpApiBuilder } from "@effect/platform"
import { Effect } from "effect"
import { Api } from "shared/api"
import { itemRepository } from "./db"

export const itemRoutesLive = HttpApiBuilder.group(Api, "items", (handlers) =>
  handlers
    .handle(
      "addItem",
      Effect.fn(function*({ payload }) {
        yield* itemRepository.add(payload)
      })
    )
    .handle(
      "updateItemById",
      Effect.fn(function*({ path, payload }) {
        yield* itemRepository.update({ id: path.itemId, ...payload })
      })
    )
    .handle(
      "removeItemById",
      Effect.fn(function*({ path }) {
        yield* itemRepository.removeById(path.itemId)
      })
    )
    .handle(
      "getItemById",
      Effect.fn(function*({ path }) {
        const item = yield* itemRepository.findById(path.itemId)
        return item
      })
    )
    .handle(
      "getAllItems",
      Effect.fn(function*() {
        const items = yield* itemRepository.getAll()
        return { items }
      })
    ))
