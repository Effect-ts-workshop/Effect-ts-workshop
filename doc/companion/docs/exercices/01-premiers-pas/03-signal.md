---
sidebar_position: 3
---

# Exercice 3 — Interruption et Fibers

## Les Fibers : des fils d'exécution légers

Dans Effect, un **Fiber** est une unité d'exécution légère — l'équivalent d'un thread, mais géré par le runtime Effect plutôt que par le système d'exploitation.

Quand on lance un Effect avec `Effect.runSync` ou `Effect.runPromise`, on attend le résultat avant de continuer. Avec `Effect.runFork`, l'Effect démarre **en arrière-plan** et on reçoit immédiatement une référence vers le Fiber :

```typescript
import { Effect, Fiber } from "effect"

const fiber = Effect.runFork(monEffect)
// fiber est déjà en cours d'exécution, mais on n'attend pas son résultat
```

On peut ensuite :
- Attendre son résultat avec `Fiber.join(fiber)`
- L'interrompre avec `Fiber.interrupt(fiber)`

## L'interruption : une annulation propre

`Fiber.interrupt` n'est pas un `kill` brutal. Effect utilise un mécanisme d'**AbortSignal** pour signaler l'annulation aux opérations en cours. La valeur de retour est un `Exit` qui décrit comment le Fiber s'est terminé :

```typescript
import { Effect, Fiber, Exit } from "effect"

const fiber = Effect.runFork(monEffectLong)

// Quelque temps plus tard…
const exit = await Effect.runPromise(Fiber.interrupt(fiber))

if (Exit.isInterrupted(exit)) {
  console.log("Le fiber a été interrompu proprement")
}
```

## La propagation automatique de l'AbortSignal

Quand on utilise `Effect.tryPromise`, Effect passe automatiquement un `AbortSignal` à la fonction `try`. Ce signal est lié au cycle de vie du Fiber : quand le Fiber est interrompu, le signal déclenche l'annulation de la `Promise` sous-jacente.

```typescript
const monFetch = Effect.tryPromise({
  try: (signal) => fetch("https://example.com/data", { signal }),
  //               ↑ ce signal est géré par Effect
  catch: (e) => new Error(String(e))
})
```

Si le Fiber qui exécute `monFetch` est interrompu, le `fetch` en cours sera annulé par le navigateur ou Node.js via l'`AbortSignal`.

## Exercice

Vérifiez que l'interruption d'un Fiber annule bien la requête HTTP en cours.

Fichier de test : `packages/api/_exercices/3-signal.spec.ts`

```typescript
it("Aborts fetch on interrupt", async () => {
  // 1. Créez un Effect qui fait un fetch (utilisez Effect.tryPromise avec le signal)
  // 2. Lancez-le comme un Fiber avec Effect.runFork
  // 3. Interrompez immédiatement le Fiber avec Fiber.interrupt
  // 4. Vérifiez que l'exit est bien interrompu avec Exit.isInterrupted
})
```

:::tip Ressources

- [Fibers dans la doc Effect](https://effect.website/docs/concurrency/fibers)

:::

## Indice 1

<details>
  <summary>Comment créer un Effect qui peut être annulé via AbortSignal ?</summary>

`Effect.tryPromise` passe automatiquement un `AbortSignal` à votre fonction :

```typescript
const program = Effect.tryPromise({
  try: (signal) => fetch("https://api.example.com/data", { signal }),
  catch: (e) => e
})
```

Si le Fiber est interrompu, le `signal` passera en état "aborted" et le `fetch` sera annulé.

</details>

## Indice 2

<details>
  <summary>Comment lancer un Effect en arrière-plan et l'interrompre ?</summary>

```typescript
import { Effect, Fiber } from "effect"

// Lancer en arrière-plan
const fiber = Effect.runFork(program)

// Interrompre et attendre la confirmation
const exit = await Effect.runPromise(Fiber.interrupt(fiber))
```

`Fiber.interrupt` retourne lui-même un `Effect` qui se résout quand l'interruption est confirmée.

</details>

## Solution

<details>
  <summary>Avant de déplier, essayez encore ! Les indices sont là pour vous aider.</summary>

```typescript
import { Effect, Exit, Fiber } from "effect"

it("Aborts fetch on interrupt", async () => {
  // Given
  const program = Effect.tryPromise({
    try: (signal) =>
      fetch("https://api.chucknorris.io/jokes/random", { signal }),
    catch: (e) => e
  })

  // When
  const fiber = Effect.runFork(program)
  const exit = await Effect.runPromise(Fiber.interrupt(fiber))

  // Then
  expect(Exit.isInterrupted(exit)).toBe(true)
})
```

**Ce qui se passe :**
1. `Effect.runFork` démarre le fetch en arrière-plan et retourne un `Fiber`
2. `Fiber.interrupt` envoie un signal d'interruption au Fiber
3. L'`AbortSignal` transmis au `fetch` déclenche l'annulation de la requête HTTP
4. Le Fiber se termine avec un `Exit.Failure` de type `Interrupted`

</details>
