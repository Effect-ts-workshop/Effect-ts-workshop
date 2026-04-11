import {
  HttpApi,
  HttpApiBuilder,
  HttpApiClient,
  HttpApiEndpoint,
  HttpApiGroup,
  HttpLayerRouter
} from "@effect/platform"
import { Effect, Layer, pipe, Schema } from "effect"
import { describe, expect, it } from "vitest"

const TODO: any = {}

describe("Api  Effect - serveur", () => {
  it.skip("HttpApiClient pour appeler l'API de façon typée", async () => {
    // "Le contrat : une route GET /hello qui retourne une string
    // #start
    const MyApi = TODO
    // #solution
    // const MyApi = HttpApi.make("MyApi").add(
    //   HttpApiGroup.make("greet").add(
    //     HttpApiEndpoint.get("sayHello", "/hello").addSuccess(Schema.String)
    //   )
    // )
    // #end
    expect(MyApi.identifier).toBe("MyApi")
    const endpoint = MyApi.groups?.["greet"]?.endpoints?.["sayHello"]
    expect(endpoint?.method).toBe("GET")
    expect(endpoint?.path).toBe("/hello")
    expect(Schema.decodeUnknownSync(endpoint?.successSchema)("test")).toBe("test")

    // 2. L'implémentation
    const MyApiLive = HttpApiBuilder.group(
      MyApi,
      "greet",
      (handlers) => handlers.handle("sayHello", () => Effect.succeed("Hello, World!"))
    )

    // 3. Le layer de routes (= "brancher" l'implémentation sur le contrat)
    const apiLayer = pipe(
      HttpLayerRouter.addHttpApi(MyApi),
      Layer.provide(MyApiLive)
    ) as Layer.Layer<never>

    const { dispose, handler } = HttpLayerRouter.toWebHandler(apiLayer, { disableLogger: true })

    // #start
    const TestHttpClient = TODO
    // #solution
    // const TestHttpClient = pipe(
    //   FetchHttpClient.layer,
    //   Layer.provide(Layer.succeed(FetchHttpClient.Fetch, (input, init) => handler(new Request(input as string, init))))
    // )
    // #end

    const program = pipe(
      HttpApiClient.make(MyApi, { baseUrl: "http://localhost" }),
      Effect.flatMap((client) => client.greet.sayHello()),
      Effect.provide(TestHttpClient)
    )

    const result = await Effect.runPromise(program)

    expect(result).toBe("Hello, World!")

    await dispose()
  })
})
