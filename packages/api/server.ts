import { NodeSdk } from "@effect/opentelemetry"
import { HttpLayerRouter } from "@effect/platform"
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node"
import { RpcSerialization, RpcServer } from "@effect/rpc"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http"
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base"
import { Layer, pipe } from "effect"
import { createServer } from "node:http"
import { Api } from "shared/api"
import { ItemRpcs } from "shared/rpc"
import { dbLayer } from "./database"
import { UserServiceLive } from "./db/item-repository"
import { itemRoutesLive } from "./http"
import { itemHandlers } from "./rpc"

const apiRoutes = pipe(
  HttpLayerRouter.addHttpApi(Api),
  Layer.provide(itemRoutesLive),
  Layer.provide(UserServiceLive),
  Layer.provide(dbLayer)
)

const rpcRoutes = pipe(
  RpcServer.layerHttpRouter({
    group: ItemRpcs,
    path: "/rpc"
  }),
  Layer.provide(itemHandlers),
  Layer.provide(RpcSerialization.layerJson)
)

const allRoutes = Layer.mergeAll(apiRoutes, rpcRoutes)
// const allRoutes = Layer.mergeAll(apiRoutes, rpcRoutes)

const TracingLive = NodeSdk.layer(() => ({
  resource: { serviceName: "api" },
  spanProcessor: new BatchSpanProcessor(new OTLPTraceExporter({ url: "http://localhost:4318/v1/traces" }))
}))

pipe(
  HttpLayerRouter.serve(allRoutes),
  Layer.provide(NodeHttpServer.layer(createServer, { port: 3000 })),
  Layer.provide(TracingLive),
  Layer.launch,
  NodeRuntime.runMain
)
