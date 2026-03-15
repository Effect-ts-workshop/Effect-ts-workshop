import { Effect, pipe } from "effect"
import { UnknownException } from "effect/Cause"
import type { Response } from "undici"
import { fetch as baseFetch } from "undici"
import { describe, expect, expectTypeOf, it } from "vitest"
import { getJoke, HTTPResponseError, NetworkError } from "../sandbox"

describe("Effect basics - Errors", () => {
  it("should track error explicitly", () => {
    // Given
    function racineCarrée(n: number): Effect.Effect<number, Error> {
      if (n < 0) {
        return Effect.fail(new Error("toto"))
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
    class NetworkError extends Error {}
    class HTTPResponseError extends Error {}

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
          catch: (error) => new NetworkError(String(error))
        }),
        Effect.filterOrFail(
          (response) => response.ok,
          (response) => new HTTPResponseError(response.statusText)
        )
      )

    // When
    const program = fetch("https://api.chucknorris.io/jokes/random")
    const invalidProgram = fetch("https://fail")

    // Then
    await expect(Effect.runPromise(program)).resolves.toMatchObject({ status: 200 })
    await expect(Effect.runPromise(invalidProgram)).rejects.toThrow()
  })

  it("should create tagged errors", async () => {
    const netError = new NetworkError({ error: "unknown" })
    expect(netError._tag).toBe("NetworkError")

    const httpError = new HTTPResponseError({ response: "fake" as any })
    expect(httpError).toMatchObject({ "_tag": "HTTPResponseError" })
  })

  it("should catch single error", async () => {
    // Given

    // When
    const program = pipe(
      getJoke(),
      // catch here
      Effect.catchTag("HTTPResponseError", () => Effect.succeed("COUCOU"))
    )

    expectTypeOf(program).toExtend<Effect.Effect<string, UnknownException | NetworkError, never>>()
  })

  it("should some errors", async () => {
    // Given

    // When
    const program = pipe(
      getJoke(),
      // catch here
      Effect.catchTags({
        HTTPResponseError: () => Effect.succeed("COUCOU"),
        NetworkError: () => Effect.succeed("COUCOU")
      })
    )

    expectTypeOf(program).toExtend<Effect.Effect<string, UnknownException, never>>()
  })

  it("should always get a joke", async () => {
    // Given

    // When
    const program = pipe(
      getJoke(),
      // catch here
      Effect.catchAll(() => Effect.succeed("COUCOU"))
    )

    expectTypeOf(program).toExtend<Effect.Effect<string, never, never>>()
  })

  it("CatchTags: ideal for precise errors VS CatchAll secure nest for the rest", async () => {
    // catchTags to handle precisely errors
    const catchTagsResult = pipe(
      Effect.fail(new UnknownException("panic")),
      Effect.catchTags({
        // Your errors
      })
    )

    // catchAll = catch everything
    const catchAllResult = pipe(
      Effect.fail(new UnknownException("panic")),
      Effect.catchAll(() => Effect.succeed("ok"))
    )

    expectTypeOf(catchTagsResult).toEqualTypeOf<Effect.Effect<never, UnknownException, never>>()
    expectTypeOf(catchAllResult).toEqualTypeOf<Effect.Effect<string, never, never>>()

    await expect(Effect.runPromise(catchTagsResult)).rejects.toThrow()
    await expect(Effect.runPromise(catchAllResult)).resolves.toBe("ok")
  })
})

describe("Effect defect", () => {
  it("should handle unexpected error (defect)", async () => {
    // Given
    const trustMe = () => Effect.dieMessage("You are too naive")

    // When
    const program = pipe(
      trustMe(),
      // catch here
      Effect.catchAllDefect(() => Effect.succeed("I'm alive"))
    )

    await expect(Effect.runPromise(program)).resolves.toEqual("I'm alive")
  })
})
