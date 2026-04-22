---
sidebar_position: 7
---

# Générateurs et Pipe

## `pipe` - composition de gauche à droite

`pipe` prend une valeur et la passe à travers une série de fonctions :

<!-- prettier-ignore -->
```typescript
import { pipe } from "effect";

const result = pipe(
  initialValue,
  transform1,
  transform2,
  transform3
);

// Équivalent à :
const result = transform3(transform2(transform1(initialValue)));
```

`pipe` se lit de haut en bas, dans l'ordre d'exécution. C'est plus lisible que l'imbrication.

## La fonction `pipe`

`pipe` est la façon standard de composer des transformations Effect :

<!-- prettier-ignore -->
```typescript
import { pipe } from "effect"

const result = pipe(
  myEffect,
  Effect.map((n) => n * 2),
  Effect.catchTag("MyError", () => Effect.succeed(0))
)
```

La plupart des fonctions Effect ont une signature **curryfiée** - les paramètres autres que la valeur à traiter sont _appliqués partiellement_ - elles attendent donc la valeur en dernier, ce qui les rend directement utilisables dans `pipe` :

<!-- prettier-ignore -->
```typescript
Effect.map(myEffect, (n) => n * 2)       // data-first (rare)
pipe(myEffect, Effect.map((n) => n * 2)) // data-last dans pipe (standard)
```

## `Effect.gen` - générateurs

`Effect.gen` permet d'écrire des Effects avec la syntaxe générateur JavaScript (`function*` et `yield*`), similaire à `async/await` :

<!-- prettier-ignore -->
```typescript
// Avec pipe et flatMap
const result = pipe(
  fetchUser(id),
  Effect.flatMap((user) => fetchOrders(user.id))
)

// Avec Effect.gen - plus lisible pour les chaînes longues
const result = Effect.gen(function* () {
  const user = yield* fetchUser(id);
  const orders = yield* fetchOrders(user.id);
  return { user, orders };
});
```

### `yield*` fait deux choses

1. **Extrait la valeur** : `const valeur = yield* Effect.succeed(42)` → `valeur = 42`
2. **Propage les erreurs** : si l'Effect échoue, l'erreur descend le canal (rail) d'erreur sans interrompre votre code

### Équivalences

<!-- prettier-ignore -->
```typescript
// pipe + flatMap
pipe(a, Effect.flatMap((valueA) => pipe(b, Effect.flatMap((valueB) => ...))))

// Effect.gen - identique mais lisible
Effect.gen(function* () {
  const valueA = yield* a;
  const valueB = yield* b;
  // ...
})
```

## `Effect.fn` - fonctions nommées avec traçage

`Effect.fn` est un wrapper autour d'`Effect.gen` qui ajoute :

- Un **nom** pour les messages d'erreur et le débogage
- Un **span OpenTelemetry** pour le traçage distribué

<!-- prettier-ignore -->
```typescript
// Effect.gen - sans traçage
const fetchUser = (id: string) =>
  Effect.gen(function* () {
    // ...
  });

// Effect.fn - avec traçage automatique
const fetchUser = Effect.fn("fetchUser")(function* (id: string) {
  // ...
});
```

La syntaxe est légèrement différente : les arguments vont dans la fonction générateur, pas à l'extérieur.

## Choisir entre pipe, Effect.gen et Effect.fn

| Situation                          | Recommandation                    |
| ---------------------------------- | --------------------------------- |
| 1-2 transformations simples        | `pipe`                            |
| Logique avec plusieurs étapes      | `Effect.gen`                      |
| Fonctions en production            | `Effect.fn` (traçage)             |
| Gestion d'erreurs en fin de chaîne | `pipe(gen, Effect.catchTag(...))` |

En pratique, on mélange les deux styles. Le bloc logique avec `Effect.gen`/`Effect.fn`, la gestion d'erreurs avec `pipe` :

<!-- prettier-ignore -->
```typescript
const createOrder = pipe(
  Effect.fn("createOrder")(function*(userId: string, articleId: string) {
    const user = yield* getUser(userId)
    const article = yield* getArticle(articleId)
    return yield* validateAndSave(user, article)
  }),
  Effect.catchTags({
    UserNotFound: () => Effect.fail(new ImpossibleOrder()),
    ItemNotFound: () => Effect.fail(new ImpossibleOrder())
  })
)
```
