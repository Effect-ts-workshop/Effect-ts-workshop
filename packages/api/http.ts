import { HttpApiBuilder } from "@effect/platform";
import { Effect } from "effect";
import { Api } from "shared/api";
import { itemRepository } from "./db";

export const itemRoutesLive = HttpApiBuilder.group(Api, "items", (handlers) =>
  handlers
    .handle(
      "addItem",
      Effect.fn(function* ({ payload }) {
        itemRepository.add(payload);
      }),
    )
    .handle(
      "updateItemById",
      Effect.fn(function* ({ path, payload }) {
        itemRepository.update({ id: path.itemId, ...payload });
      }),
    )
    .handle(
      "removeItemById",
      Effect.fn(function* ({ path }) {
        itemRepository.removeById(path.itemId);
      }),
    )
    .handle(
      "getItemById",
      Effect.fn(function* ({ path }) {
        return itemRepository.findById(path.itemId);
      }),
    )
    .handle(
      "getAllItems",
      Effect.fn(function* () {
        const items = yield* itemRepository.getAll();
        return { items };
      }),
    ),
);
