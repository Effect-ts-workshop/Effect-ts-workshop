import { HttpClient } from "@effect/platform"
import { NodeHttpClient } from "@effect/platform-node"
import { Context, Effect, Layer, pipe } from "effect"
import { describe, expect, expectTypeOf, it } from "vitest"

describe("Effect context", () => {
  it("Using a service", async () => {
    type Joke = { value: string; url: string }
    const fetchJoke = () =>
      pipe(
        HttpClient.HttpClient,
        Effect.flatMap((client) => client.get("https://api.chucknorris.io/jokes/random")),
        Effect.flatMap((response) => response.json),
        Effect.map((joke) => joke as Joke),
        Effect.orElseSucceed((): Joke => ({ url: "http://fake.fr", value: "No jokes today" }))
      )

    const program = pipe(fetchJoke(), Effect.provide(NodeHttpClient.layer))

    expectTypeOf(fetchJoke).toEqualTypeOf<
      () => Effect.Effect<Joke, never, HttpClient.HttpClient>
    >()
    await expect(Effect.runPromise(program)).resolves.toMatchObject({
      url: expect.stringContaining("https://api.chucknorris.io")
    })
  })

  it("Creating your own service with live and test implementation", async () => {
    type JokeService = {
      getRandom: () => Effect.Effect<string>
    }
    const JokeService = Context.GenericTag<JokeService>("JokeService")

    const JokeServiceTest = Layer.succeed(
      JokeService,
      {
        getRandom: () => {
          return Effect.succeed("Not really random for tests")
        }
      }
    )

    const JokeServiceLive = Layer.succeed(
      JokeService,
      {
        getRandom: () => {
          return Effect.succeed("Amazing joke from server")
        }
      }
    )

    const program = pipe(JokeService, Effect.flatMap((jokes) => jokes.getRandom()))
    await expect(Effect.runPromise(pipe(program, Effect.provide(JokeServiceTest)))).resolves.toEqual(
      "Not really random for tests"
    )
    await expect(Effect.runPromise(pipe(program, Effect.provide(JokeServiceLive)))).resolves.toEqual(
      "Amazing joke from server"
    )
  })

  it("[OPTIONAL] Simplifying service definitions with Effect.Service", async () => {
    class JokeService extends Effect.Service<JokeService>()("JokeService", {
      effect: pipe(
        HttpClient.HttpClient,
        Effect.map((client) => {
          return {
            getRandom: () =>
              pipe(
                client.get("https://api.chucknorris.io/jokes/random"),
                Effect.flatMap((response) => response.json),
                Effect.map((joke) => (joke as { value: string }).value),
                Effect.orElseSucceed(() => "No jokes for today")
              )
          }
        })
      ),
      dependencies: [NodeHttpClient.layer]
    }) {}

    const program = pipe(JokeService, Effect.flatMap((jokes) => jokes.getRandom()))
    await expect(Effect.runPromise(pipe(program, Effect.provide(JokeService.Default)))).resolves.toEqual(
      expect.any(String)
    )
  })

  it("[OPTIONAL] Easily testing services", async () => {
    class JokeService extends Effect.Service<JokeService>()("JokeService", {
      effect: pipe(
        HttpClient.HttpClient,
        Effect.map((client) => {
          return {
            getRandom: () =>
              pipe(
                client.get("https://api.chucknorris.io/jokes/random"),
                Effect.flatMap((response) => response.json),
                Effect.map((joke) => (joke as { value: string }).value),
                Effect.orElseSucceed(() => "No jokes for today")
              )
          }
        })
      ),
      dependencies: [NodeHttpClient.layer]
    }) {}

    const httpClientMock = {
      get: () => Effect.fail(undefined)
    } as any

    const HttpClientTestLayer = Layer.mock(
      HttpClient.HttpClient,
      httpClientMock
    )
    const JokeServiceTest = pipe(JokeService.DefaultWithoutDependencies, Layer.provide(HttpClientTestLayer))

    const program = pipe(JokeService, Effect.flatMap((jokes) => jokes.getRandom()))
    await expect(Effect.runPromise(pipe(program, Effect.provide(JokeServiceTest)))).resolves
      .toEqual("No jokes for today")
  })
})
