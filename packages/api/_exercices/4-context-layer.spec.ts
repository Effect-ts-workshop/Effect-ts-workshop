import { HttpClient } from "@effect/platform"
import { NodeHttpClient } from "@effect/platform-node"
import { Context, Effect, Layer, pipe } from "effect"
import { TODO } from "shared/utils"
import { describe, expect, expectTypeOf, it } from "vitest"

describe("Effect context", () => {
  it.skip("Using a service", async () => {
    type Joke = { value: string; url: string }
    const fetchJoke = () =>
      pipe(
        TODO
      )

    const program = pipe(fetchJoke(), Effect.provide(NodeHttpClient.layer))

    expectTypeOf(fetchJoke).toEqualTypeOf<
      () => Effect.Effect<Joke, never, HttpClient.HttpClient>
    >()
    await expect(Effect.runPromise(program)).resolves.toMatchObject({
      url: expect.stringContaining("https://api.chucknorris.io")
    })
  })

  it.skip("Creating your own service with live and test implementation", async () => {
    type JokeService = {
      getRandom: () => Effect.Effect<string>
    }
    const JokeService = TODO

    const JokeServiceTest = Layer.succeed(
      JokeService,
      TODO
    )

    const JokeServiceLive = Layer.succeed(
      JokeService,
      TODO
    )

    const program = pipe(JokeService, Effect.flatMap((jokes) => jokes.getRandom()))
    await expect(Effect.runPromise(pipe(program, Effect.provide(JokeServiceTest)))).resolves.toEqual(
      "Not really random for tests"
    )
    await expect(Effect.runPromise(pipe(program, Effect.provide(JokeServiceLive)))).resolves.toEqual(
      "Amazing joke from server"
    )
  })

  it.skip("[OPTIONAL] Simplifying service definitions with Effect.Service", async () => {
    class JokeService extends TODO {}

    const program = pipe(JokeService, Effect.flatMap((jokes) => jokes.getRandom()))
    await expect(Effect.runPromise(pipe(program, Effect.provide(JokeService.Default)))).resolves.toEqual(
      expect.any(String)
    )
  })

  it.skip("[OPTIONAL] Easily testing services", async () => {
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

    const JokeServiceTest = TODO

    const program = pipe(JokeService, Effect.flatMap((jokes) => jokes.getRandom()))
    await expect(Effect.runPromise(pipe(program, Effect.provide(JokeServiceTest)))).resolves
      .toEqual("No jokes for today")
  })
})
