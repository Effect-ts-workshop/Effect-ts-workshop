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

- Voie succès → produit une valeur `A`
- Voie erreur → transporte une erreur `E`

## Aiguillage automatique

Quand vous chaînez des Effects, Effect gère automatiquement l'aiguillage.

Si un Effect est sur la voie d'erreur, les transformations suivantes sont **ignorées** :

<!-- prettier-ignore -->
```typescript
const résultat = pipe(
  diviser(10, 0), // ❌ Erreur → DivisionParZéro
  Effect.map((n) => n * 100), // Ignoré — on est sur la voie erreur
  Effect.map((n) => n + 1),   // Ignoré — idem
  Effect.map((n) => String(n)) // Ignoré — idem
)
// L'erreur DivisionParZéro est propagée jusqu'à la fin
```

C'est exactement le comportement de `async/await` avec les Promises — une exception ignore tous les `.then()` suivants.

## Changer de voie

### Voie succès → voie erreur

<!-- prettier-ignore -->
```typescript
Effect.fail(new MonErreur())   // Bascule sur la voie erreur
```

### Voie erreur → voie succès

<!-- prettier-ignore -->
```typescript
Effect.catchTag("MonErreur", () => Effect.succeed(valeurDeRécupération))
// Bascule sur la voie succès avec une valeur de récupération
```

### Voie erreur → voie erreur (différente)

<!-- prettier-ignore -->
```typescript
Effect.catchTag("ErreurA", () => Effect.fail(new ErreurB()))
// Reste sur la voie erreur, mais avec un type d'erreur différent
```

## Visualisation complète

```
diviser(10, 2)
   ✅ → 5

diviser(10, 0)
   ❌ → DivisionParZéro

pipe(
  diviser(10, 0),
  Effect.catchTag("DivisionParZéro", () => Effect.succeed(0))
)
   ❌ → DivisionParZéro
     ↓ catchTag
   ✅ → 0
```

## Pourquoi c'est utile ?

Le Railway Pattern rend la gestion d'erreurs **composable** et **prévisible** :

1. **Composable** : Chaque fonction gère ses propres erreurs. Les fonctions s'assemblent sans `try/catch` imbriqués.

2. **Exhaustif** : TypeScript vérifie que vous gérez toutes les erreurs déclarées. Rien n'est oublié silencieusement.

3. **Lisible** : Le chemin heureux est visible directement. Les erreurs sont gérées séparément, sans polluer la logique principale.

<!-- prettier-ignore -->
```typescript
// Code Effect — logique principale et erreurs bien séparées
const créerCommande = (userId: string, articleId: string) =>
  pipe(
    Effect.gen(function*() {
      const utilisateur = yield* getUtilisateur(userId)  // peut échouer
      const article = yield* getArticle(articleId)        // peut échouer
      const commande = yield* validerCommande(utilisateur, article) // peut échouer
      return yield* sauvegarderCommande(commande)
    }),
    Effect.catchTags({
      UtilisateurNonTrouvé: () => Effect.fail(new CommandeImpossible("Utilisateur inconnu")),
      ArticleNonTrouvé: () => Effect.fail(new CommandeImpossible("Article indisponible")),
      StockInsuffisant: () => Effect.fail(new CommandeImpossible("Stock épuisé"))
    })
  )
```
