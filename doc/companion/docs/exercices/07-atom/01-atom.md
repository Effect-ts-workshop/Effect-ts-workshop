---
sidebar_position: 1
---

# Exercice 11 — Atom

## Le problème du state partagé

Dans une application React, `useState` gère l'état local d'un composant. Mais que se passe-t-il quand deux composants ont besoin du même état ?

```typescript
// Composant A
const [count, setCount] = useState(0)

// Composant B — aucun lien avec A
const [count, setCount] = useState(0) // copie indépendante !
```

On remonte l'état au parent commun ("lifting state up"), ce qui crée du prop drilling. Et pour les données asynchrones (requête API, base de données), `useState` ne gère pas les états `loading / success / error` proprement — on finit avec trois variables séparées et des `useEffect` fragiles.

## La solution : les Atoms

Un **Atom** est une unité de state réactive indépendante des composants. N'importe quel composant peut lire ou modifier un Atom, et tous les abonnés se mettent à jour automatiquement.

Dans l'exercice 10, vous avez utilisé `ApiClient.query(...)` et lu le résultat avec `useAtomValue`. Sous le capot, `ApiClient` crée automatiquement des **Atoms** pour chaque endpoint.

Un Atom est la brique de base du state management dans `@effect-atom/atom-react`. C'est l'équivalent d'un `signal` ou d'un `atom` (Jotai/Recoil) : une unité de state réactive qui notifie ses abonnés quand elle change.

## La Registry

Tous les Atoms vivent dans une **Registry**. C'est le conteneur global qui stocke les valeurs et gère les abonnements.

```typescript
import { Registry } from "@effect-atom/atom-react"

const r = Registry.make()
```

Dans une application React, la Registry est fournie par `<RegistryProvider>` (visible dans `packages/app/src/main.tsx`). Dans les tests unitaires, on la crée directement avec `Registry.make()`.

## Créer un Atom

### Valeur statique

```typescript
import { Atom } from "@effect-atom/atom-react"

const counter = Atom.make(0)   // Atom<number>

r.get(counter)     // → 0
r.set(counter, 1)
r.get(counter)     // → 1
```

### Valeur dérivée (computed)

Un Atom peut être calculé à partir d'autres Atoms. Il se met à jour automatiquement quand ses dépendances changent.

```typescript
const counter = Atom.make(0)
const doubled = Atom.make((get) => get(counter) * 2)

r.set(counter, 9)
r.get(doubled)  // → 18
```

`Atom.map` est un raccourci pour ce cas fréquent :

```typescript
const doubled = Atom.map(counter, (v) => v * 2)
```

### Atom depuis un Effect

Quand on passe un `Effect` à `Atom.make`, la valeur devient un `Result` — le même type que vous avez vu dans l'exercice 10 avec `useAtomValue`.

```typescript
const counter = Atom.make(Effect.succeed(2))

const value = r.get(counter)
// value est un Result<number, ...>

if (Result.isSuccess(value)) {
  console.log(value.value) // → 2
}
```

C'est exactement ce que fait `ApiClient.query(...)` : il crée un Atom depuis un Effect HTTP, et vous lisez son `Result` avec `useAtomValue`.

### Atom avec transformation (fnSync)

`Atom.fnSync` crée un Atom "callable" : on lui passe une fonction, et chaque appel à `r.set` exécute cette fonction avec la valeur passée pour produire la prochaine valeur.

```typescript
const increment = (count: number) => count + 1
const next = Atom.fnSync(increment, { initialValue: 0 })

r.set(next, 0)   // appelle increment(0) → 1
r.get(next)      // → 1
```

## S'abonner aux changements

`r.subscribe` notifie une callback à chaque changement de valeur :

```typescript
const counter = Atom.make(0)

r.subscribe(counter, (newValue) => {
  console.log("nouvelle valeur :", newValue)
})

r.set(counter, 9)  // → "nouvelle valeur : 9"
```

## Garder un Atom en vie : keepAlive

Par défaut, un Atom sans abonné peut être collecté par le garbage collector. `Atom.keepAlive` force sa persistance dans la Registry même sans abonné actif.

