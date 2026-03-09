---
sidebar_position: 7
---

# Générateurs et Pipe

## `pipe` — composition de gauche à droite

`pipe` prend une valeur et la passe à travers une série de fonctions :

```typescript
import { pipe } from "effect";

const résultat = pipe(
  valeurInitiale,
  transformation1,
  transformation2,
  transformation3
);

// Équivalent à :
const résultat = transformation3(transformation2(transformation1(valeurInitiale)));
```

`pipe` se lit de haut en bas, dans l'ordre d'exécution. C'est plus lisible que l'imbrication.

## La méthode `.pipe()`

Effect fournit `.pipe()` directement sur les objets Effect (et Option, Stream, etc.) :

```typescript
const résultat = monEffect.pipe(
  Effect.map((n) => n * 2),
  Effect.catchTag("MonErreur", () => Effect.succeed(0))
);

// Identique à :
const résultat = pipe(
  monEffect,
  Effect.map((n) => n * 2),
  Effect.catchTag("MonErreur", () => Effect.succeed(0))
);
```

## La Dual API

La plupart des fonctions Effect ont une **double signature** :

```typescript
// Forme "data-first" — l'Effect est le premier argument
Effect.map(monEffect, (n) => n * 2)

// Forme "data-last" (curryée) — parfaite pour pipe
monEffect.pipe(Effect.map((n) => n * 2))
```

Les deux font la même chose. La forme curryée est utilisée dans `.pipe()`.

## `Effect.gen` — générateurs

`Effect.gen` permet d'écrire des Effects avec la syntaxe générateur JavaScript (`function*` et `yield*`), similaire à `async/await` :

```typescript
// Avec pipe et flatMap
const résultat = fetchUser(id).pipe(
  Effect.flatMap((user) => fetchOrders(user.id))
);

// Avec Effect.gen — plus lisible pour les chaînes longues
const résultat = Effect.gen(function* () {
  const user = yield* fetchUser(id);
  const orders = yield* fetchOrders(user.id);
  return { user, orders };
});
```

### `yield*` fait deux choses

1. **Extrait la valeur** : `const valeur = yield* Effect.succeed(42)` → `valeur = 42`
2. **Propage les erreurs** : si l'Effect échoue, l'erreur remonte sur le rail d'erreur sans interrompre votre code

### Équivalences

```typescript
// pipe + flatMap
a.pipe(Effect.flatMap((va) => b.pipe(Effect.flatMap((vb) => ...))))

// Effect.gen — identique mais lisible
Effect.gen(function* () {
  const va = yield* a;
  const vb = yield* b;
  // ...
})
```

## `Effect.fn` — fonctions nommées avec traçage

`Effect.fn` est un wrapper autour d'`Effect.gen` qui ajoute :
- Un **nom** pour les messages d'erreur et le débogage
- Un **span OpenTelemetry** pour le traçage distribué

```typescript
// Effect.gen — sans traçage
const fetchUser = (id: string) =>
  Effect.gen(function* () {
    // ...
  });

// Effect.fn — avec traçage automatique
const fetchUser = Effect.fn("fetchUser")(function* (id: string) {
  // ...
});
```

La syntaxe est légèrement différente : les arguments vont dans la fonction générateur, pas à l'extérieur.

## Choisir entre pipe et Effect.gen

| Situation | Recommandation |
|-----------|---------------|
| 1-2 transformations simples | `pipe` ou `.pipe()` |
| Logique avec plusieurs étapes | `Effect.gen` |
| Fonctions en production | `Effect.fn` (traçage) |
| Gestion d'erreurs en fin de chaîne | `.pipe(Effect.catchTag(...))` |

En pratique, on mélange les deux styles. Le bloc logique avec `Effect.gen`, la gestion d'erreurs avec `.pipe()` :

```typescript
const créerCommande = Effect.fn("créerCommande")(function* (
  userId: string,
  articleId: string
) {
  const user = yield* getUser(userId);
  const article = yield* getArticle(articleId);
  return yield* validerEtSauvegarder(user, article);
}).pipe(
  Effect.catchTags({
    UserNonTrouvé: () => Effect.fail(new CommandeImpossible()),
    ArticleNonTrouvé: () => Effect.fail(new CommandeImpossible()),
  })
);
```
