import { HttpClient } from "@effect/platform"
import { NodeHttpClient } from "@effect/platform-node"
import { Effect, pipe } from "effect"
import { describe, expect, it } from "vitest"

const TODO: any = {}

// ─────────────────────────────────────────────────────────────────────────────
// PARTIE 1 – Générateurs JavaScript classiques
// ─────────────────────────────────────────────────────────────────────────────

describe("JS generators – bases", () => {
  it("yield met le générateur en pause et expose une valeur", () => {
    // Un générateur est une fonction qui peut être mise en pause avec yield.
    // Chaque appel à .next() reprend l'exécution jusqu'au prochain yield.

    // #start
    const items = TODO
    // #solution
    // function* items() {
    //   yield "laptop"
    //   yield "mouse"
    //   yield "keyboard"
    // }
    // #end

    const gen = items()

    expect(gen.next()).toEqual({ value: "laptop", done: false })
    expect(gen.next()).toEqual({ value: "mouse", done: false })
    expect(gen.next()).toEqual({ value: "keyboard", done: false })
    expect(gen.next()).toEqual({ value: undefined, done: true }) // le générateur est épuisé
  })

  it("la valeur de retour d'un générateur est dans le dernier .next()", () => {
    // La valeur après `return` dans le générateur se retrouve dans { done: true, value: X }.
    // Les valeurs `yield`ées sont { done: false }, la valeur retournée est { done: true }.

    // #start
    const getBrand = TODO
    // #solution
    // function* getBrand(): Generator<string, string, unknown> {
    //   yield "validating…" // étape intermédiaire
    //   return "Apple" // valeur finale
    // }
    // #end

    const gen = getBrand()

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

    // #start
    const models = TODO
    // #solution
    // function* models() {
    //   yield* brands() // délègue à brands : yield "Apple", yield "Dell"
    //   yield "ThinkPad"
    // }
    // #end

    const result = [...models()]

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

    const gen = approveItem()

    const question = gen.next()
    // #start
    const result = TODO
    // #solution
    // const result = gen.next(true) // répond "true" → reprend avec approved = true
    // #end

    expect(question).toEqual({ value: "Approve this item?", done: false })
    expect(result).toEqual({ value: "Item approved", done: true })
  })

  it("can be used to chain operations", () => {
    const add = (a: number) => (b: number) => a + b
    const pipeResult = pipe(20, add(18), add(4))

    const genPipe = (fn: () => Generator) => {
      const done = false
      const previousResult = undefined
      const gen = fn()
      do {
        // #start
        TODO()
        // #solution
        // const result = gen.next(previousResult)
        // previousResult = result.value
        // done = result.done || false
        // #end
      } while (!done)

      return previousResult
    }
    const genResult = genPipe(function*() {
      const value20 = yield 20
      const value38 = yield add(18)(value20)
      return add(4)(value38)
    })

    expect(pipeResult).toEqual(genResult)
  })

  // TODO Add in doc and remove test
  it.skip("un générateur peut modéliser une séquence d'opérations lazy", () => {
    // Sans générateur : toutes les opérations s'exécutent immédiatement.
    // Avec générateur : chaque étape ne s'exécute que quand on appelle .next().

    const log: Array<string> = []

    function* processItem(brand: string) {
      log.push("step 1: validate")
      yield brand.toUpperCase()

      log.push("step 2: save")
      yield `${brand} saved`
    }

    const gen = processItem("Apple")
    expect(log).toEqual([]) // rien n'a encore été exécuté

    gen.next()
    expect(log).toEqual(["step 1: validate"])

    gen.next()
    expect(log).toEqual(["step 1: validate", "step 2: save"])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// PARTIE 2 – Effect.fn : les bases
// ─────────────────────────────────────────────────────────────────────────────
//
// Effect.fn("nom")(function*() { ... })
// C'est le pattern utilisé dans item-repository.ts et http.ts du projet.
// Si vous voulez aller jeter un coup d'oeil

describe("Effect.fn – nommer et composer des handlers", () => {
  it("Effect.fn crée une fonction qui retourne un Effect (avec span de tracing)", () => {
    // Effect.fn("name")(function*() { ... }) est exactement ce qu'on voit dans :
    //   - item-repository.ts : `const getAll = Effect.fn("getAll")(function*() { ... })`
    //   - http.ts : `Effect.fn(function*({ payload }) { ... })`

    // #start
    const getItemLabel = TODO
    // #solution
    // const getItemLabel = Effect.fn("getItemLabel")(function*(brand: string, model: string) {
    //   const upper = yield* Effect.sync(() => brand.toUpperCase())
    //   return `${upper} – ${model}`
    // })
    // #end

    const program = getItemLabel("apple", "MacBook Pro")

    expect(Effect.runSync(program)).toBe("APPLE – MacBook Pro")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// PARTIE 3 – Cas réel : générateurs avec des dépendances (HttpClient)
// ─────────────────────────────────────────────────────────────────────────────
//
// Dans un vrai programme, les effects ont des dépendances (services, clients HTTP…).
// `yield* HttpClient.HttpClient` résout la dépendance depuis le contexte Effect.
// On verra comment fournir ces dépendances dans l'exercice sur les Layers.

describe("Effect context", () => {
  it("Using a generator instead of pipe", async () => {
    const fetchJoke = (id: string) =>
      pipe(
        HttpClient.HttpClient,
        Effect.flatMap((client) =>
          pipe(
            client.get(`https://api.chucknorris.io/jokes/${id}`),
            Effect.flatMap((response) =>
              pipe(
                response.json,
                Effect.map((data) => ({ response, data }))
              )
            )
          )
        )
      )

    // Advanced pipe syntax with do notation
    const fetchJokeDo = (id: string) =>
      pipe(
        Effect.Do,
        Effect.bind("client", () => HttpClient.HttpClient),
        Effect.bind("response", ({ client }) => client.get(`https://api.chucknorris.io/jokes/${id}`)),
        Effect.bind("data", ({ response }) => response.json),
        Effect.map(({ data, response }) => ({ response, data }))
      )

    // #start
    const fetchJokeGen = TODO
    // #solution
    // const fetchJokeGen = Effect.fn("fetchJokeGen")(function*(id: string) {
    //   const client = yield* HttpClient.HttpClient
    //   const response = yield* client.get(`https://api.chucknorris.io/jokes/${id}`)
    //   const data = yield* response.json
    //   return { response, data }
    // })
    // #end

    const jokeId = "XRg6ljeHSlaXghH1IYulJw"
    const program = pipe(fetchJoke(jokeId), Effect.provide(NodeHttpClient.layerUndici))
    const programDo = pipe(fetchJokeDo(jokeId), Effect.provide(NodeHttpClient.layerUndici))
    const programGen = pipe(fetchJokeGen(jokeId), Effect.provide(NodeHttpClient.layerUndici))
    expect((await Effect.runPromise(program)).data).toEqual((await Effect.runPromise(programDo)).data)
    expect((await Effect.runPromise(program)).data).toEqual((await Effect.runPromise(programGen)).data)
  })

  it.todo("Imperative control flow", () => {})
  it.todo("dual API", () => {})
  it.todo("yield error/either/option", () => {})
})