```typescript
const counter = pipe(Atom.make(0), Atom.keepAlive)

r.set(counter, 9)
await Promise.resolve()   // laisse le GC tourner

r.get(counter)  // → 9 (toujours là)
```

:::tip Quand utiliser keepAlive ?
Pour les Atoms qui doivent persister entre deux rendus React (ex. : un état global partagé entre plusieurs composants non montés simultanément).
:::

## Utiliser les Atoms dans React

### Lire une valeur : `useAtomValue`

```typescript
const atom = Atom.make(42)

function MonComposant() {
  const value = useAtomValue(atom)
  return <div>{value}</div>
}
```

Le composant se re-rend automatiquement quand l'Atom change.

### Lire et écrire : `useAtom`

```typescript
const counter = Atom.make(0)

function Compteur() {
  const [value, setValue] = useAtom(counter)
  return (
    <button onClick={() => setValue((v) => v + 1)}>
      {value}
    </button>
  )
}
```

`useAtom` retourne un tuple `[valeur, setter]`, identique au `useState` de React.

## Lien avec l'exercice 10

Dans l'exercice 10, `ApiClient.query("items", "getAllItems", ...)` crée en interne un Atom depuis un Effect HTTP. C'est pourquoi `useAtomValue` retourne un `Result` et non directement les données — c'est le même mécanisme que `Atom.make(Effect.succeed(2))` vu plus haut.

```
Atom.make(Effect.succeed(2))
                    ↕ même mécanique
ApiClient.query("items", "getAllItems", ...)
```

La seule différence : `ApiClient` gère aussi l'invalidation via `reactivityKeys` et les mutations.

## Exercice

Le fichier `11-atom.spec.tsx` contient des tests qui couvrent progressivement chaque concept de cette page.

**Objectif :** faire passer tous les tests en comprenant ce que chaque méthode fait — pas juste en devinant la syntaxe.

:::tip Ressources
- [`@effect-atom/atom-react` — documentation](https://effect-atom.dev)
- Exercice 10 — `ApiClient.query` et `AtomHttpApi.Tag`
:::

## Indice 1

<details>
  <summary>Registry et lecture/écriture basique</summary>

```typescript
const r = Registry.make()
const counter = Atom.make(0)

r.get(counter)        // lire
r.set(counter, 42)   // écrire
```

</details>

## Indice 2

<details>
  <summary>Atom dérivé avec get</summary>

Le callback reçoit une fonction `get` qui lit la valeur courante d'un autre Atom :

```typescript
const doubled = Atom.make((get) => get(counter) * 2)
```

À chaque fois que `counter` change, `doubled` est recalculé automatiquement.

</details>

## Indice 3

<details>
  <summary>Atom depuis un Effect → Result</summary>

```typescript
const data = Atom.make(Effect.succeed(42))
const value = r.get(data)  // Result<number, ...>

if (Result.isSuccess(value)) {
  value.value  // → 42
}
```

</details>

## Solution

<details>
  <summary>Avant de déplier, essayez encore ! Les indices sont là pour vous aider.</summary>

```typescript
import { Atom, Registry, Result, useAtom, useAtomValue } from "@effect-atom/atom-react"
import { Effect, pipe } from "effect"

const r = Registry.make()

// Valeur statique
const counter = Atom.make(0)
r.set(counter, 1)
r.get(counter)  // → 1

// Valeur dérivée
const doubled = Atom.map(counter, (v) => v * 2)
r.set(counter, 9)
r.get(doubled)  // → 18

// Depuis un Effect
const fromEffect = Atom.make(Effect.succeed(2))
const result = r.get(fromEffect)
Result.isSuccess(result) && result.value  // → 2

// fnSync
const increment = (n: number) => n + 1
const next = Atom.fnSync(increment, { initialValue: 0 })
r.set(next, 0)
r.get(next)  // → 1

// keepAlive
const persistent = pipe(Atom.make(0), Atom.keepAlive)
r.set(persistent, 9)
// → toujours disponible après un cycle de GC

// React
function Compteur() {
  const [value, setValue] = useAtom(counter)
  return <button onClick={() => setValue((v) => v + 1)}>{value}</button>
}
```

</details>
