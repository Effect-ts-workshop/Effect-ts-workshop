import { HttpClient } from "@effect/platform"
import { NodeHttpClient } from "@effect/platform-node"
import { Array, Data, Effect, pipe } from "effect"
import { randomUUID } from "node:crypto"
import { TODO } from "shared/utils"
import { describe, expect, expectTypeOf, it, vi } from "vitest"

// ─────────────────────────────────────────────────────────────────────────────
// PARTIE 1 - Générateurs JavaScript classiques
// ─────────────────────────────────────────────────────────────────────────────

describe("JS generators - basics", () => {
  it.skip("yield pauses the generator and exposes a value", () => {
    // Un générateur est une fonction qui peut être mise en pause avec yield.
    // Chaque appel à .next() reprend l'exécution jusqu'au prochain yield.

    const items = TODO

    const gen = items()

    expect(gen.next()).toEqual({ value: "laptop", done: false })
    expect(gen.next()).toEqual({ value: "mouse", done: false })
    expect(gen.next()).toEqual({ value: "keyboard", done: false })
    expect(gen.next()).toEqual({ value: undefined, done: true }) // le générateur est épuisé
  })

  it.skip("the return value of a generator is in the last .next()", () => {
    // La valeur après `return` dans le générateur se retrouve dans { done: true, value: X }.
    // Les valeurs `yield`ées sont { done: false }, la valeur retournée est { done: true }.

    const getBrand = TODO

    const gen = getBrand()

    expect(gen.next()).toEqual({ value: "validating…", done: false })
    expect(gen.next()).toEqual({ value: "Apple", done: true })
  })

  it.skip("yield* delegates to another generator (like a flatMap)", () => {
    // `yield*` permet de déléguer l'itération à un sous-générateur.
    // C'est l'équivalent d'un "appeler et attendre" pour les générateurs.

    function* brands() {
      yield "Apple"
      yield "Dell"
    }

    const models = TODO

    const result = [...models()]

    expect(result).toEqual(["Apple", "Dell", "ThinkPad"])
  })

  it.skip("can send a value into the generator via next(value)", () => {
    // next(value) reprend le générateur ET injecte `value` comme résultat du `yield` en cours.
    // C'est ainsi qu'Effect.gen va "injecter" les résultats d'effects dans ton code.

    function* approveItem(): Generator<string, string, boolean> {
      // yield envoie une question vers l'extérieur, et reçoit une réponse (boolean)
      const approved = yield "Approve this item?"
      return approved ? "Item approved" : "Item rejected"
    }

    const gen = approveItem()

    const question = gen.next()
    const result = TODO

    expect(question).toEqual({ value: "Approve this item?", done: false })
    expect(result).toEqual({ value: "Item approved", done: true })
  })

  it.skip("[OPTIONAL] can be used to chain operations", () => {
    const add = (a: number) => (b: number) => a + b
    const pipeResult = pipe(20, add(18), add(4))

    const genPipe = (fn: () => Generator) => {
      // eslint-disable-next-line prefer-const
      let done = false
      // eslint-disable-next-line prefer-const
      let previousResult = undefined
      const gen = fn()
      do {
        TODO()
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

describe("Effect.fn - naming and composing handlers", () => {
  it.skip("Effect.fn creates a function that returns an Effect (with tracing span)", () => {
    // Effect.fn("name")(function*() { ... }) est exactement ce qu'on voit dans :
    //   - item-repository.ts : `const getAll = Effect.fn("getAll")(function*() { ... })`
    //   - http.ts : `Effect.fn(function*({ payload }) { ... })`
    const upperCase = (value: string) => Effect.succeed(value.toUpperCase())

    const getItemLabel = TODO

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
  it.skip("Using a generator instead of pipe", async () => {
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

    const fetchJokeGen = TODO

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

  it.skip("Can use imperative control flow inside generator", () => {
    const buildUser = () => Effect.succeed({ id: randomUUID() })
    const buildUsers = Effect.fn(function*(count: number) {
      const users = []

      TODO()

      return users
    })

    expect(Effect.runSync(buildUsers(10))).toHaveLength(10)
  })

  it.skip("Should catch error inside generator to reach the end", () => {
    class ThirdPartyError extends Data.TaggedError("ThirdPartyError")<{ message: string }> {}

    const getUserById = (id: string) => Effect.succeed({ id, firstName: "Martin", lastName: "Pecheur" })
    const getUserFriends = vi.fn((_: string) => Effect.fail(new ThirdPartyError({ message: "Network error" })))

    const getUser = Effect.fn(function*(id: string) {
      const user = yield* getUserById(id)

      const friends = TODO

      return { ...user, friends }
    })

    expect(Effect.runSync(getUser(randomUUID()))).toMatchObject({ friends: [] })
    expect(getUserFriends).toHaveBeenCalled()
  })

  it.skip("[OPTIONAL] interop with other data types", async () => {
    class MyDomainError extends Data.TaggedError("MyDomainError")<{ error: unknown }> {}

    type User = { id: string }
    const users: Array<User> = [{ id: randomUUID() }, { id: randomUUID() }, { id: randomUUID() }]
    const findUser = Effect.fn("findUser")(function*(id: string) {
      const foundUser = Array.findFirst(users, (user) => user.id === id)

      const user = TODO

      return user
    })

    expectTypeOf(findUser).toExtend<(id: string) => Effect.Effect<User, MyDomainError>>()
    await expect(Effect.runPromise(findUser("not-found"))).rejects.toThrow()
  })
})
