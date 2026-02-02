import { HttpApiBuilder, HttpLayerRouter } from "@effect/platform";
import {
  NodeHttpClient,
  NodeHttpServer,
  NodeRuntime,
} from "@effect/platform-node";
import { Array, Effect, Layer, pipe } from "effect";
import { Api } from "shared/api";
import { createServer } from "node:http";
import { InventoryItemSchema } from "shared/item";

let items: (typeof InventoryItemSchema.Type)[] = [];

export const itemRoutesLive = HttpApiBuilder.group(Api, "items", (handlers) =>
  handlers
    .handle(
      "addItem",
      Effect.fn(function* ({ payload }) {
        items = [...items, payload];
      }),
    )
    .handle(
      "updateItemById",
      Effect.fn(function* ({ path, payload }) {
        items = items.map((item) =>
          item.id === path.itemId ? { ...item, ...payload } : item,
        );
      }),
    )
    .handle(
      "removeItemById",
      Effect.fn(function* ({ path }) {
        items = items.filter((item) => item.id !== path.itemId);
      }),
    )
    .handle(
      "getItemById",
      Effect.fn(function* ({ path }) {
        return Array.findFirst(items, (item) => item.id === path.itemId);
      }),
    )
    .handle(
      "getAllItems",
      Effect.fn(function* () {
        return { items };
      }),
    ),
);

const apiRoutes = pipe(
  HttpLayerRouter.addHttpApi(Api),
  Layer.provide(itemRoutesLive),
);

const serverLive = pipe(
  HttpLayerRouter.serve(apiRoutes),
  Layer.provide(
    NodeHttpServer.layer(createServer, {
      port: 3000,
    }),
  ),
  //   Layer.provide(TracingLive),
  Layer.provide(NodeHttpClient.layer),
);

// const runtime = Runtime.disableRuntimeFlag(
//   Runtime.defaultRuntime,
//   RuntimeFlags.RuntimeMetrics
// )
pipe(Layer.launch(serverLive), NodeRuntime.runMain);
