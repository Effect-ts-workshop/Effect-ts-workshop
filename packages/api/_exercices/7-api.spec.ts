import { HttpApi, HttpApiBuilder, HttpApiEndpoint, HttpApiGroup } from "@effect/platform"
import { Effect, Schema } from "effect"
import { describe, expect, it } from "vitest"

describe("Api Effect - server", () => {
  it("HttpApiClient to call the API in a typed way", async () => {
    // "Le contrat : une route GET /hello qui retourne une string
    // #start
    // const MyApi = TODO
    // #solution
    const MyApi = HttpApi.make("MyApi").add(
      HttpApiGroup.make("greet").add(
        HttpApiEndpoint.get("sayHello", "/hello").addSuccess(Schema.String)
      )
    )
    // #end
    const endpoint = MyApi.groups?.["greet"]?.endpoints?.["sayHello"]
    expect(endpoint?.method).toBe("GET")
    expect(endpoint?.path).toBe("/hello")
    expect(Schema.decodeUnknownSync(endpoint?.successSchema)("test")).toBe("test")

    // 2. L'implémentation
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const MyApiLive = HttpApiBuilder.group(
      MyApi,
      "greet",
      (handlers) => handlers.handle("sayHello", () => Effect.succeed("Hello, World!"))
    )
  })
})
