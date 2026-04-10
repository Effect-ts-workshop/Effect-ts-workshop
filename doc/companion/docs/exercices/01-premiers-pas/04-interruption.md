---
sidebar_position: 4
---

# Exercice 4 — Nettoyage des ressources

Dans l'exercice 3, vous avez vu comment interrompre une Fiber et annuler un `fetch` via l'`AbortSignal`. Mais que se passe-t-il avec les ressources qui ne sont pas des Promises — une connexion base de données, un fichier temporaire, un lock Redis ?

Effect a une réponse : le **Scope**.

## Le Scope : un cycle de vie garanti

Un `Scope` est un conteneur qui enregistre des actions de nettoyage. Quand le Scope se ferme — que ce soit après un succès, une erreur ou une interruption — **toutes les actions enregistrées s'exécutent**, dans l'ordre inverse d'enregistrement.

```
Scope ouvert
  → on enregistre les cleanups
  → on fait notre travail
Scope fermé (succès / erreur / interruption)
  → cleanup N exécuté
  → cleanup N-1 exécuté
  → ...
```

C'est l'équivalent d'un `try/finally` garanti, composable, et automatiquement propagé aux Fibers enfants.

## `Effect.addFinalizer` — cleanup ad-hoc

`Effect.addFinalizer` enregistre une action dans le Scope courant. Elle sera exécutée à la fermeture du Scope, quoi qu'il arrive.

```typescript
import { Effect } from "effect"

const program = Effect.gen(function* () {
  const conn = openConnection()

  yield* Effect.addFinalizer(() =>
    Effect.sync(() => conn.close())
  )

  // ... utiliser conn
  // conn.close() sera appelé quoi qu'il arrive
})
```

:::info Le paramètre `exit`
`addFinalizer` peut recevoir un `exit` qui décrit **comment** le programme s'est terminé. Utile pour des comportements différents selon le résultat (ex. : commit ou rollback).

```typescript
yield* Effect.addFinalizer((exit) =>
  Exit.isSuccess(exit)
    ? Effect.sync(() => tx.commit())
    : Effect.sync(() => tx.rollback())
)
```
:::

## `Effect.scoped` — créer et fermer un Scope

`Effect.scoped` crée un Scope, exécute le programme, puis ferme le Scope :

```typescript
// scoped() ouvre le Scope → exécute program → ferme le Scope
await Effect.runPromise(Effect.scoped(program))
```

Sans `Effect.scoped`, le Scope reste ouvert. C'est ce qui vous permet de partager des ressources entre plusieurs operations avant de les libérer.

## `Effect.acquireRelease` — la paire acquire/release

Quand l'acquisition et le cleanup sont **logiquement liés**, `Effect.acquireRelease` est plus explicite qu'`addFinalizer` :

```typescript
const resource = Effect.acquireRelease(
  // acquire : ouvrir la ressource
  Effect.sync(() => openConnection()),
  // release : toujours exécuté, même en cas d'erreur ou d'interruption
  (conn) => Effect.sync(() => conn.close())
)

const program = Effect.gen(function* () {
  const conn = yield* resource
  return yield* conn.query("SELECT 1")
})

await Effect.runPromise(Effect.scoped(program))
```

Le `release` est garanti de s'exécuter dans trois situations :
- ✅ Succès normal
- ❌ Erreur (Effect.fail)
- ⚡ Interruption de la Fiber

## Comparaison des deux approches

| | `addFinalizer` | `acquireRelease` |
|---|---|---|
| Usage | cleanup dans un `gen`, souvent conditionnel | paire acquire/release explicite |
| Lisibilité | proche de `try/finally` | modélise une ressource |

`acquireRelease` est préférable quand vous modélisez une ressource avec un cycle d'ouverture/fermeture clair. `addFinalizer` est plus souple pour du cleanup conditionnel en cours de programme.

## Exercice

Fichier de test : `packages/api/_exercices/3-interruption.spec.ts`

Les tests couvrent quatre scénarios :

1. **AbortSignal** — l'interruption d'une Fiber annule un `fetch` via l'`AbortSignal` (revu de l'exercice 3)
2. **addFinalizer + connexion** — fermer une connexion même si une requête échoue
3. **addFinalizer + lock distribué** — libérer un lock Redis même si le job est interrompu
4. **acquireRelease** — garantir le `release` après un succès, une erreur et une interruption

:::tip Ressources

- [Scope dans la doc Effect](https://effect.website/docs/resource-management/scope)
- [acquireRelease dans la doc Effect](https://effect.website/docs/resource-management/resource)

:::

## Indice 1

<details>
  <summary>Comment enregistrer un cleanup dans le Scope courant ?</summary>

```typescript
const program = Effect.gen(function* () {
  const ressource = yield* ouvrir()

  yield* Effect.addFinalizer(() =>
    Effect.sync(() => ressource.fermer())
  )

  return yield* utiliser(ressource)
})
```

Le finalizer s'exécutera quand le Scope se ferme — même si `utiliser(ressource)` échoue.

</details>

## Indice 2

<details>
  <summary>Comment créer et fermer un Scope automatiquement ?</summary>

`Effect.scoped` gère tout le cycle de vie :

```typescript
// Scoped crée un Scope, l'attache au programme, puis le ferme à la fin
await Effect.runPromise(Effect.scoped(program))
```

Le Scope se ferme même si le programme échoue ou si la Fiber est interrompue.

</details>

## Indice 3

<details>
  <summary>Comment écrire une paire acquire/release explicite ?</summary>

```typescript
const connection = Effect.acquireRelease(
  Effect.sync(() => db.connect()),       // acquire
  (conn) => Effect.sync(() => conn.close()) // release
)

const program = Effect.gen(function* () {
  const conn = yield* connection
  return yield* conn.query("SELECT 1")
})

// scoped() est toujours requis pour fermer le Scope
await Effect.runPromise(Effect.scoped(program))
```

</details>

## Solution

<details>
  <summary>Avant de déplier, essayez encore ! Les indices sont là pour vous aider.</summary>

**addFinalizer — connexion :**
```typescript
const program = Effect.gen(function* () {
  const conn = makeConnection(log)

  yield* Effect.addFinalizer(() =>
    Effect.sync(() => conn.close())
  )

  return yield* conn.query() // échoue → cleanup exécuté quand même
})

await Effect.runPromise(Effect.scoped(program)).catch(() => {})
// conn.close() a bien été appelé
```

**addFinalizer — lock distribué :**
```typescript
const longJob = Effect.gen(function* () {
  redis.locks.add("job:send-emails")

  yield* Effect.addFinalizer(() =>
    Effect.sync(() => redis.locks.delete("job:send-emails"))
  )

  yield* Effect.never // job long
})

const fiber = Effect.runFork(Effect.scoped(longJob))
await Effect.runPromise(Fiber.interrupt(fiber))
// lock libéré malgré l'interruption
```

**acquireRelease :**
```typescript
const resource = Effect.acquireRelease(
  Effect.sync(() => makeConnection(log)),
  (conn) => Effect.sync(() => conn.close())
)

const program = Effect.gen(function* () {
  const conn = yield* resource
  return yield* conn.query("SELECT 1")
})

// Cas interruption
const fiber = Effect.runFork(Effect.scoped(
  Effect.gen(function* () {
    yield* resource
    yield* Effect.never
  })
))
await Effect.runPromise(Fiber.interrupt(fiber))
// conn.close() a été appelé
```

</details>
