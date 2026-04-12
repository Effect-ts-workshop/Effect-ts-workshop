import { HttpClient } from "@effect/platform"
import { NodeHttpClient } from "@effect/platform-node"
import { Effect, Layer, pipe } from "effect"
import { describe, expect, expectTypeOf, it } from "vitest"

const TODO: any = {}

/**
 * Key points to document:
 * - Avoiding Requirement Leakage
 */
describe("Effect context", () => {
  it.skip("Using a service", async () => {
    type Joke = { value: string; url: string }
    const fetchJoke = () =>
      pipe(
        // #start
        TODO
        // #solution
        // HttpClient.HttpClient,
        // Effect.flatMap((client) => client.get("https://api.chucknorris.io/jokes/random")),
        // Effect.flatMap((response) => response.json),
        // Effect.map((joke) => joke as Joke),
        // Effect.orElseSucceed((): Joke => ({ url: "http://fake.fr", value: "No jokes today" }))
        // #end
      )

    const program = pipe(fetchJoke(), Effect.provide(NodeHttpClient.layer))

    expectTypeOf(fetchJoke).toEqualTypeOf<
      () => Effect.Effect<Joke, never, HttpClient.HttpClient>
    >()
    await expect(Effect.runPromise(program)).resolves.toMatchObject({
      url: expect.stringContaining("https://api.chucknorris.io")
    })
  })

  it.skip("Creating your own service with live and test implementation", async () => {
    type JokeService = {
      getRandom: () => Effect.Effect<string>
    }
    // #start
    const JokeService = TODO
    // #solution
    // const JokeService = Context.GenericTag<JokeService>("JokeService")
    // #end

    const JokeServiceTest = Layer.succeed(
      JokeService,
      // #start
      TODO
      // #solution
      // {
      //   getRandom: () => {
      //     return Effect.succeed("Not really random for tests")
      //   }
      // }
      // #end
    )

    const JokeServiceLive = Layer.succeed(
      JokeService,
      // #start
      TODO
      // #solution
      // {
      //   getRandom: () => {
      //     return Effect.succeed("Amazing joke from server")
      //   }
      // }
      // #end
    )

    const program = pipe(JokeService, Effect.flatMap((jokes) => jokes.getRandom()))
    await expect(Effect.runPromise(pipe(program, Effect.provide(JokeServiceTest)))).resolves.toEqual(
      "Not really random for tests"
    )
    await expect(Effect.runPromise(pipe(program, Effect.provide(JokeServiceLive)))).resolves.toEqual(
      "Amazing joke from server"
    )
  })

  it.skip("Simplifying service definitions with Effect.Service", async () => {
    // #start
    const JokeService = TODO
    // #solution
    // class JokeService extends Effect.Service<JokeService>()("JokeService", {
    //   effect: pipe(
    //     HttpClient.HttpClient,
    //     Effect.map((client) => {
    //       return {
    //         getRandom: () =>
    //           pipe(
    //             client.get("https://api.chucknorris.io/jokes/random"),
    //             Effect.flatMap((response) => response.json),
    //             Effect.map((joke) => (joke as { value: string }).value),
    //             Effect.orElseSucceed(() => "No jokes for today")
    //           )
    //       }
    //     })
    //   ),
    //   dependencies: [NodeHttpClient.layer]
    // }) {}
    // #end

    const program = pipe(JokeService, Effect.flatMap((jokes) => jokes.getRandom()))
    await expect(Effect.runPromise(pipe(program, Effect.provide(JokeService.Default)))).resolves.toEqual(
      expect.any(String)
    )
  })

  it.skip("Easily testing services", async () => {
    class JokeService extends Effect.Service<JokeService>()("JokeService", {
      effect: pipe(
        HttpClient.HttpClient,
        Effect.map((client) => {
          return {
            getRandom: () =>
              pipe(
                client.get("https://api.chucknorris.io/jokes/random"),
                Effect.flatMap((response) => response.json),
                Effect.map((joke) => (joke as { value: string }).value),
                Effect.orElseSucceed(() => "No jokes for today")
              )
          }
        })
      ),
      dependencies: [NodeHttpClient.layer]
    }) {}

    // #start
    const JokeServiceTest = TODO
    // #solution
    // const ClientTest = Layer.mock(
    //   HttpClient.HttpClient,
    //   {
    //     get: () => Effect.fail(undefined)
    //   } as any
    // )
    // const JokeServiceTest = pipe(JokeService.DefaultWithoutDependencies, Layer.provide(ClientTest))
    // #end

    const program = pipe(JokeService, Effect.flatMap((jokes) => jokes.getRandom()))
    await expect(Effect.runPromise(pipe(program, Effect.provide(JokeServiceTest)))).resolves
      .toEqual("No jokes for today")
  })
})
