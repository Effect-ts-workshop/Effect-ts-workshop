import {
  FetchHttpClient,
  HttpApi,
  HttpApiBuilder,
  HttpApiClient,
  HttpApiEndpoint,
  HttpApiGroup,
  HttpLayerRouter
} from "@effect/platform"
import { Effect, Layer, pipe, Schema } from "effect"
import { describe, expect, it } from "vitest"

// Une API Effect se construit en 3 étapes :
//   1. Déclarer les endpoints (le "contrat")
//   2. Implémenter les handlers
//   3. Brancher le tout sur un routeur et appeler

// 1. Le contrat : une route GET /hello qui retourne une string
const MyApi = HttpApi.make("MyApi").add(
  HttpApiGroup.make("greet").add(
    HttpApiEndpoint.get("sayHello", "/hello").addSuccess(Schema.String)
  )
)

// 2. L'implémentation
const MyApiLive = HttpApiBuilder.group(
  MyApi,
  "greet",
  (handlers) => handlers.handle("sayHello", () => Effect.succeed("Hello, World!"))
)

// 3. Le layer de routes (= "brancher" l'implémentation sur le contrat)
// Note : les DefaultServices (HttpPlatform, FileSystem, Path, Etag) sont requis
// au niveau des types mais fournis automatiquement par le runtime Node.js.
const apiLayer = pipe(
  HttpLayerRouter.addHttpApi(MyApi),
  Layer.provide(MyApiLive)
) as Layer.Layer<never>

describe("Api – bases", () => {
  it("répond à GET /hello avec un handler Effect", async () => {
    // Given
    // toWebHandler transforme le layer en un handler fetch standard (Request => Response)
    // Pas besoin de démarrer un vrai serveur HTTP !
    const { dispose, handler } = HttpLayerRouter.toWebHandler(apiLayer, { disableLogger: true })

    // When
    const response = await handler(new Request("http://localhost/hello"))
    const body = await response.json()

    // Then
    expect(response.status).toBe(200)
    expect(body).toBe("Hello, World!")

    await dispose()
  })

  it("utilise HttpApiClient pour appeler l'API de façon typée", async () => {
    // Given
    // HttpApiClient.make génère un client typé à partir du contrat.
    // On lui fournit un FetchHttpClient qui redirige vers notre handler en mémoire.
    const { dispose, handler } = HttpLayerRouter.toWebHandler(apiLayer, { disableLogger: true })

    const TestHttpClient = FetchHttpClient.layer.pipe(
      Layer.provide(Layer.succeed(FetchHttpClient.Fetch, (input, init) => handler(new Request(input as string, init))))
    )

    // When
    const program = pipe(
      HttpApiClient.make(MyApi, { baseUrl: "http://localhost" }),
      Effect.flatMap((client) => client.greet.sayHello()),
      Effect.provide(TestHttpClient)
    )

    const result = await Effect.runPromise(program)

    // Then
    expect(result).toBe("Hello, World!")

    await dispose()
  })
})
