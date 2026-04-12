---
sidebar_position: 2
---

# Erreurs et Défauts

## Deux types d'échecs

Effect distingue deux catégories d'échecs radicalement différentes.

### Erreurs (Failures)

Au sens d'`Effect` les _failures_ dont des erreurs **attendues et typées**. Elles font partie du contrat de la fonction le cas échéant.

<!-- prettier-ignore -->
```typescript
class ArticleNonTrouvé extends Data.TaggedError("ArticleNotFound")<{
  id: string;
}> {}

// Le type dit clairement : "peut échouer avec ArticleNotFound"
const getArticle = (id: string): Effect.Effect<Article, ArticleNotFound> =>
  // ...
```

- Apparaissent dans le **type** en tant que second paramètre (`Effect<A, MyError>`)
- Récupérables avec `Effect.catchTag` (une erreur) , `Effect.catchTags` (des erreurs), `Effect.catchAll` (toutes les erreurs)
- Représentent des cas **normaux** (utilisateur non trouvé, fichier absent, accès refusé)

### Défauts (Defects)

Les bugs **inattendus et non typés** sont des _defects_ dans le monde `Effect`. Ils ne devraient jamais se produire.

<!-- prettier-ignore -->
```typescript
// NullPointerException, StackOverflow, etc.
const myEffect = Effect.promise(() => computationThatMayFail());
// Pas d'erreur visible dans le type, en cas d'exception nous avons affaire à un defect
```

Les _defects_ sont donc :
- **Invisibles** dans le type (`Effect<A>`, même si ça peut bugger)
- Non récupérables avec `catchTag`
- Récupérables seulement avec `Effect.catchAllDefect` (traitement d'urgence)
- Représentent des bugs à **corriger**, pas à gérer

## Créer des erreurs typées

Comme évoqué précédemment on peut décrire des erreurs typées, les tags permettant de distinguer les différent cas.

<!-- prettier-ignore -->
```typescript
import { Data } from "effect";

// Erreur sans données additionnelles
class SimpleError extends Data.TaggedError("SimpleError")<{}> {}

// Erreur avec données
class ErrorWithMessage extends Data.TaggedError("ErrorWithMessage")<{
  message: string;
  code: number;
}> {}

// Utilisation
const error = new ErrorWithMessage({ message: "Oops", code: 500 });
console.log(erreur.message); // "Oops"
console.log(erreur._tag);    // "ErrorWithMessage"
```

## Récupérer des erreurs

### `Effect.catchTag` — une erreur spécifique

<!-- prettier-ignore -->
```typescript
const safe = pipe(
  monEffect,
  Effect.catchTag("ArticleNotFound", (erreur) => {
    // erreur.id est disponible (type sûr !)
    return Effect.succeed(null)
  })
)
```

### `Effect.catchTags` — plusieurs erreurs

<!-- prettier-ignore -->
```typescript
const safe = pipe(
  monEffect,
  Effect.catchTags({
    ArticleNotFound: (e) => Effect.succeed(null),
    NetworkError: (e) => Effect.fail(new ServerError())
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

✅ `ArticleNotFound`, `AccessDenied`, `InvalidFormat`
❌ `Error`, `Problem`, `Bug`
:::
