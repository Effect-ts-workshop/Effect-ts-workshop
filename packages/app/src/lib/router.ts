import {
  type AnyRouter,
  redirect as baseRedirect,
  type RedirectOptions,
  type RegisteredRouter
} from "@tanstack/react-router"
import { Effect } from "effect"

export function redirect<
  TRouter extends AnyRouter = RegisteredRouter,
  TFrom extends string = string,
  TTo extends string | undefined = undefined,
  TMaskFrom extends string = TFrom,
  TMaskTo extends string = "."
>(opts: RedirectOptions<TRouter, TFrom, TTo, TMaskFrom, TMaskTo>) {
  return () => {
    throw baseRedirect(opts)
    return Effect.die("redirect")
  }
}

export function effectLoader<A, E>(self: Effect.Effect<A, E>, abortController: AbortController) {
  return Effect.runPromise(self, { signal: abortController.signal })
}
