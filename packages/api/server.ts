import { HttpLayerRouter } from "@effect/platform";
import {
  NodeHttpClient,
  NodeHttpServer,
  NodeRuntime,
} from "@effect/platform-node";
import { Layer, pipe } from "effect";
import { createServer } from "node:http";
import { Api } from "shared/api";
import { itemRoutesLive } from "./http";

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
