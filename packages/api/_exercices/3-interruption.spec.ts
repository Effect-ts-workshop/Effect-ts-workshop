import { Data, Duration, Effect, Exit, Fiber, pipe } from "effect"
import { describe, expect, it, vi } from "vitest"

const TODO: any = {}

describe("Interruption", () => {
  it("could propagate interruption with AbortSignal", async () => {
    const abortCallback = vi.fn()
    const slowFetch = vi.fn((_, init) =>
      new Promise((resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          abortCallback()
          reject(new DOMException("Aborted", "AbortError"))
        })

        setTimeout(() => {
          resolve("Mocked data")
        }, 3_000)
      })
    )
    class NetworkError extends Data.TaggedError("NetworkError")<{ error: unknown }> {}
    const program = Effect.tryPromise({
      // #start
      try: () => slowFetch("https://api.chucknorris.io/jokes/random", { signal: TODO }),
      // #solution
      // try: (signal) => slowFetch("https://api.chucknorris.io/jokes/random", { signal }),
      // #end
      catch: (error) => new NetworkError({ error })
    })

    const fiber = Effect.runFork(program)
    const exit = await Effect.runPromise(Fiber.interrupt(fiber))

    expect(Exit.isInterrupted(exit)).toBe(true)
    expect(abortCallback).toHaveBeenCalled()
  })

  // TODO Add resource cleanup
})
