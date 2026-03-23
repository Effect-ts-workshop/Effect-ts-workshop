import { Effect, Option, pipe } from "effect"
import { describe, expect, expectTypeOf, it } from "vitest"

// ─────────────────────────────────────────────────────────────────────────────
// PARTIE 1 – Générateurs JavaScript classiques
// ─────────────────────────────────────────────────────────────────────────────

describe("JS generators – bases", () => {
  it("yield met le générateur en pause et expose une valeur", () => {
    // Un générateur est une fonction qui peut être mise en pause avec yield.
    // Chaque appel à .next() reprend l'exécution jusqu'au prochain yield.

    function* items() {
      yield "laptop"
      yield "mouse"
      yield "keyboard"
    }

    // Given
    const gen = items()

    // When / Then
    expect(gen.next()).toEqual({ value: "laptop", done: false })
    expect(gen.next()).toEqual({ value: "mouse", done: false })
    expect(gen.next()).toEqual({ value: "keyboard", done: false })
    expect(gen.next()).toEqual({ value: undefined, done: true }) // le générateur est épuisé
  })

  it("la valeur de retour d'un générateur est dans le dernier .next()", () => {
    // La valeur après `return` dans le générateur se retrouve dans { done: true, value: X }.
    // Les valeurs `yield`ées sont { done: false }, la valeur retournée est { done: true }.

    function* getBrand(): Generator<string, string, unknown> {
      yield "validating…" // étape intermédiaire
      return "Apple" // valeur finale
    }

    // Given
    const gen = getBrand()

    // When / Then
    expect(gen.next()).toEqual({ value: "validating…", done: false })
    expect(gen.next()).toEqual({ value: "Apple", done: true })
  })

  it("yield* délègue à un autre générateur (comme un flatMap)", () => {
    // `yield*` permet de déléguer l'itération à un sous-générateur.
    // C'est l'équivalent d'un "appeler et attendre" pour les générateurs.

    function* brands() {
      yield "Apple"
      yield "Dell"
    }

    function* models() {
      yield* brands() // délègue à brands : yield "Apple", yield "Dell"
      yield "ThinkPad"
    }

    // Given / When
    const result = [...models()]

    // Then
    expect(result).toEqual(["Apple", "Dell", "ThinkPad"])
  })

  it("on peut envoyer une valeur dans le générateur via next(value)", () => {
    // next(value) reprend le générateur ET injecte `value` comme résultat du `yield` en cours.
    // C'est ainsi qu'Effect.gen va "injecter" les résultats d'effects dans ton code.

    function* approveItem(): Generator<string, string, boolean> {
      // yield envoie une question vers l'extérieur, et reçoit une réponse (boolean)
      const approved = yield "Approve this item?"
      return approved ? "Item approved" : "Item rejected"
    }

    // Given
    const gen = approveItem()

    // When
    const question = gen.next() // démarre le générateur, reçoit la question
    const result = gen.next(true) // répond "true" → reprend avec approved = true

    // Then
    expect(question).toEqual({ value: "Approve this item?", done: false })
    expect(result).toEqual({ value: "Item approved", done: true })
  })

  it("un générateur peut modéliser une séquence d'opérations lazy", () => {
    // Sans générateur : toutes les opérations s'exécutent immédiatement.
    // Avec générateur : chaque étape ne s'exécute que quand on appelle .next().

    const log: Array<string> = []

    function* processItem(brand: string) {
      log.push("step 1: validate")
      yield brand.toUpperCase()

      log.push("step 2: save")
      yield `${brand} saved`
    }

    // Given
    const gen = processItem("Apple")
    expect(log).toEqual([]) // rien n'a encore été exécuté

    // When
    gen.next()
    expect(log).toEqual(["step 1: validate"])

    gen.next()
    expect(log).toEqual(["step 1: validate", "step 2: save"])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// PARTIE 2 – Effect.gen : yield* comme await pour les Effects
// ─────────────────────────────────────────────────────────────────────────────

describe("Effect.gen – yield* remplace flatMap", () => {
  it("yield* dans Effect.gen extrait la valeur d'un Effect.succeed", () => {
    // Effect.gen utilise le protocole des générateurs pour "déballer" les effects.
    // `yield* someEffect` ≈ `await somePromise` mais dans le monde Effect.

    // Given
    const program = Effect.gen(function*() {
      const brand = yield* Effect.succeed("Apple") // extrait "Apple" de l'Effect
      const model = yield* Effect.succeed("MacBook Pro")
      return `${brand} ${model}`
    })

    // When / Then
    expect(Effect.runSync(program)).toBe("Apple MacBook Pro")
  })

  it("Effect.gen est équivalent à une chaîne de flatMap", () => {
    // Ces deux programmes sont strictement équivalents.
    // Le générateur est plus lisible quand les étapes s'accumulent.

    const withFlatMap = pipe(
      Effect.succeed("Apple"),
      Effect.flatMap((brand) =>
        pipe(
          Effect.succeed("MacBook Pro"),
          Effect.flatMap((model) => Effect.succeed(`${brand} ${model}`))
        )
      )
    )

    const withGen = Effect.gen(function*() {
      const brand = yield* Effect.succeed("Apple")
      const model = yield* Effect.succeed("MacBook Pro")
      return `${brand} ${model}`
    })

    // Then
    expect(Effect.runSync(withFlatMap)).toBe(Effect.runSync(withGen))
  })

  it("yield* propage les erreurs automatiquement (comme throw dans async/await)", () => {
    // Quand un Effect échoue, yield* remonte l'erreur : pas besoin de try/catch explicite.
    // L'erreur est typée et tracée dans la signature Effect<A, E, R>.

    class ItemNotFound extends Error {
      readonly _tag = "ItemNotFound"
      constructor(readonly id: string) {
        super(`Item ${id} not found`)
      }
    }

    // Given
    const findItem = (id: string): Effect.Effect<string, ItemNotFound> =>
      id === "123"
        ? Effect.succeed("MacBook Pro")
        : Effect.fail(new ItemNotFound(id))

    const program = Effect.gen(function*() {
      const item = yield* findItem("999") // échoue → sort immédiatement du générateur
      return item.toUpperCase() // jamais atteint
    })

    // When / Then
    expect(() => Effect.runSync(program)).toThrow("Item 999 not found")
    expectTypeOf(program).toEqualTypeOf<Effect.Effect<string, ItemNotFound, never>>()
  })

  it("yield* peut récupérer une Option (comme dans getItemById)", () => {
    // Dans Effect 3.x, Option implémente l'interface Yieldable.
    // `yield* someOption` extrait la valeur si Some, ou échoue avec NoSuchElementException si None.
    // C'est exactement le pattern qu'on retrouve dans les handlers de http.ts.

    const findById = (id: string): Effect.Effect<Option.Option<string>> =>
      Effect.succeed(id === "42" ? Option.some("MacBook Pro") : Option.none())

    // Given – cas trouvé
    const found = Effect.gen(function*() {
      const maybeItem = yield* findById("42")
      return yield* maybeItem // extrait "MacBook Pro" ou échoue
    })

    // Given – cas non trouvé
    const notFound = Effect.gen(function*() {
      const maybeItem = yield* findById("999")
      return yield* maybeItem // Option.none() → NoSuchElementException
    })

    // Then
    expect(Effect.runSync(found)).toBe("MacBook Pro")
    expect(() => Effect.runSync(notFound)).toThrow()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// PARTIE 3 – Effect.fn : le pattern utilisé dans http.ts et item-repository.ts
// ─────────────────────────────────────────────────────────────────────────────

describe("Effect.fn – nommer et composer des handlers", () => {
  it("Effect.fn crée une fonction qui retourne un Effect (avec span de tracing)", () => {
    // Effect.fn("name")(function*() { ... }) est exactement ce qu'on voit dans :
    //   - item-repository.ts : `const getAll = Effect.fn("getAll")(function*() { ... })`
    //   - http.ts : `Effect.fn(function*({ payload }) { ... })`
    //
    // Le nom est utilisé pour le tracing (OpenTelemetry / Signoz).

    // Given
    const getItemLabel = Effect.fn("getItemLabel")(function*(brand: string, model: string) {
      const upper = yield* Effect.sync(() => brand.toUpperCase())
      return `${upper} – ${model}`
    })

    // When
    const program = getItemLabel("apple", "MacBook Pro")

    // Then
    expect(Effect.runSync(program)).toBe("APPLE – MacBook Pro")
  })

  it("yield* service puis yield* méthode : le pattern DI de http.ts", () => {
    // Dans http.ts :
    //   const items = yield* ItemRepository          ← résout le service depuis le contexte
    //   const allUsers = yield* users.getAll()       ← appelle la méthode du service
    //
    // Ici on simule ce pattern sans vraie base de données.

    // Given – un service simple
    class ItemService extends Effect.Service<ItemService>()("test/ItemService", {
      succeed: {
        getAll: Effect.fn("getAll")(function*() {
          const items = yield* Effect.succeed([
            { id: "1", brand: "Apple", model: "MacBook Pro" },
            { id: "2", brand: "Dell", model: "XPS 15" }
          ])
          return items
        })
      }
    }) {}

    // When – le handler qui ressemble à http.ts
    const getAllHandler = Effect.fn("getAllItems")(function*() {
      const repo = yield* ItemService // yield* résout la dépendance
      const items = yield* repo.getAll() // yield* appelle la méthode
      return { items, count: items.length }
    })

    const program = getAllHandler().pipe(
      Effect.provide(ItemService.Default)
    )

    // Then
    const result = Effect.runSync(program)
    expect(result.count).toBe(2)
    expect(result.items[0].brand).toBe("Apple")
  })
})
