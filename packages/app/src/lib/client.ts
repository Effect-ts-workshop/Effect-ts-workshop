import { Atom, AtomHttpApi, AtomRpc } from "@effect-atom/atom-react"
import { WebSdk } from "@effect/opentelemetry"
import { FetchHttpClient } from "@effect/platform"
import { BrowserSocket } from "@effect/platform-browser"
import { RpcClient, RpcSerialization } from "@effect/rpc"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http"
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base"
import { Layer } from "effect"
import { Api } from "shared/api"
import { ItemRpcs } from "shared/rpc"

const TracingLive = WebSdk.layer(() => ({
  resource: { serviceName: "app" },
  spanProcessor: new BatchSpanProcessor(new OTLPTraceExporter({ url: "http://localhost:5173/v1/traces" }))
}))

Atom.runtime.addGlobalLayer(
  TracingLive
)

export class ApiClient extends AtomHttpApi.Tag<ApiClient>()("ApiClient", {
  api: Api,
  // Provide a Layer that provides the HttpClient
  httpClient: FetchHttpClient.layer,
  baseUrl: "http://localhost:5173/api"
}) {}

export class ApiRpcClient extends AtomRpc.Tag<ApiRpcClient>()("ApiRpcClient", {
  group: ItemRpcs,
  // Provide a `Layer` that provides the RpcClient.Protocol
  protocol: RpcClient.layerProtocolSocket({
    retryTransientErrors: true
  }).pipe(
    Layer.provide(BrowserSocket.layerWebSocket("ws://localhost:3000/rpc")),
    Layer.provide(RpcSerialization.layerJson)
  )
}) {}
