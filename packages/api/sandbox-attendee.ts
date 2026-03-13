import { Data, Effect, pipe } from "effect"
import type { fetch as baseFetch, Response } from "undici"

// Contexte
// Nous travaillons travailles sur une API qui gère l'affichage d'items.
// Ici tu dois créer un système d'erreurs typées avec TaggedError pour gérer proprement les différents cas d'erreur.
// Cas 1 : Les erreurs réseau, qui sont explicitées par le message "NetworkError"
export class NetworkError extends Data.TaggedError("?? To Do explicit tag ??")<{ error: unknown }> {}
// Cas 2 : Les erreurs http, qui sont explicitées par le message "HTTPResponseError"
export class HTTPResponseError extends Data.TaggedError("?? To Do explicit tag ??")<{ response: Response }> {}

type Fetch = (
  ...args: Parameters<typeof baseFetch>
) => Effect.Effect<Response, NetworkError | HTTPResponseError>

const fetch: Fetch = (_input, _init) => {
  throw new Error("Please implement to do below")
  // return pipe(
  // TODO: utiliser Effect.tryPromise pour encapsuler baseFetch les erreurs catchées sont de type NetworkError
  // TODO: utiliser Effect.filterOrFail pour transformer les réponses non-ok en HTTPResponseError
  // )
}

export const getJoke = () =>
  pipe(
    fetch("https://api.chucknorris.io/jokes/random"),
    Effect.flatMap((a) => Effect.tryPromise(() => a.json())),
    Effect.map((a) => String((a as any).value))
  )
