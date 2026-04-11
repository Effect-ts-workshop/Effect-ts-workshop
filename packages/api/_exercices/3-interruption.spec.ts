import { Data, Effect, Exit, Fiber } from "effect"
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
})

describe("addFinalizer — connexion base de données", () => {
  it.skip("ferme la connexion même si une erreur survient", async () => {
    // On simule une connexion avec un flag pour savoir si elle est ouverte
    const makeConnection = (log: Array<string>) => ({
      query: () => Effect.fail(new Error("requête échouée")),
      close: () => log.push("connection:closed")
    })

    const closedLog: Array<string> = []

    const program = Effect.gen(function*() {
      const connection = makeConnection(closedLog)
      // #start
      // Le finalizer enregistre le cleanup — sera exécuté quoi qu'il arrive
      yield* TODO
      // #solution
      // yield* Effect.addFinalizer(() => Effect.sync(() => connection.close()))
      // #end
      // Cette requête va échouer
      return yield* connection.query()
    })

    // scoped() crée un Scope et le ferme à la fin du programme
    await Effect.runPromise(Effect.scoped(program)).catch(() => {})

    // Même si la requête a échoué, le finalizer a bien été exécuté
    expect(closedLog).toContain("connection:closed")
  })
})

describe("addFinalizer — lock distribué (multi-pods)", () => {
  it("un seul pod exécute le job, l'autre est bloqué", async () => {
    // Simule un Redis partagé entre tous les pods
    const sharedRedis = { locks: new Set<string>() }

    const acquireLock = (key: string) =>
      Effect.sync(() => {
        if (sharedRedis.locks.has(key)) return false // déjà pris
        sharedRedis.locks.add(key)
        return true
      })

    const releaseLock = (key: string) => Effect.sync(() => sharedRedis.locks.delete(key))

    const runJobIfAvailable = (podName: string, log: Array<string>) =>
      Effect.gen(function*() {
        const acquired = yield* acquireLock("job:send-emails")

        if (!acquired) {
          log.push(`${podName}:skipped`)
          return
        }

        // #start
        // Lock obtenu → on enregistre le cleanup immédiatement
        yield* TODO
        // #solution
        // yield* Effect.addFinalizer(() => releaseLock("job:send-emails"))
        // #end

        log.push(`${podName}:running`)
        // ... exécution du job ...
      })

    const executionLog: Array<string> = []

    // Les deux pods tentent de démarrer en même temps
    await Effect.runPromise(
      Effect.scoped(
        Effect.gen(function*() {
          yield* runJobIfAvailable("pod-A", executionLog)
          yield* runJobIfAvailable("pod-B", executionLog)
        })
      )
    )

    expect(executionLog).toContain("pod-A:running") // pod-A a le lock
    expect(executionLog).toContain("pod-B:skipped") // pod-B est bloqué
    expect(sharedRedis.locks.size).toBe(0) // lock libéré à la fin
  })

  it("libère le lock si le job est interrompu", async () => {
    const sharedRedis = { locks: new Set<string>() }

    const releaseLock = (key: string) => Effect.sync(() => sharedRedis.locks.delete(key))

    const longJob = Effect.gen(function*() {
      sharedRedis.locks.add("job:send-emails")

      // #start
      // Lock obtenu → on enregistre le cleanup immédiatement
      yield* TODO
      // #solution
      // yield* Effect.addFinalizer(() => releaseLock("job:send-emails"))
      // #end

      // Simule un job long (jamais terminé dans ce test)
      yield* Effect.never
    })

    const fiber = Effect.runFork(Effect.scoped(longJob))
    await Effect.runPromise(Fiber.interrupt(fiber))

    // Le lock a bien été libéré malgré l'interruption
    expect(sharedRedis.locks.size).toBe(0)
  })
})

describe("addFinalizer — fichier temporaire", () => {
  it("supprime le fichier temporaire après utilisation", async () => {
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

      // #start
      yield* TODO
      // #solution
      // yield* Effect.addFinalizer(() => deleteTempFile(path))
      // #end

      // Simule un traitement du fichier
      return path.replace(".tmp", ".processed")
    })

    const result = await Effect.runPromise(Effect.scoped(program))

    expect(result).toBe("upload-12345.processed") // traitement ok
    expect(filesystem.has("upload-12345.tmp")).toBe(false) // fichier supprimé
  })
})

describe("acquireRelease — garantie du release", () => {
  // Helper partagé : connexion simulée
  const makeConnection = (log: Array<string>) => ({
    query: (sql: string) => Effect.sync(() => `résultat: ${sql}`),
    close: () => log.push("connection:closed")
  })

  it("exécute le release après un succès", async () => {
    const log: Array<string> = []

    // acquireRelease couple explicitement l'ouverture et la fermeture
    // #start
    const resource = TODO
    // #solution
    //   const resource = Effect.acquireRelease(
    // Effect.sync(() => makeConnection(log)), // acquire : ouvre la connexion
    //  (conn) => Effect.sync(() => conn.close()) // release : toujours exécuté)
    // #end

    const program = Effect.gen(function*() {
      const conn = yield* resource
      return yield* conn.query("SELECT 1")
    })

    const result = await Effect.runPromise(Effect.scoped(program))

    expect(result).toBe("résultat: SELECT 1") // la requête a abouti
    expect(log).toContain("connection:closed") // connexion bien fermée
  })

  it("exécute le release même si une erreur survient", async () => {
    const log: Array<string> = []

    // #start
    const resource = TODO
    // #solution
    //  const resource = Effect.acquireRelease(
    //   Effect.sync(() => ({
    //     ...makeConnection(log),
    //     query: () => Effect.fail(new Error("timeout"))
    //   })),
    //   (conn) => Effect.sync(() => conn.close())
    // )
    // #end

    const program = Effect.gen(function*() {
      const conn = yield* resource
      return yield* conn.query()
    })

    await Effect.runPromise(Effect.scoped(program)).catch(() => {})

    // release appelé malgré l'échec → pas de connexion qui reste ouverte
    expect(log).toContain("connection:closed")
  })

  it("exécute le release si le fiber est interrompu", async () => {
    const log: Array<string> = []

    const resource = Effect.acquireRelease(
      Effect.sync(() => makeConnection(log)),
      (conn) => Effect.sync(() => conn.close())
    )

    const program = Effect.gen(function*() {
      yield* resource
      yield* Effect.never // simule un traitement long
    })

    const fiber = Effect.runFork(Effect.scoped(program))

    // #start
    await Effect.runPromise(TODO)
    // #solution
    // await Effect.runPromise(Fiber.interrupt(fiber))
    // #end

    // release appelé malgré l'interruption → connexion proprement fermée
    expect(log).toContain("connection:closed")
  })
})
