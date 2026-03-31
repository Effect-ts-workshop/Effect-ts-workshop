import { Effect, Exit, Fiber } from "effect"
import { describe, expect, it } from "vitest"

describe("", () => {
  it("Aborts fetch on interrupt", async () => {
    // Given
    const program = Effect.tryPromise({
      try: (signal) =>
        fetch("https://api.chucknorris.io/jokes/random", {
          signal
        }),
      catch: (e) => e
    })

    // When
    const fiber = Effect.runFork(program)
    const exit = await Effect.runPromise(Fiber.interrupt(fiber))

    // Then
    expect(Exit.isInterrupted(exit)).toBe(true)
  })
})
