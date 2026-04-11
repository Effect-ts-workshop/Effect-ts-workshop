---
sidebar_position: 2
---

# Erreurs et Défauts

## Deux types d'échecs

Effect distingue deux catégories d'échecs radicalement différentes.

### Erreurs (Failures)

Des échecs **attendus et typés**. Ils font partie du contrat de la fonction.

<!-- prettier-ignore -->
```typescript
class ArticleNonTrouvé extends Data.TaggedError("ArticleNonTrouvé")<{
  id: string;
}> {}

// Le type dit clairement : "peut échouer avec ArticleNonTrouvé"
const getArticle = (id: string): Effect.Effect<Article, ArticleNonTrouvé> =>
  // ...
```

- Apparaissent dans le **type** (`Effect<A, MonErreur>`)
- Récupérables avec `Effect.catchTag`, `Effect.catchTags`, `Effect.catchAll`
- Représentent des cas **normaux** (utilisateur non trouvé, fichier absent, accès refusé)

### Défauts (Defects)

Des bugs **inattendus et non typés**. Ils ne devraient jamais se produire.

<!-- prettier-ignore -->
```typescript
// NullPointerException, StackOverflow, etc.
const monEffect = Effect.promise(() => operationQuiPeutBugger());
// Si ça lance une exception → Défaut (invisible dans le type)
```

- **Invisibles** dans le type (`Effect<A>` même si ça peut bugger)
- Non récupérables avec `catchTag` (pas dans le type)
- Récupérables seulement avec `Effect.catchAllDefect` (traitement d'urgence)
- Représentent des bugs à **corriger**, pas à gérer

## Créer des erreurs typées

<!-- prettier-ignore -->
```typescript
import { Data } from "effect";

// Erreur sans données additionnelles
class ErreurSimple extends Data.TaggedError("ErreurSimple")<{}> {}

// Erreur avec données
class ErreurAvecMessage extends Data.TaggedError("ErreurAvecMessage")<{
  message: string;
  code: number;
}> {}

// Utilisation
const erreur = new ErreurAvecMessage({ message: "Oops", code: 500 });
console.log(erreur.message); // "Oops"
console.log(erreur._tag);    // "ErreurAvecMessage"
```

## Récupérer des erreurs

### `Effect.catchTag` — une erreur spécifique

<!-- prettier-ignore -->
```typescript
const sûr = pipe(
  monEffect,
  Effect.catchTag("ArticleNonTrouvé", (erreur) => {
    // erreur.id est disponible (type sûr !)
    return Effect.succeed(null)
  })
)
```

### `Effect.catchTags` — plusieurs erreurs

<!-- prettier-ignore -->
```typescript
const sûr = pipe(
  monEffect,
  Effect.catchTags({
    ArticleNonTrouvé: (e) => Effect.succeed(null),
    ErreurRéseau: (e) => Effect.fail(new ErreurServeur())
  })
)
```

### `Effect.catchAll` — toutes les erreurs

<!-- prettier-ignore -->
```typescript
const sûr = pipe(
  monEffect,
  Effect.catchAll((_erreur) => Effect.succeed(valeurParDéfaut))
)
```

:::warning
`Effect.catchAll` masque les erreurs que vous n'avez pas prévues. Utilisez-le avec parcimonie.
:::

## Le tag — l'identifiant de l'erreur

Le tag est la chaîne passée à `Data.TaggedError("MonTag")`. Effect l'utilise pour :

1. Identifier précisément le type d'erreur dans `catchTag`
2. Afficher un message d'erreur lisible

<!-- prettier-ignore -->
```typescript
class MonErreur extends Data.TaggedError("MonErreur")<{}> {}

const e = new MonErreur();
console.log(e._tag); // "MonErreur"
```

:::tip Convention de nommage
Donnez des noms **descriptifs** et **spécifiques** à vos erreurs. Évitez les noms génériques comme `Error` ou `Exception`.

✅ `ArticleNonTrouvé`, `AccèsRefusé`, `FormatInvalide`
❌ `Erreur`, `Problème`, `Bug`
:::
