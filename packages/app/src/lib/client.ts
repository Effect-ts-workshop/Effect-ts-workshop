import { Atom, AtomHttpApi } from "@effect-atom/atom-react"
import { WebSdk } from "@effect/opentelemetry"
import { FetchHttpClient } from "@effect/platform"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http"
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base"
import { Api } from "shared/api"

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
