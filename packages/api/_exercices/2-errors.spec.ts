import { Data, Effect, pipe } from "effect"
import type { Response } from "undici"
import { fetch as baseFetch } from "undici"
import { describe, expect, it } from "vitest"

describe("Effect basics", () => {
  it("should track error explicitly", () => {
    // Given
    class NombreNégatif extends Data.TaggedError("NombreNégatif") {}
    function racineCarrée(n: number): Effect.Effect<number, NombreNégatif> {
      if (n < 0) {
        return Effect.fail(new NombreNégatif())
      }

      return Effect.succeed(Math.sqrt(n))
    }

    // When
    const program = racineCarrée(16)
    const invalidProgram = racineCarrée(-4)

    // Then
    expect(Effect.runSync(program)).toEqual(4)
    expect(() => Effect.runSync(invalidProgram)).toThrow()
  })

  it("should track every possible errors", async () => {
    // Given
    class NetworkError extends Data.TaggedError("NetworkError")<{ error: unknown }> {}

    class HTTPResponseError extends Data.TaggedError("HTTPResponseError")<{ response: Response }> {}

    type Fetch = (
      ...args: Parameters<typeof baseFetch>
    ) => Effect.Effect<Response, NetworkError | HTTPResponseError>
    const fetch: Fetch = (input, init) =>
      pipe(
        Effect.tryPromise({
          try: (signal) =>
            baseFetch(input, {
              signal,
              ...init
            }),
          catch: (error) => new NetworkError({ error })
        }),
        Effect.filterOrFail(
          (response) => response.ok,
          (response) => new HTTPResponseError({ response })
        )
      )

    // When
    const program = fetch("https://api.chucknorris.io/jokes/random")
    const invalidProgram = fetch("https://fail")

    // Then
    await expect(Effect.runPromise(program)).resolves.toMatchObject({ status: 200 })
    await expect(Effect.runPromise(invalidProgram)).rejects.toThrow()
  })

  it("should always get a joke", async () => {
    // Given
    class NetworkError extends Data.TaggedError("NetworkError")<{ error: unknown }> {}

    class HTTPResponseError extends Data.TaggedError("HTTPResponseError")<{ response: Response }> {}

    type Fetch = (
      ...args: Parameters<typeof baseFetch>
    ) => Effect.Effect<Response, NetworkError | HTTPResponseError>
    const fetch: Fetch = (input, init) =>
      pipe(
        Effect.tryPromise({
          try: (signal) =>
            baseFetch(input, {
              signal,
              ...init
            }),
          catch: (error) => new NetworkError({ error })
        }),
        Effect.filterOrFail(
          (response) => response.ok,
          (response) => new HTTPResponseError({ response })
        )
      )
    const getJoke = () =>
      pipe(
        fetch("https://api.chucknorris.io/jokes/random"),
        Effect.flatMap((a) => Effect.tryPromise(() => a.json())),
        Effect.map((a) => String((a as any).value))
      )

    // When
    const program = pipe(
      getJoke(),
      Effect.catchTag(
        "HTTPResponseError",
        () =>
          Effect.succeed(
            "Chuck Norris never gets a 500 Internal Server Error. The server fixes itself before responding."
          )
      )
    )

    // Then
    await expect(Effect.runPromise(program)).resolves.toMatchObject({ status: 200 })
  })
})
