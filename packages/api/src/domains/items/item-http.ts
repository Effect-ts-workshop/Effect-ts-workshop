import { HttpApiBuilder } from "@effect/platform"
import { Effect, Option, pipe } from "effect"
import { Api } from "shared/api"
import { ItemRepository } from "./db/item-repository"
import { ItemRepositoryDrizzle } from "./db/item-repository-drizzle"

export const itemRoutesLive = HttpApiBuilder.group(Api, "items", (handlers) =>
  handlers
    .handle(
      "addItem",
      Effect.fn(function*({ payload }) {
        const items = yield* ItemRepositoryDrizzle
        yield* items.add(payload)
      }, Effect.catchTag("EffectDrizzleQueryError", () => Effect.succeed({} as any)))
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
      Effect.fn(
        function*({ path }) {
          const items = yield* ItemRepositoryDrizzle
          const item = yield* items.findById(path.itemId)
          return item
        },
        Effect.tap(Effect.logInfo("coucou")),
        Effect.catchTag("EffectDrizzleQueryError", () => Effect.succeed(Option.none()))
      )
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
