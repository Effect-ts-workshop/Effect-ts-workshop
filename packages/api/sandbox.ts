import { Arbitrary, Data, Effect, FastCheck, pipe, Schema } from "effect"
import type { Response } from "undici"
import { fetch as baseFetch } from "undici"

export class NetworkError extends Data.TaggedError("NetworkError")<{ error: unknown }> {}

export class HTTPResponseError extends Data.TaggedError("HTTPResponseError")<{ response: Response }> {}

type Fetch = (
  ...args: Parameters<typeof baseFetch>
) => Effect.Effect<Response, NetworkError | HTTPResponseError>
const fetch: Fetch = (input, init) =>
  pipe(
    Effect.tryPromise({
      try: (signal) =>
        baseFetch(input, {
          signal,
          ...init
        }),
      catch: (error) => new NetworkError({ error })
    }),
    Effect.filterOrFail(
      (response) => response.ok,
      (response) => new HTTPResponseError({ response })
    )
  )

export const getJoke = () =>
  pipe(
    fetch("https://api.chucknorris.io/jokes/random"),
    Effect.flatMap((a) => Effect.tryPromise(() => a.json())),
    Effect.map((a) => String((a as any).value))
  )

export const TeamSchema = Schema.Struct({
  name: Schema.String,
  score: Schema.Number,
  teamMates: Schema.Array(Schema.Struct({
    name: Schema.String
  })),
  color: Schema.Literal("red", "blue", "green")
})

export const DESCRIBE_ME = Schema.Struct({})

export const validateTeam = (team: unknown) => pipe(team, Schema.decodeUnknownSync(TeamSchema))

export const createObjectMatching = <A>(schema: Schema.Schema<A>): A => FastCheck.sample(Arbitrary.make(schema), 0)[0]
