import { Effect, pipe } from "effect"
import { fetch as baseFetch } from "undici"
import { describe, expect, it } from "vitest"

describe("Effect basics", () => {
  it("Sync operation", () => {
    // Given
    function add(a: number, b: number): Effect.Effect<number> {
      return Effect.succeed(a + b)
    }

    // When
    const program = add(2, 8)

    // Then
    expect(Effect.runSync(program)).toEqual(10)
  })

  it("Should transform effect value", () => {
    // Given
    const add = (a: number) => (b: number) => a + b

    // When
    const result = pipe(
      Effect.succeed(2),
      Effect.map(add(3)),
      Effect.map(add(5))
    )

    // Then
    expect(Effect.runSync(result)).toEqual(10)
  })

  it("Should transform effect value and flatten to avoid Effect<Effect<number>>", () => {
    // Given
    const add = (a: number) => (b: number) => Effect.succeed(a + b)

    // When
    const result = pipe(Effect.succeed(2), Effect.flatMap(add(8)))

    // Then
    expect(Effect.runSync(result)).toEqual(10)
  })

  it("Async operation", async () => {
    // Given
    function addWithDelay(a: number, b: number): Effect.Effect<number> {
      return Effect.promise(() =>
        new Promise((resolve) => {
          setTimeout(() => resolve(a + b), 200)
        })
      )
    }

    // When
    const program = addWithDelay(2, 8)

    // Then
    await expect(Effect.runPromise(program)).resolves.toEqual(10)
  })

  it("Async operation that could fail", async () => {
    // Given
    type Fetch = (
      ...args: Parameters<typeof baseFetch>
    ) => Effect.Effect<Response, Error>
    const fetch: Fetch = (input, init) =>
      pipe(
        Effect.tryPromise({
          try: (signal) =>
            baseFetch(input, {
              signal,
              ...init
            }),
          catch: (_error) => new Error("meh")
        })
      )
    // When
    const asyncProgramThatSucceeds = fetch("https://api.chucknorris.io/jokes/random")
    const asyncProgramThatFails = fetch("https://fail")

    // Then
    await expect(Effect.runPromise(asyncProgramThatSucceeds)).resolves.toEqual(expect.objectContaining({
      status: 200,
      statusText: "OK"
    }))
    await expect(Effect.runPromise(asyncProgramThatFails)).rejects.toThrow(`meh`)
  })
})

describe("FP utils", () => {
  it("pipe", () => {
    // Given
    function add(a: number, b: number) {
      return a + b
    }
    function multiply(a: number, b: number) {
      return a * b
    }

    // When
    const result = pipe(
      add(4, 6),
      (a) => multiply(a, 4)
    )

    // Then
    expect(result).toEqual(40)
  })

  it("curried function", () => {
    // Given
    const add = (a: number) => (b: number) => a + b
    const multiply = (a: number) => (b: number) => a * b

    // When
    const result = pipe(
      4,
      add(6),
      multiply(4)
    )

    // Then
    expect(result).toEqual(40)
  })
})
