import { Duration, Effect, pipe } from "effect"
import { describe, expect, it } from "vitest"

describe("", () => {
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
  it("Should chain operations using the pipe function", () => {
    // Given
    const add = (a: number) => (b: number) => a + b

    // When
    const result = pipe(2, add(3), add(5))

    // Then
    expect(result).toEqual(10)
  })

  it("Async operation", async () => {
    // Given
    function addWithDelay(a: number, b: number): Effect.Effect<number> {
      return pipe(
        Effect.sleep(Duration.millis(400)),
        Effect.andThen(() => Effect.succeed(a + b))
      )
    }

    // When
    const program = addWithDelay(2, 8)

    // Then
    expect(await Effect.runPromise(program)).toEqual(10)
  })
})
