import { HttpClient } from "@effect/platform"
import { NodeHttpClient } from "@effect/platform-node"
import { Effect, pipe } from "effect"
import { describe, expect, it } from "vitest"

describe("Effect context", () => {
  it("Using a generator instead of pipe", async () => {
    // Given
    const fetchJoke = (id: string) =>
      pipe(
        HttpClient.HttpClient,
        Effect.flatMap((client) =>
          pipe(
            client.get(`https://api.chucknorris.io/jokes/${id}`),
            Effect.flatMap((response) =>
              pipe(
                response.json,
                Effect.map((data) => ({ response, data }))
              )
            )
          )
        )
      )

    /* Advanced pipe syntax with do notation
    const fetchJoke = (id: string) => pipe(
      Effect.Do,
      Effect.bind("client", () => HttpClient.HttpClient),
      Effect.bind("response", ({ client }) =>
        client.get(`https://api.chucknorris.io/jokes/${id}`)
      ),
      Effect.bind("data", ({ response }) => response.json),
      Effect.map(({ response, data }) => ({ response, data }))
    )
    */

    // When
    const fetchJokeGen = Effect.fn("fetchJokeGen")(function*(id: string) {
      const client = yield* HttpClient.HttpClient
      const response = yield* client.get(`https://api.chucknorris.io/jokes/${id}`)
      const data = yield* response.json
      return { response, data }
    })

    // Then
    const jokeId = "XRg6ljeHSlaXghH1IYulJw"
    const program = pipe(fetchJoke(jokeId), Effect.provide(NodeHttpClient.layerUndici))
    const programGen = pipe(fetchJokeGen(jokeId), Effect.provide(NodeHttpClient.layerUndici))
    expect((await Effect.runPromise(program)).data).toEqual((await Effect.runPromise(programGen)).data)
  })

  it.todo("Imperative control flow", () => {})
  it.todo("dual API", () => {})
  it.todo("yield error/either/option", () => {})
})
