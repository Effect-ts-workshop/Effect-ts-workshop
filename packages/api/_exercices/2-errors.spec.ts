import { Data, Effect, pipe } from "effect"
import type { Response } from "undici"
import { fetch as baseFetch } from "undici"
import { describe, expect, expectTypeOf, it } from "vitest"

describe("Effect basics - Errors", () => {
  it("Should return failure explicitely", () => {
    function squareRoot(n: number): Effect.Effect<number, Error> {
      if (n < 0) {
        return Effect.fail(new Error("toto"))
      }

      return Effect.succeed(Math.sqrt(n))
    }

    const program = squareRoot(16)
    const invalidProgram = squareRoot(-4)

    expect(Effect.runSync(program)).toEqual(4)
    expect(() => Effect.runSync(invalidProgram)).toThrow()
  })

  it("Should create tagged errors", async () => {
    class NetworkError extends Data.TaggedError("NetworkError")<{ error: unknown }> {}
    const netError = new NetworkError({ error: "unknown" })
    expect(netError._tag).toBe("NetworkError")

    class HTTPResponseError extends Data.TaggedError("HTTPResponseError")<{ response: Response }> {}
    const httpError = new HTTPResponseError({ response: "fake" as any })
    expect(httpError).toMatchObject({ "_tag": "HTTPResponseError" })
  })

  it("Should return multiple errors", async () => {
    class NetworkError extends Data.TaggedError("NetworkError")<{ error: unknown }> {}
    class HTTPResponseError extends Data.TaggedError("HTTPResponseError")<{ response: Response }> {}

    type FetchParameters = Parameters<typeof baseFetch>
    const fetch = (...args: FetchParameters) =>
      pipe(
        Effect.tryPromise({
          try: () => baseFetch(...args),
          catch: (error) => {
            return new NetworkError({ error })
          }
        }),
        Effect.filterOrFail(
          (response) => response.ok,
          (response) => {
            return new HTTPResponseError({ response })
          }
        )
      )

    const program = fetch("https://api.chucknorris.io/jokes/random")

    expectTypeOf<ReturnType<typeof fetch>>().toEqualTypeOf<Effect.Effect<Response, NetworkError | HTTPResponseError>>()
    await expect(Effect.runPromise(program)).resolves.toMatchObject({ status: 200 })
  })

  it("Should catch single error", async () => {
    type HTTPResponseError = { readonly _tag: "HTTPResponseError" }
    type NetworkError = { readonly _tag: "NetworkError" }
    const getJoke = (): Effect.Effect<string, HTTPResponseError | NetworkError, never> =>
      Effect.fail({ _tag: "HTTPResponseError" })

    const program = pipe(
      getJoke(),
      Effect.catchTag("HTTPResponseError", () => Effect.succeed("Fallback joke"))
    )

    expectTypeOf(program).toExtend<Effect.Effect<string, NetworkError, never>>()
    expect(Effect.runSync(program)).toEqual("Fallback joke")
  })

  it.each(
    [["NetworkError", "Fallback joke from NetworkError"], [
      "HTTPResponseError",
      "Fallback joke from HTTPResponseError"
    ]] as const
  )(
    "Should catch multiple errors",
    async (tag, expected) => {
      type UnknownException = { readonly _tag: "UnknownException" }
      type HTTPResponseError = { readonly _tag: "HTTPResponseError" }
      type NetworkError = { readonly _tag: "NetworkError" }
      const getJoke = (): Effect.Effect<string, UnknownException | HTTPResponseError | NetworkError, never> =>
        Effect.fail({ _tag: tag })

      const program = pipe(
        getJoke(),
        Effect.catchTags({
          HTTPResponseError: () => Effect.succeed("Fallback joke from HTTPResponseError"),
          NetworkError: () => Effect.succeed("Fallback joke from NetworkError")
        })
      )

      expectTypeOf(program).toEqualTypeOf<Effect.Effect<string, UnknownException, never>>()
      expect(Effect.runSync(program)).toEqual(expected)
    }
  )

  it("Should all errors and always get a joke", async () => {
    type UnknownException = { readonly _tag: "UnknownException" }
    type HTTPResponseError = { readonly _tag: "HTTPResponseError" }
    type NetworkError = { readonly _tag: "NetworkError" }
    const getJoke = (): Effect.Effect<string, UnknownException | HTTPResponseError | NetworkError, never> =>
      Effect.fail({ _tag: "NetworkError" })

    const program = pipe(
      getJoke(),
      Effect.catchAll(() => Effect.succeed("Fallback joke"))
    )

    expectTypeOf(program).toExtend<Effect.Effect<string, never, never>>()
    expect(Effect.runSync(program)).toEqual("Fallback joke")
  })
})

describe("Effect defect", () => {
  it("Should handle unexpected error (defect)", async () => {
    const trustMe = () => Effect.dieMessage("You are too naive")

    const program = pipe(
      trustMe(),
      Effect.catchAllDefect(() => Effect.succeed("I'm alive"))
    )

    await expect(Effect.runPromise(program)).resolves.toEqual("I'm alive")
  })
})
