import { HttpApiBuilder } from "@effect/platform"
import { Effect, pipe } from "effect"
import { Api } from "shared/api"
import { itemRepository } from "./db"
import { ItemRepository } from "./db/item-repository"

export const itemRoutesLive = HttpApiBuilder.group(Api, "items", (handlers) =>
  handlers
    .handle(
      "addItem",
      Effect.fn(function*({ payload }) {
        const users = yield* ItemRepository
        yield* users.add({ ...payload, createdAt: undefined, updatedAt: undefined })
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
      Effect.fn(
        function*() {
          const users = yield* ItemRepository
          const allUsers = yield* pipe(
            users.getAll(),
            Effect.tapError(Effect.logError),
            Effect.catchAll(() => Effect.succeed([]))
          )
          return { items: allUsers }
        }
      )
    ))
