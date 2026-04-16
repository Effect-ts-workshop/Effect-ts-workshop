---
sidebar_position: 13
---

# Fibers et Concurrence

## Qu'est-ce qu'une Fiber ?

Un `Effect` est une description — il ne fait rien tant qu'il n'est pas exécuté. Quand on l'exécute, le runtime Effect crée une **Fiber** : un fil d'exécution léger (virtuel) qui traite le programme en cours.

```
Effect (description)  →  exécution  →  Fiber (fil actif)
```

Une Fiber possède :

- une **identité** unique
- un **état** (en cours, suspendue, terminée)
- un **résultat final** : `Exit<Success, Error>`

Même le code le plus simple s'exécute dans une Fiber — celle créée par `Effect.runPromise` ou `Effect.runSync`.

---

## `Effect.all` — exécuter en parallèle

:::warning[Le problème avec `Promise.all`]

`Promise.all` démarre toutes les Promises **simultanément**, sans aucun contrôle :

```typescript
// 1000 requêtes HTTP lancées en même temps — votre base de données vous déteste
await Promise.all(ids.map((id) => fetchUser(id)));
```

Dès que les Promises sont créées, elles s'exécutent. Il n'y a aucun moyen natif de limiter la concurrence. Pour contrôler ça, il faut une librairie externe comme `p-limit` :

```typescript
import pLimit from "p-limit";

const limit = pLimit(2); // max 2 en parallèle
await Promise.all(ids.map((id) => limit(() => fetchUser(id))));
```

C'est une solution, mais il faut penser à le gérer manuellement et le comportement par défaut peut être dangereux.

:::

### `Effect.all` avec contrôle natif

`Effect.all` exécute plusieurs Effects et attend tous les résultats :

<!-- prettier-ignore -->
```typescript
import { Effect } from "effect"

const program = pipe(
  Effect.all({
    users: fetchUsers(),
    products: fetchProducts(),
    config: loadConfig()
  }),
  // { users, products, config } — tous disponibles
)
```

Par défaut, les Effects s'exécutent **séquentiellement**. L'option `concurrency` contrôle le parallélisme :

<!-- prettier-ignore -->
```typescript
// Séquentiel (défaut)
yield* Effect.all([effect1, effect2, effect3])

// Tout en parallèle
yield* Effect.all(effects, { concurrency: "unbounded" })

// Limiter à 2 en parallèle
yield* Effect.all(effects, { concurrency: 2 })
```

`Effect.all` accepte aussi bien un tableau qu'un objet — la structure est préservée dans le résultat :

<!-- prettier-ignore -->
```typescript
const { list, single } = yield* Effect.all({
  list: getAllItems(),
  single: getItemById(id)
})
```

---

## `Effect.race` — le premier qui termine gagne

`Effect.race` lance deux Effects en parallèle et renvoie le résultat du plus rapide. L'autre est immédiatement interrompu.

<!-- prettier-ignore -->
```typescript
const result = yield* Effect.race(
  fastPath(),
  slowFallback()
)
```

Utile pour les timeouts :

<!-- prettier-ignore -->
```typescript
const withTimeout = yield* Effect.race(
  fetchData(),
  pipe(Effect.sleep("5 seconds"), Effect.flatMap(() => Effect.fail(new TimeoutError())))
)
```

---

## Manipulation de Fibers (patterns avancés)

Les APIs suivantes donnent un contrôle fin sur les Fibers. Pour la majorité des cas, `Effect.all` et `Effect.race` suffisent.

### `Effect.fork` — démarrer une fiber en arrière-plan

`Effect.fork` démarre un Effect dans une nouvelle Fiber **sans attendre son résultat**, pour récupérer ce résultat on utilisera `Fiber.join` :

<!-- prettier-ignore -->
```typescript
import { Effect, Fiber } from "effect"

const program = Effect.gen(function*() {
  const fiber = yield* Effect.fork(longTask()) // démarre immédiatement
  // ... on continue sans attendre longTask

  const result = yield* Fiber.join(fiber) // attend le résultat
  return result
})
```

Par défaut une Fiber enfant est automatiquement rattachée à la Fiber parente : si la parente se termine, l'enfant est interrompue.

### `Fiber.join` et `Fiber.await`

Deux façons d'attendre une Fiber :

