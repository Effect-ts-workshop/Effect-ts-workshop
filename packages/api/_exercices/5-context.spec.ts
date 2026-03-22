import { HttpClient } from "@effect/platform"
import { NodeHttpClient } from "@effect/platform-node"
import { Context, Effect, Layer, pipe } from "effect"
import { describe, expect, expectTypeOf, it } from "vitest"

describe("Effect context", () => {
  it("Using a service", async () => {
    // Given
    type Joke = { value: string; url: string }
    const fetchJoke = () =>
      pipe(
        HttpClient.HttpClient,
        Effect.flatMap((client) => client.get("https://api.chucknorris.io/jokes/random")),
        Effect.flatMap((response) => response.json),
        Effect.map((joke) => joke as Joke),
        Effect.orElseSucceed((): Joke => ({ url: "http://fake.fr", value: "No jokes today" }))
      )

    // When
    const program = pipe(fetchJoke(), Effect.provide(NodeHttpClient.layerUndici))

    // Then
    expectTypeOf(fetchJoke).toEqualTypeOf<
      () => Effect.Effect<Joke, never, HttpClient.HttpClient>
    >()
    await expect(Effect.runPromise(program)).resolves.toMatchObject({
      url: expect.stringContaining("https://api.chucknorris.io")
    })
  })

  it("Creating your own service", async () => {
    // Given
    const fetchJoke = () =>
      pipe(
        HttpClient.HttpClient,
        Effect.flatMap((client) => client.get("https://api.chucknorris.io/jokes/random")),
        Effect.flatMap((response) => response.json),
        Effect.map((joke) => (joke as { value: string }).value),
        Effect.orElseSucceed(() => "No jokes for today")
      )

    // When
    type JokeService = {
      getRandom: () => Effect.Effect<string>
    }
    const JokeService = Context.GenericTag<JokeService>("JokeService")
    const JokeServiceTest = Layer.succeed(
      JokeService,
      {
        getRandom: () => Effect.succeed("Not really random for tests")
      }
    )

    const JokeServiceLive = Layer.succeed(
      JokeService,
      {
        getRandom: () => pipe(fetchJoke(), Effect.provide(NodeHttpClient.layer))
      }
    )

    // Then
    const program = pipe(JokeService, Effect.flatMap((jokes) => jokes.getRandom()))
    await expect(Effect.runPromise(pipe(program, Effect.provide(JokeServiceTest)))).resolves.toEqual(
      "Not really random for tests"
    )
    await expect(Effect.runPromise(pipe(program, Effect.provide(JokeServiceLive)))).resolves.toEqual(
      expect.any(String)
    )
  })
})
