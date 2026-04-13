import { Effect, pipe } from "effect"
import type { fetch as baseFetch } from "undici"
import { describe, expect, it } from "vitest"

const TODO: any = {}

describe("FP utils", () => {
  it.skip("pipe", () => {
    const add = (a: number, b: number) => a + b
    const multiply = (a: number, b: number) => a * b

    const result = pipe(
      add(4, 6),
      // #start
      TODO
      // #solution
      // (a) => multiply(a, 4)
      // #end
    )

    expect(result).toEqual(40)
  })

  it.skip("currified function", () => {
    const add = (a: number) => (b: number) => a + b
    const multiply = (a: number) => (b: number) => a * b

    const result = pipe(
      4,
      add(6),
      // #start
      TODO
      // #solution
      // multiply(4)
      // #end
    )

    expect(result).toEqual(40)
  })
})

describe("Effect basics", () => {
  it.skip("Sync operation", () => {
    const add = (a: number, b: number): Effect.Effect<number> => {
      const result = a + b

      // #start
      return TODO(result)
      // #solution
      // return Effect.succeed(result)
      // #end
    }

    const program = add(2, 8)

    expect(Effect.runSync(program)).toEqual(10)
  })

  it.skip("Should transform effect value", () => {
    const add = (a: number) => (b: number) => a + b

    const result = pipe(
      Effect.succeed(2),
      // #start
      TODO(add(8))
      // #solution
      // Effect.map(add(8))
      // #end
    )

    expect(Effect.runSync(result)).toEqual(10)
  })

  it.skip("Should transform effect value and flatten to avoid Effect<Effect<number>>", () => {
    const add = (a: number) => (b: number) => Effect.succeed(a + b)

    const result = pipe(
      Effect.succeed(2),
      // #start
      TODO(add(8))
      // #solution
      // Effect.flatMap(add(8))
      // #end
    )

    expect(Effect.runSync(result)).toEqual(10)
  })

  it.skip("Async operation", async () => {
    const add = (a: number, b: number) =>
      new Promise((resolve) => {
        setTimeout(() => resolve(a + b), 200)
      })
    const addWithDelay = (a: number, b: number): Effect.Effect<number> => {
      // #start
      return TODO(() => add(a, b))
      // #solution
      // return Effect.promise(() => add(a, b))
      // #end
    }

    const program = addWithDelay(2, 8)

    await expect(Effect.runPromise(program)).resolves.toEqual(10)
  })

  it.skip("Async operation that could fail", async () => {
    type Fetch = (
      ...args: Parameters<typeof baseFetch>
    ) => Effect.Effect<Response, Error>
    const fetch: Fetch = (input, init) => {
      // #start
      return TODO
      // #solution
      // return Effect.tryPromise({
      //   try: () => baseFetch(input, init),
      //   catch: (_error) => new Error("meh")
      // })
      // #end
    }
    const asyncProgramThatSucceeds = fetch("https://api.chucknorris.io/jokes/random")
    const asyncProgramThatFails = fetch("https://fail")

    await expect(Effect.runPromise(asyncProgramThatSucceeds)).resolves.toEqual(expect.objectContaining({
      status: 200,
      statusText: "OK"
    }))
    await expect(Effect.runPromise(asyncProgramThatFails)).rejects.toThrow(`meh`)
  })
})
