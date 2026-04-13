import { Data, Effect, pipe } from "effect"
import type { Response } from "undici"
import { fetch as baseFetch } from "undici"
import { TODO } from "shared/utils"
import { describe, expect, expectTypeOf, it } from "vitest"

describe("Effect basics - Errors", () => {
  it.skip("should return failure explicitely", () => {
    function racineCarrée(n: number): Effect.Effect<number, Error> {
      if (n < 0) {
        // #start
        return TODO(new Error("toto"))
        // #solution
        // return Effect.fail(new Error("toto"))
        // #end
      }

      return Effect.succeed(Math.sqrt(n))
    }

    const program = racineCarrée(16)
    const invalidProgram = racineCarrée(-4)

    expect(Effect.runSync(program)).toEqual(4)
    expect(() => Effect.runSync(invalidProgram)).toThrow()
  })

  it.skip("should return multiple errors", async () => {
    class NetworkError extends Error {}
    class HTTPResponseError extends Error {}

    type Fetch = (
      ...args: Parameters<typeof baseFetch>
    ) => Effect.Effect<Response, NetworkError | HTTPResponseError>
    const fetch: Fetch = (input, init) =>
      pipe(
        Effect.tryPromise({
          try: () => baseFetch(input, init),
          catch: (error) => {
            // #start
            return TODO
            // #solution
            // return new NetworkError(String(error))
            // #end
          }
        }),
        Effect.filterOrFail(
          (response) => response.ok,
          (response) => {
            // #start
            return TODO
            // #solution
            // return new HTTPResponseError(response.statusText)
            // #end
          }
        )
      )

    const program = fetch("https://api.chucknorris.io/jokes/random")
    const invalidProgram = fetch("https://fail")

    await expect(Effect.runPromise(program)).resolves.toMatchObject({ status: 200 })
    await expect(Effect.runPromise(invalidProgram)).rejects.toThrow()
  })

  it.skip("should create tagged errors", async () => {
    // #start
    const NetworkError = TODO
    // #solution
    // class NetworkError extends Data.TaggedError("NetworkError")<{ error: unknown }> {}
    // #end
    const netError = new NetworkError({ error: "unknown" })
    expect(netError._tag).toBe("NetworkError")

    // #start
    const HTTPResponseError = TODO
    // #solution
    // class HTTPResponseError extends Data.TaggedError("HTTPResponseError")<{ response: Response }> {}
    // #end
    const httpError = new HTTPResponseError({ response: "fake" as any })
    expect(httpError).toMatchObject({ "_tag": "HTTPResponseError" })
  })

  it.skip("should catch single error", async () => {
    type HTTPResponseError = { readonly _tag: "HTTPResponseError" }
    type NetworkError = { readonly _tag: "NetworkError" }
    const getJoke = (): Effect.Effect<string, HTTPResponseError | NetworkError, never> =>
      Effect.fail({ _tag: "HTTPResponseError" })

    const program = pipe(
      getJoke(),
      // #start
      TODO
      // #solution
      // Effect.catchTag("HTTPResponseError", () => Effect.succeed("Fallback joke"))
      // #end
    )

    expectTypeOf(program).toExtend<Effect.Effect<string, NetworkError, never>>()
    expect(Effect.runSync(program)).toEqual("Fallback joke")
  })

  it.skip.each([["NetworkError"], ["HTTPResponseError"]] as const)("should catch multiple errors", async (tag) => {
    type UnknownException = { readonly _tag: "UnknownException" }
    type HTTPResponseError = { readonly _tag: "HTTPResponseError" }
    type NetworkError = { readonly _tag: "NetworkError" }
    const getJoke = (): Effect.Effect<string, UnknownException | HTTPResponseError | NetworkError, never> =>
      Effect.fail({ _tag: tag })

    const program = pipe(
      getJoke(),
      // #start
      TODO
      // #solution
      // Effect.catchTags({
      //   HTTPResponseError: () => Effect.succeed("Fallback joke"),
      //   NetworkError: () => Effect.succeed("Fallback joke")
      // })
      // #end
    )

    expectTypeOf(program).toExtend<Effect.Effect<string, UnknownException, never>>()
    expect(Effect.runSync(program)).toEqual("Fallback joke")
  })

  it.skip("should all errors and always get a joke", async () => {
    type UnknownException = { readonly _tag: "UnknownException" }
    type HTTPResponseError = { readonly _tag: "HTTPResponseError" }
    type NetworkError = { readonly _tag: "NetworkError" }
    const getJoke = (): Effect.Effect<string, UnknownException | HTTPResponseError | NetworkError, never> =>
      Effect.fail({ _tag: "NetworkError" })

    const program = pipe(
      getJoke(),
      // #start
      TODO
      // #solution
      // Effect.catchAll(() => Effect.succeed("Fallback joke"))
      // #end
    )

    expectTypeOf(program).toExtend<Effect.Effect<string, never, never>>()
    expect(Effect.runSync(program)).toEqual("Fallback joke")
  })
})

describe("Effect defect", () => {
  it.skip("should handle unexpected error (defect)", async () => {
    const trustMe = () => Effect.dieMessage("You are too naive")

    const program = pipe(
      trustMe(),
      // #start
      TODO
      // #solution
      // Effect.catchAllDefect(() => Effect.succeed("I'm alive"))
      // #end
    )

    await expect(Effect.runPromise(program)).resolves.toEqual("I'm alive")
  })
})
