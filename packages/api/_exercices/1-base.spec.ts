import { Effect, pipe } from "effect"
import { TODO } from "shared/utils"
import type { fetch as baseFetch } from "undici"
import { describe, expect, it } from "vitest"

const TODO: any = {}

describe("functional programming utils", () => {
  it("currified function", () => {
    // Partial application of function parameters so that we end up with unary functions
    const add = (a: number, b: number) => a + b
    const multiply = (a: number, b: number) => a * b

    // #start
    const currifiedAdd = TODO
    const currifiedMultiply = TODO
    // #solution
    // const currifiedAdd = (a: number) => (b: number) => a + b
    // const currifiedMultiply = (a: number) => (b: number) => a * b

    // #end

    expect(add(4, 6)).toEqual(currifiedAdd(4)(6))
    expect(multiply(4, 6)).toEqual(currifiedMultiply(4)(6))
  })

  it.skip("pipe", () => {
    const add = (a: number) => (b: number) => a + b
    const multiply = (a: number) => (b: number) => a * b

    // Unary functions allow composition by chaining functions within a pipe
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

    const result: Effect.Effect<string> = pipe(
      Effect.succeed(2),
      // #start
      TODO(add(8))
      // #solution
      // Effect.map(add(8))
      // #end
    )

    expect(Effect.runSync(result)).toEqual(10)
  })

  it.skip("Should transform effect value and flatten to avoid Effect<Effect<string>>", () => {
    const greet = (greeting: string) => (name: string) => Effect.succeed(`${greeting}, ${name}!`)

    const result: Effect.Effect<string> = pipe(
      Effect.succeed("World"),
      // #start
      TODO(greet("Hello"))
      // #solution
      // Effect.flatMap(greet("Hello"))
      // #end
    )

    expect(Effect.runSync(result)).toEqual("Hello, World!")
  })

  it.skip("Async operation", async () => {
    const add = (a: number, b: number): Promise<number> =>
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
