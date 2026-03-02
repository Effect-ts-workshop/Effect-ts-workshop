import { Atom, Registry, Result } from "@effect-atom/atom-react"

export const AppRegistry = Registry.make({
  defaultIdleTTL: 400
})

export function getResultAtom<T, E>(
  atom: Atom.Atom<Result.Result<T, E>>
) {
  return Registry.getResult(atom)(AppRegistry)
}
