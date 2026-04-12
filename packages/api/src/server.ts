import { NodeSdk } from "@effect/opentelemetry"
import { HttpApiScalar, HttpLayerRouter } from "@effect/platform"
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http"
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base"
import { Layer, pipe } from "effect"
import { createServer } from "node:http"
import { Api } from "shared/api"
import { ItemRepository } from "./db/item-repository"
import { ItemRepositoryDrizzle } from "./db/item-repository-drizzle"
import { itemRoutesLive } from "./http"
import { MigratorLive } from "./migrator"

const apiRoutes = pipe(
  HttpLayerRouter.addHttpApi(Api),
  Layer.provide(itemRoutesLive),
  Layer.provide(ItemRepository.Default),
  Layer.provide(ItemRepositoryDrizzle.Default)
)

// Create a /docs route for the API documentation
const docsRoute = HttpApiScalar.layerHttpLayerRouter({
  api: Api,
  path: "/docs"
})

const allRoutes = Layer.mergeAll(apiRoutes, docsRoute)

const TracingLive = NodeSdk.layer(() => ({
  resource: { serviceName: "api" },
  spanProcessor: new BatchSpanProcessor(new OTLPTraceExporter({ url: "http://localhost:4318/v1/traces" }))
}))

pipe(
  HttpLayerRouter.serve(allRoutes),
  Layer.provide(NodeHttpServer.layer(createServer, { port: 3000 })),
  Layer.provide(MigratorLive),
  Layer.provide(TracingLive),
  Layer.launch,
  NodeRuntime.runMain
)
