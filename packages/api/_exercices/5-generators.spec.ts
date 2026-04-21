import { HttpClient } from "@effect/platform"
import { NodeHttpClient } from "@effect/platform-node"
import { Array, Data, Effect, pipe } from "effect"
import { randomUUID } from "node:crypto"
import { describe, expect, expectTypeOf, it, vi } from "vitest"

// ─────────────────────────────────────────────────────────────────────────────
// PARTIE 1 - Générateurs JavaScript classiques
// ─────────────────────────────────────────────────────────────────────────────

describe("JS generators - bases", () => {
  it("Yield met le générateur en pause et expose une valeur", () => {
    // Un générateur est une fonction qui peut être mise en pause avec yield.
    // Chaque appel à .next() reprend l'exécution jusqu'au prochain yield.

    // #start
    // const items = TODO
    // #solution
    function* items() {
      yield "laptop"
      yield "mouse"
      yield "keyboard"
    }
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
    // const getBrand = TODO
    // #solution
    function* getBrand(): Generator<string, string, unknown> {
      yield "validating…" // étape intermédiaire
      return "Apple" // valeur finale
    }
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
    // const models = TODO
    // #solution
    function* models() {
      yield* brands() // délègue à brands : yield "Apple", yield "Dell"
      yield "ThinkPad"
    }
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
    // const result = TODO
    // #solution
    const result = gen.next(true) // répond "true" → reprend avec approved = true
    // #end

    expect(question).toEqual({ value: "Approve this item?", done: false })
    expect(result).toEqual({ value: "Item approved", done: true })
  })

  it("[OPTIONAL] can be used to chain operations", () => {
    const add = (a: number) => (b: number) => a + b
    const pipeResult = pipe(20, add(18), add(4))

    const genPipe = (fn: () => Generator) => {
      // #start
      // // eslint-disable-next-line prefer-const
      // #solution
      // #end
      let done = false
      // #start
      // // eslint-disable-next-line prefer-const
      // #solution
      // #end
      let previousResult = undefined
      const gen = fn()
      do {
        // #start
        // TODO()
        // #solution
        const result = gen.next(previousResult)
        previousResult = result.value
        done = result.done || false
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
})

// ─────────────────────────────────────────────────────────────────────────────
// PARTIE 2 - Effect.fn : les bases
// ─────────────────────────────────────────────────────────────────────────────
//
// Effect.fn("nom")(function*() { ... })
// C'est le pattern utilisé dans item-repository.ts et http.ts du projet.
// Si vous voulez aller jeter un coup d'oeil

describe("Effect.fn - nommer et composer des handlers", () => {
  it("Effect.fn crée une fonction qui retourne un Effect (avec span de tracing)", () => {
    // Effect.fn("name")(function*() { ... }) est exactement ce qu'on voit dans :
    //   - item-repository.ts : `const getAll = Effect.fn("getAll")(function*() { ... })`
    //   - http.ts : `Effect.fn(function*({ payload }) { ... })`
    const upperCase = (value: string) => Effect.succeed(value.toUpperCase())

    // #start
    // const getItemLabel = TODO
    // #solution
    const getItemLabel = Effect.fn("getItemLabel")(function*(brand: string, model: string) {
      const upper = yield* upperCase(brand)
      return `${upper} - ${model}`
    })
    // #end

    const program = getItemLabel("apple", "MacBook Pro")

    expect(Effect.runSync(program)).toBe("APPLE - MacBook Pro")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// PARTIE 3 - Cas réel : générateurs avec des dépendances (HttpClient)
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
    // const fetchJokeGen = TODO
    // #solution
    const fetchJokeGen = Effect.fn("fetchJokeGen")(function*(id: string) {
      const client = yield* HttpClient.HttpClient
      const response = yield* client.get(`https://api.chucknorris.io/jokes/${id}`)
      const data = yield* response.json
      return { response, data }
    })
    // #end

    const jokeId = "XRg6ljeHSlaXghH1IYulJw"
    const { result, resultDo, resultGen } = await pipe(
      Effect.all({
        result: fetchJoke(jokeId),
        resultDo: fetchJokeDo(jokeId),
        resultGen: fetchJokeGen(jokeId)
      }, { concurrency: "unbounded" }),
      Effect.provide(NodeHttpClient.layerUndici),
      Effect.runPromise
    )
    expect(result.data).toEqual(resultDo.data)
    expect(result.data).toEqual(resultGen.data)
  })

  it("Can use imperative control flow inside generator", () => {
    const buildUser = () => Effect.succeed({ id: randomUUID() })
    const buildUsers = Effect.fn(function*(count: number) {
      const users = []

      // #start
      // TODO()
      // #solution
      for (let index = 0; index < count; index++) {
        const user = yield* buildUser()
        users.push(user)
      }
      // #end

      return users
    })

    expect(Effect.runSync(buildUsers(10))).toHaveLength(10)
  })

  it("Should catch error inside generator to reach the end", () => {
    class ThirdPartyError extends Data.TaggedError("ThirdPartyError")<{ message: string }> {}

    const getUserById = (id: string) => Effect.succeed({ id, firstName: "Martin", lastName: "Pecheur" })
    const getUserFriends = vi.fn((_: string) => Effect.fail(new ThirdPartyError({ message: "Network error" })))

    const getUser = Effect.fn(function*(id: string) {
      const user = yield* getUserById(id)

      // #start
      // const friends = TODO
      // #solution
      const friends = yield* Effect.orElse(
        getUserFriends(id),
        () => Effect.succeed([])
      )
      // #end

      return { ...user, friends }
    })

    expect(Effect.runSync(getUser(randomUUID()))).toMatchObject({ friends: [] })
    expect(getUserFriends).toHaveBeenCalled()
  })

  it("[OPTIONAL] interop with other data types", async () => {
    class MyDomainError extends Data.TaggedError("MyDomainError")<{ error: unknown }> {}

    type User = { id: string }
    const users: Array<User> = [{ id: randomUUID() }, { id: randomUUID() }, { id: randomUUID() }]
    const findUser = Effect.fn("findUser")(function*(id: string) {
      const foundUser = Array.findFirst(users, (user) => user.id === id)

      // #start
      // const user = TODO
      // #solution
      const user = yield* Effect.catchAll(foundUser, (error) => new MyDomainError({ error }))
      // #end

      return user
    })

    expectTypeOf(findUser).toExtend<(id: string) => Effect.Effect<User, MyDomainError>>()
    await expect(Effect.runPromise(findUser("not-found"))).rejects.toThrow()
  })
})
