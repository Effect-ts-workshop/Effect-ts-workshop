import { AtomHttpApi } from "@effect-atom/atom-react";
import { FetchHttpClient } from "@effect/platform";
import { Api } from "shared/api";

export class ApiClient extends AtomHttpApi.Tag<ApiClient>()("ApiClient", {
  api: Api,
  // Provide a Layer that provides the HttpClient
  httpClient: FetchHttpClient.layer,
  baseUrl: "http://localhost:5173/api",
}) {}
