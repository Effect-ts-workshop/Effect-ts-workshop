import { HttpApiBuilder } from "@effect/platform"
import { Effect, pipe } from "effect"
import { Api } from "shared/api"
import { ItemRepository } from "./db/item-repository"

export const itemRoutesLive = HttpApiBuilder.group(Api, "items", (handlers) =>
  handlers
    .handle(
      "addItem",
      Effect.fn(function*({ payload }) {
        const items = yield* ItemRepository
        yield* items.add({ ...payload, createdAt: undefined, updatedAt: undefined })
      })
    )
    .handle(
      "updateItemById",
      Effect.fn(function*({ path, payload }) {
        const items = yield* ItemRepository
        yield* items.update({ id: path.itemId, ...payload, updatedAt: undefined })
      })
    )
    .handle(
      "removeItemById",
      Effect.fn(function*({ path }) {
        const items = yield* ItemRepository
        yield* items.delete(path.itemId)
      })
    )
    .handle(
      "getItemById",
      Effect.fn(function*({ path }) {
        const items = yield* ItemRepository
        const item = yield* items.findById(path.itemId)
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
