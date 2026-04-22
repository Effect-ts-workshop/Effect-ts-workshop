---
sidebar_position: 3
---

# Railway Pattern

## L'analogie du train

Imaginez un réseau ferroviaire avec deux voies parallèles :

```
                    ✅ Voie du succès ──────────────────────→ résultat final
                   /
Entrée ──────────<
                   \
                    ❌ Voie de l'erreur ─────────────────────→ erreur typée
```

Un Effect voyage toujours sur l'une des deux voies. Le type `Effect<A, E>` dit :

- Voie du succès → produit une valeur de type `A`
- Voie erreur → transporte une erreur de type `E`

## Aiguillage automatique

Quand vous chaînez des Effects, Effect gère automatiquement l'aiguillage.

Si un Effect est sur la voie d'erreur, les transformations suivantes sont **ignorées** :

<!-- prettier-ignore -->
```typescript
const result = pipe(
  divide(10, 0), // ❌ Erreur → DivisionByZero
  Effect.map((n) => n * 100), // Ignoré - on est sur la voie erreur
  Effect.map((n) => n + 1),   // Ignoré - idem
  Effect.map((n) => String(n)) // Ignoré - idem
)
// L'erreur DivisionByZero est propagée jusqu'à la fin
```

C'est exactement le comportement de `async/await` avec les Promesses - une exception ignore tous les `.then()` suivants.

## Changer de voie

### Voie succès → voie erreur

<!-- prettier-ignore -->
```typescript
Effect.fail(new MyError())   // Bascule sur la voie erreur
```

### Voie erreur → voie succès

<!-- prettier-ignore -->
```typescript
Effect.catchTag("MyError", () => Effect.succeed(recoveryValue))
// Bascule sur la voie succès avec une valeur de récupération
```

### Voie erreur → voie erreur (différente)

<!-- prettier-ignore -->
```typescript
Effect.catchTag("ErrorA", () => Effect.fail(new ErrorB()))
// Reste sur la voie erreur, mais avec un type d'erreur différent
```

## Visualisation complète

```
divide(10, 2)
   ✅ → 5

divide(10, 0)
   ❌ → DivisionByZero

pipe(
  divide(10, 0),
  Effect.catchTag("DivisionByZero", () => Effect.succeed(0))
)
   ❌ → DivisionByZero
     ↓ catchTag
   ✅ → 0
```

## Pourquoi c'est utile ?

Le Railway Pattern rend la gestion d'erreurs **composable** et **prévisible** :

1. **Composable** : Chaque fonction gère ses propres erreurs. Les fonctions s'assemblent sans `try/catch` imbriqués.

2. **Exhaustif** : TypeScript vérifie que vous gérez toutes les erreurs déclarées. Rien n'est oublié silencieusement.

3. **Lisible** : Le cas nominal (_happy path_) est visible directement. Les erreurs sont gérées séparément, sans polluer la logique principale.

<!-- prettier-ignore -->
```typescript
// Code Effect - logique principale et erreurs bien séparées
const createOrder = (userId: string, articleId: string) =>
  pipe(
    Effect.gen(function*() {
      const user = yield* getUser(userId)              // peut échouer
      const article = yield* getArticle(articleId)     // peut échouer
      const order = yield* validateOrder(user, article) // peut échouer
      return yield* saveOrder(order)
    }),
    Effect.catchTags({
      UserNotFound: () => Effect.fail(new ImpossibleOrder("Utilisateur inconnu")),
      ItemNotFound: () => Effect.fail(new ImpossibleOrder("Article indisponible")),
      InsufficientStock: () => Effect.fail(new ImpossibleOrder("Stock épuisé"))
    })
  )
```