<!-- prettier-ignore -->
```typescript
// join — extrait directement la valeur (ou propage l'erreur)
const value = yield* Fiber.join(fiber)
// Si la fiber a échoué → l'erreur remonte dans le programme courant

// await — retourne un Exit, sans propager d'erreur
const exit = yield* Fiber.await(fiber)
// Exit.Success<A> ou Exit.Failure<E> — on décide ensuite quoi faire
```

Utilisez `join` quand vous voulez le résultat directement. Utilisez `await` quand vous avez besoin de savoir _comment_ la fiber s'est terminée.

### `Fiber.interrupt` — arrêter une fiber

`Fiber.interrupt` arrête une Fiber proprement : les finalizers s'exécutent, les ressources sont libérées.

<!-- prettier-ignore -->
```typescript
import { Effect, Fiber, Exit } from "effect"

const program = Effect.gen(function*() {
  const fiber = yield* Effect.fork(neverEndingTask())

  // ...après un moment...
  const exit = yield* Fiber.interrupt(fiber)

  console.log(Exit.isInterrupted(exit)) // true
})
```

C'est une interruption **asynchrone** — pas du `kill` brutal. La fiber reçoit le signal d'interruption et se termine proprement, en respectant ses finalizers.

#### Propagation vers les Promises — `AbortSignal`

Quand une Fiber est interrompue, Effect annule automatiquement l'`AbortSignal` passé à `Effect.tryPromise` :

<!-- prettier-ignore -->
```typescript
Effect.tryPromise({
  try: (signal) => fetch(url, { signal }),
  //        ^
  //   signal fourni par Effect — annulé à l'interruption
  catch: (e) => new NetworkError({ error: e })
})
```

La `Promise` reçoit l'événement `abort` et peut se nettoyer. Sans ça, la requête continuerait en arrière-plan même si la Fiber est arrêtée.

### `Effect.runFork` — exécuter au point d'entrée

`Effect.runFork` est le pendant de `Effect.runPromise` pour les Fibers :

<!-- prettier-ignore -->
```typescript
import { Effect, Fiber } from "effect"

// Démarre l'exécution, retourne une Fiber
const fiber = Effect.runFork(program)

// Plus tard, attendre le résultat
const exit = await Effect.runPromise(Fiber.await(fiber))
```

`Effect.runFork` et `Fiber.interrupt` sont utilisé dans l'exercice 3 pour démarrer puis interrompre une Fiber dans les tests.

### Supervision automatique

Par défaut (`Effect.fork`), les Fibers enfants sont supervisées par leur parent. Quand la Fiber parente se termine (succès, erreur, ou interruption), toutes ses Fibers enfants sont interrompues automatiquement. Avec `Effect.forkDaemon`, `Effect.forkScoped` ou `Effect.forkIn` les Fiber enfant ne sont pas supervisées et ont une durée de vie indépendant de la Fibre parente.

<!-- prettier-ignore -->
```typescript
// Fiber démon — échappe à la supervision
const fiber = yield* Effect.forkDaemon(backgroundTask())
// backgroundTask() continue même si le parent se termine
```

:::warning Pas de fuite de Fiber
Avec la supervision par défaut (`Effect.fork`), vous ne pouvez pas créer de Fibers "fantômes" qui continuent après la fin du programme. C'est une garantie de sécurité importante.

Si vous utilisez `forkDaemon`, assurez-vous d'avoir une stratégie pour arrêter la Fiber.
:::

---

## Récapitulatif

| API                         | Rôle                                              |
| --------------------------- | ------------------------------------------------- |
| `Effect.all(effects)`       | Attend tous les résultats (séquentiel par défaut) |
| `Effect.race(a, b)`         | Le plus rapide gagne, l'autre est interrompu      |
| `Effect.fork(effect)`       | Démarre une Fiber enfant                          |
| `Effect.runFork(effect)`    | Démarre une Fiber au point d'entrée               |
| `Fiber.join(fiber)`         | Attend le résultat, propage les erreurs           |
| `Fiber.await(fiber)`        | Attend la terminaison, retourne un `Exit`         |
| `Fiber.interrupt(fiber)`    | Interrompt proprement (finalizers exécutés)       |
| `Effect.forkDaemon(effect)` | Fiber non supervisée                              |
