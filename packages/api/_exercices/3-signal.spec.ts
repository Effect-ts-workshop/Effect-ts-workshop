import { Effect, pipe } from "effect"
import { fetch as baseFetch } from "undici"
import { describe, it } from "vitest"

describe("", () => {
  it("", () => {
    // Given
    class NetworkError extends Error {}
    class HTTPResponseError extends Error {}

    type Fetch = (
      ...args: Parameters<typeof baseFetch>
    ) => Effect.Effect<Response, NetworkError | HTTPResponseError>
    const _fetch: Fetch = (input, init) =>
      pipe(
        Effect.tryPromise({
          try: (signal) =>
            baseFetch(input, {
              signal,
              ...init
            }),
          catch: (error) => new NetworkError(String(error))
        }),
        Effect.filterOrFail(
          (response) => response.ok,
          (response) => new HTTPResponseError(response.statusText)
        )
      )
    // When TODO
    // Then
  })
})
