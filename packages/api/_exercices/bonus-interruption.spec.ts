import { Data, Duration, Effect, Exit, Fiber, pipe } from "effect"
import { timeout } from "effect/Effect"
import { TODO } from "shared/utils"
import { beforeEach, describe, expect, it, vi } from "vitest"

describe("Interruption", () => {
  it.skip("[OPTIONAL] could propagate interruption with AbortSignal", async () => {
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
      try: () => slowFetch("https://api.chucknorris.io/jokes/random", { signal: TODO }),
      catch: (error) => new NetworkError({ error })
    })

    const fiber = Effect.runFork(program)
    const exit = await Effect.runPromise(Fiber.interrupt(fiber))

    expect(Exit.isInterrupted(exit)).toBe(true)
    expect(abortCallback).toHaveBeenCalled()
  })
})

describe("addFinalizer - database connection", () => {
  it.skip("[OPTIONAL] closes the connection even if an error occurs", async () => {
    class QueryError extends Data.TaggedError("QueryError") {}

    const close = vi.fn(() => Effect.void)
    // On simule une connexion avec un flag pour savoir si elle est ouverte
    const makeConnection = () => ({
      query: () => Effect.fail(new QueryError()),
      close
    })

    const program = Effect.gen(function*() {
      const connection = makeConnection()
      // Le finalizer enregistre le cleanup - sera exécuté quoi qu'il arrive
      yield* TODO
      // Cette requête va échouer
      return yield* connection.query()
    })

    // scoped() crée un Scope et le ferme à la fin du programme
    await Effect.runPromise(Effect.scoped(program)).catch(() => {})

    // Même si la requête a échoué, le finalizer a bien été exécuté
    expect(close).toHaveBeenCalled()
  })
})

describe("addFinalizer - temporary file", () => {
  it.skip("[OPTIONAL] deletes the temporary file after use", async () => {
    // Simule un système de fichiers en mémoire
    const filesystem = new Set<string>()

    const createTempFile = (name: string) =>
      Effect.sync(() => {
        filesystem.add(name)
        return name
      })

    const deleteTempFile = (name: string) => Effect.sync(() => filesystem.delete(name))

    const program = Effect.gen(function*() {
      const path = yield* createTempFile("upload-12345.tmp")

      yield* TODO

      // Simule un traitement du fichier
      return path.replace(".tmp", ".processed")
    })

    const result = await Effect.runPromise(Effect.scoped(program))

    expect(result).toBe("upload-12345.processed") // traitement ok
    expect(filesystem.has("upload-12345.tmp")).toBe(false) // fichier supprimé
  })
})

describe("acquireRelease - release guarantee", () => {
  class QueryError extends Data.TaggedError("QueryError") {}
  const close = vi.fn(() => Effect.void)
  beforeEach(() => {
    close.mockReset()
  })

  it.skip.each([
    { queryResult: Effect.succeed("COOL"), isSuccess: true, label: "success" },
    { queryResult: Effect.fail(new QueryError()), isSuccess: false, label: "error" },
    { queryResult: Effect.never, isSuccess: false, label: "interruption" } // never endinf query, will be interput by parent (see timeout)
  ])(
    "[OPTIONAL] executes the release after a $label",
    async ({ isSuccess, queryResult }) => {
      const makeConnection = () => Effect.succeed({ query: (_: string) => queryResult, close })

      // acquireRelease couple explicitement l'ouverture et la fermeture
      const resource = TODO

      const program = pipe(
        Effect.gen(function*() {
          const conn = yield* resource
          return yield* conn.query("SELECT 1")
        }),
        timeout(Duration.millis(200))
      )

      const result = await Effect.runPromiseExit(Effect.scoped(program))

      expect(Exit.isSuccess(result)).toEqual(isSuccess)
      expect(close).toHaveBeenCalled() // connexion bien fermée
    }
  )
})
